<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use RuntimeException;
use Throwable;

/**
 * Reads the reservations mailbox over IMAP and imports OTA booking emails
 * (new / updated / cancelled) as transfers.
 */
class ReservationMailboxSync
{
    public function __construct(private readonly HeytripEmailImportService $heytrip)
    {
    }

    public static function configured(): bool
    {
        return (bool) config('services.reservation_mail.enabled')
            && filled(config('services.reservation_mail.username'))
            && filled(config('services.reservation_mail.password'));
    }

    /** @return array{checked:int, imported:int, failed:int, errors:array<int, array{subject:string, error:string}>} */
    public function run(int $limit = 50): array
    {
        if (! function_exists('imap_open')) {
            throw new RuntimeException('PHP IMAP extension is not available.');
        }

        $cfg = config('services.reservation_mail');
        $mailbox = sprintf('{%s:%d/imap/%s}%s', $cfg['host'], $cfg['port'], $cfg['encryption'], $cfg['folder']);

        $imap = @imap_open($mailbox, $cfg['username'], $cfg['password'], 0, 1);
        if (! $imap) {
            throw new RuntimeException('IMAP login failed: '.imap_last_error());
        }

        $result = ['checked' => 0, 'imported' => 0, 'failed' => 0, 'errors' => []];

        try {
            $ids = imap_search($imap, 'SINCE "'.now()->subDays(14)->format('d-M-Y').'"') ?: [];
            $mailboxKey = $cfg['username'].'/'.$cfg['folder'];
            $attempted = 0;

            foreach ($ids as $id) {
                $header = imap_headerinfo($imap, $id);
                $from = strtolower(($header->from[0]->mailbox ?? '').'@'.($header->from[0]->host ?? ''));
                $subject = $this->decode((string) ($header->subject ?? ''));

                if (! str_contains($from, 'heytrip') && ! str_contains(strtolower($subject), 'heytrip')) {
                    continue;
                }

                $messageId = trim((string) ($header->message_id ?? ''));
                if ($messageId === '') {
                    $messageId = 'uid:'.imap_uid($imap, $id);
                }

                $messageKey = hash('sha256', $mailboxKey."\0".$messageId);

                if (DB::table('processed_mailbox_messages')
                    ->where('message_key', $messageKey)
                    ->exists()) {
                    continue;
                }

                if ($attempted >= $limit) {
                    break;
                }

                $attempted++;
                $result['checked']++;

                try {
                    $transfer = $this->heytrip->import($subject, $this->body($imap, $id));
                    DB::table('processed_mailbox_messages')->insertOrIgnore([
                        'message_key' => $messageKey,
                        'mailbox' => $mailboxKey,
                        'message_id' => $messageId,
                        'transfer_id' => $transfer->id,
                        'processed_at' => now(),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                    $result['imported']++;
                    Log::info('Reservation mail imported', [
                        'ref' => $transfer->ota_booking_reference,
                        'status' => $transfer->status,
                    ]);
                } catch (Throwable $e) {
                    $result['failed']++;
                    if (count($result['errors']) < 10) {
                        $result['errors'][] = [
                            'subject' => $subject,
                            'error' => $e->getMessage(),
                        ];
                    }
                    Log::warning('Reservation mail import failed', [
                        'subject' => $subject,
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        } finally {
            imap_close($imap);
        }

        return $result;
    }

    private function body($imap, int $id): string
    {
        $structure = imap_fetchstructure($imap, $id);
        $html = $plain = '';
        $this->walk($imap, $id, $structure, '', $html, $plain);

        return $html !== '' ? $html : $plain;
    }

    private function walk($imap, int $id, object $part, string $path, string &$html, string &$plain): void
    {
        if (! empty($part->parts)) {
            foreach ($part->parts as $index => $sub) {
                $subPath = $path === '' ? (string) ($index + 1) : $path.'.'.($index + 1);
                $this->walk($imap, $id, $sub, $subPath, $html, $plain);
            }

            return;
        }

        if ((int) $part->type !== 0) {
            return;
        }

        $raw = imap_fetchbody($imap, $id, $path === '' ? '1' : $path, FT_PEEK);
        $content = match ((int) $part->encoding) {
            3 => base64_decode($raw),
            4 => quoted_printable_decode($raw),
            default => $raw,
        };

        $charset = 'UTF-8';
        foreach (array_merge($part->parameters ?? [], $part->dparameters ?? []) as $param) {
            if (strtolower($param->attribute) === 'charset') {
                $charset = $param->value;
            }
        }

        if (strtoupper($charset) !== 'UTF-8') {
            $content = @mb_convert_encoding($content, 'UTF-8', $charset) ?: $content;
        }

        if (strtoupper($part->subtype ?? '') === 'HTML') {
            $html .= $content;
        } else {
            $plain .= $content;
        }
    }

    private function decode(string $value): string
    {
        return (string) (@iconv_mime_decode($value, 0, 'UTF-8') ?: $value);
    }
}

<?php

namespace App\Services;

use App\Jobs\SendPassengerTrackingSmsFallback;
use App\Models\PassengerNotificationDelivery;
use App\Models\Transfer;
use Illuminate\Support\Collection;
use LogicException;
use RuntimeException;
use Throwable;

class PassengerTrackingNotificationService
{
    public const NOTIFICATION_TYPE = 'tracking_link';

    public function __construct(
        private MetaWhatsAppService $metaWhatsApp
    ) {
    }

    public function prepare(Transfer $transfer): Collection
    {
        if (!$transfer->public_tracking_token) {
            throw new LogicException(
                'Yolcu takip bağlantısı henüz oluşturulmamış.'
            );
        }

        if (!$transfer->publicTrackingIsAvailable()) {
            throw new LogicException(
                'Yolcu takip bağlantısı kullanılamıyor veya süresi dolmuş.'
            );
        }

        $mode = strtolower((string) config(
            'services.passenger_tracking_notifications.mode',
            'dry_run'
        ));

        if (!in_array($mode, ['dry_run', 'live'], true)) {
            throw new LogicException(
                'PASSENGER_TRACKING_NOTIFICATION_MODE yalnızca dry_run veya live olabilir.'
            );
        }

        $passengerName = trim(
            (string) $transfer->passenger_name
        ) ?: 'Passenger';

        $trackingUrl = $transfer->publicTrackingUrl();

        $message = sprintf(
            'Hello %s, your driver is on the way. Track your vehicle here: %s',
            $passengerName,
            $trackingUrl
        );

        $channels = [
            [
                'channel' => 'whatsapp',
                'recipient' => $transfer->passenger_phone,
                'priority' => 1,
            ],
            [
                'channel' => 'sms',
                'recipient' => $transfer->passenger_phone,
                'priority' => 2,
            ],
            [
                'channel' => 'email',
                'recipient' => $transfer->passenger_email,
                'priority' => 3,
            ],
        ];

        $deliveries = collect($channels)->map(
            function (array $channel) use (
                $transfer,
                $mode,
                $trackingUrl,
                $message
            ): PassengerNotificationDelivery {
                $recipient = trim(
                    (string) ($channel['recipient'] ?? '')
                );

                return PassengerNotificationDelivery::query()
                    ->firstOrCreate(
                        [
                            'transfer_id' => $transfer->id,
                            'notification_type' => self::NOTIFICATION_TYPE,
                            'channel' => $channel['channel'],
                        ],
                        [
                            'status' => $recipient
                                ? 'prepared'
                                : 'unavailable',
                            'mode' => $mode,
                            'recipient' => $recipient ?: null,
                            'provider' => null,
                            'provider_message_id' => null,
                            'attempt_count' => 0,
                            'payload' => [
                                'message_preview' => $message,
                                'tracking_url' => $trackingUrl,
                                'booking_reference' =>
                                    $transfer->booking_reference,
                            ],
                            'metadata' => [
                                'priority' => $channel['priority'],
                                'fallback_order' => [
                                    'whatsapp',
                                    'sms',
                                    'email',
                                ],
                                'external_sent' => false,
                            ],
                            'error_message' => $recipient
                                ? null
                                : 'Bu kanal için yolcu iletişim bilgisi bulunamadı.',
                            'attempted_at' => null,
                            'sent_at' => null,
                            'failed_at' => null,
                        ]
                    );
            }
        );

        if ($mode === 'live') {
            $whatsAppDelivery = $deliveries->firstWhere(
                'channel',
                'whatsapp'
            );

            if (
                $whatsAppDelivery
                && $whatsAppDelivery->recipient
                && !in_array(
                    $whatsAppDelivery->status,
                    ['sent', 'delivered', 'read'],
                    true
                )
            ) {
                $this->sendWhatsApp(
                    $transfer,
                    $whatsAppDelivery,
                    $passengerName,
                    $trackingUrl
                );
            }
        }

        return $deliveries;
    }

    private function sendWhatsApp(
        Transfer $transfer,
        PassengerNotificationDelivery $delivery,
        string $passengerName,
        string $trackingUrl
    ): void {
        if ($delivery->attempt_count >= 3) {
            throw new LogicException(
                'WhatsApp gönderimi azami deneme sayısına ulaştı.'
            );
        }

        $delivery->update([
            'mode' => 'live',
            'status' => 'sending',
            'attempt_count' =>
                $delivery->attempt_count + 1,
            'attempted_at' => now(),
            'error_message' => null,
            'failed_at' => null,
        ]);

        try {
            $result = $this->metaWhatsApp
                ->sendPassengerTrackingTemplate(
                    (string) $delivery->recipient,
                    $passengerName,
                    (string) (
                        $transfer->booking_reference
                        ?: '#' . $transfer->id
                    ),
                    $trackingUrl
                );

            $messageId = trim(
                (string) ($result['message_id'] ?? '')
            );

            if ($messageId === '') {
                throw new RuntimeException(
                    'Meta WhatsApp mesaj kimliği döndürmedi.'
                );
            }

            $metadata = is_array($delivery->metadata)
                ? $delivery->metadata
                : [];

            $metadata['external_accepted'] = true;
            $metadata['external_sent'] = false;
            $metadata['meta_response'] =
                $result['response'] ?? null;

            $delivery->update([
                'status' => 'provider_accepted',
                'provider' =>
                    $result['provider']
                    ?? 'meta_whatsapp_cloud_api',
                'provider_message_id' => $messageId,
                'recipient' =>
                    $result['to']
                    ?? $delivery->recipient,
                'metadata' => $metadata,
                'error_message' => null,
                'failed_at' => null,
            ]);
        } catch (Throwable $exception) {
            $metadata = is_array($delivery->metadata)
                ? $delivery->metadata
                : [];

            $metadata['external_accepted'] = false;
            $metadata['external_sent'] = false;

            $delivery->update([
                'status' => 'failed',
                'provider' =>
                    'meta_whatsapp_cloud_api',
                'metadata' => $metadata,
                'error_message' =>
                    mb_substr(
                        $exception->getMessage(),
                        0,
                        5000
                    ),
                'failed_at' => now(),
            ]);

            SendPassengerTrackingSmsFallback::dispatch(
                (int) $transfer->id
            );

            return;
        }
    }
}
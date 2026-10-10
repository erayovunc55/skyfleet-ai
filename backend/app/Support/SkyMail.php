<?php

namespace App\Support;

use Illuminate\Contracts\Mail\Mailer;
use Illuminate\Support\Facades\Mail;

/**
 * Sends mail from a dedicated mailbox per audience (agency, supplier).
 * Falls back to the default mailer when the dedicated credentials are not configured.
 */
class SkyMail
{
    public static function mailer(string $audience): Mailer
    {
        return self::configured($audience)
            ? Mail::mailer($audience)
            : Mail::mailer();
    }

    public static function from(string $audience): array
    {
        $key = strtoupper($audience);

        if (self::configured($audience)) {
            return [
                (string) env("MAIL_{$key}_FROM_ADDRESS"),
                (string) env("MAIL_{$key}_FROM_NAME", config('mail.from.name')),
            ];
        }

        return [config('mail.from.address'), config('mail.from.name')];
    }

    public static function raw(string $audience, string $body, callable $callback): void
    {
        [$address, $name] = self::from($audience);

        self::mailer($audience)->raw($body, function ($message) use ($callback, $address, $name): void {
            $message->from($address, $name);
            $callback($message);
        });
    }

    private static function configured(string $audience): bool
    {
        return filled(config("mail.mailers.{$audience}.key"))
            && filled(env("MAIL_".strtoupper($audience)."_FROM_ADDRESS"));
    }
}
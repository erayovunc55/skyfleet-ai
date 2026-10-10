<?php

namespace App\Services;

use App\Mail\PassengerTrackingLinkMail;
use App\Models\PassengerNotificationDelivery;
use App\Models\Transfer;
use Illuminate\Support\Facades\Mail;
use LogicException;
use Throwable;

class PassengerTrackingEmailFallbackService
{
    public function send(
        Transfer $transfer
    ): PassengerNotificationDelivery {
        if (
            !$transfer->public_tracking_token
            || !$transfer->publicTrackingIsAvailable()
        ) {
            throw new LogicException(
                'Yolcu takip bağlantısı kullanılamıyor.'
            );
        }

        $smsDelivery =
            PassengerNotificationDelivery::query()
                ->where('transfer_id', $transfer->id)
                ->where(
                    'notification_type',
                    PassengerTrackingNotificationService::NOTIFICATION_TYPE
                )
                ->where('channel', 'sms')
                ->first();

        if (
            !$smsDelivery
            || !in_array(
                $smsDelivery->status,
                ['failed', 'unavailable'],
                true
            )
        ) {
            throw new LogicException(
                'SMS başarısız olmadan e-posta fallback gönderilemez.'
            );
        }

        $recipient = trim(
            (string) $transfer->passenger_email
        );

        $trackingUrl =
            $transfer->publicTrackingUrl();

        $bookingReference = (string) (
            $transfer->booking_reference
            ?: '#' . $transfer->id
        );

        $passengerName = trim(
            (string) $transfer->passenger_name
        ) ?: 'Passenger';

        $isValidRecipient = filter_var(
            $recipient,
            FILTER_VALIDATE_EMAIL
        ) !== false;

        $delivery =
            PassengerNotificationDelivery::query()
                ->firstOrCreate(
                    [
                        'transfer_id' => $transfer->id,
                        'notification_type' =>
                            PassengerTrackingNotificationService::NOTIFICATION_TYPE,
                        'channel' => 'email',
                    ],
                    [
                        'status' => $isValidRecipient
                            ? 'prepared'
                            : 'unavailable',
                        'mode' => 'dry_run',
                        'recipient' =>
                            $isValidRecipient
                                ? $recipient
                                : null,
                        'attempt_count' => 0,
                        'payload' => [
                            'tracking_url' =>
                                $trackingUrl,
                            'booking_reference' =>
                                $bookingReference,
                            'subject' =>
                                'Your driver is on the way - '
                                . $bookingReference,
                        ],
                        'metadata' => [
                            'priority' => 3,
                            'fallback_from' => 'sms',
                            'external_sent' => false,
                        ],
                        'error_message' =>
                            $isValidRecipient
                                ? null
                                : 'Geçerli yolcu e-posta adresi bulunamadı.',
                    ]
                );

        if (!$isValidRecipient) {
            $delivery->update([
                'status' => 'unavailable',
                'recipient' => null,
                'error_message' =>
                    'Geçerli yolcu e-posta adresi bulunamadı.',
            ]);

            return $delivery->fresh();
        }

        $mode = strtolower(
            (string) config(
                'services.passenger_tracking_notifications.mode',
                'dry_run'
            )
        );

        if ($mode !== 'live') {
            return $delivery;
        }

        if (
            in_array(
                $delivery->status,
                ['sent', 'delivered'],
                true
            )
        ) {
            return $delivery;
        }

        if ($delivery->attempt_count >= 3) {
            throw new LogicException(
                'E-posta gönderimi azami deneme sayısına ulaştı.'
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
            Mail::to($recipient)->send(
                new PassengerTrackingLinkMail(
                    $passengerName,
                    $bookingReference,
                    $trackingUrl
                )
            );

            $metadata = is_array($delivery->metadata)
                ? $delivery->metadata
                : [];

            $metadata['fallback_from'] = 'sms';
            $metadata['external_accepted'] = true;
            $metadata['external_sent'] = true;
            $metadata['mailer'] = config(
                'mail.default'
            );

            $delivery->update([
                'status' => 'sent',
                'mode' => 'live',
                'provider' => 'laravel_mail',
                'metadata' => $metadata,
                'error_message' => null,
                'sent_at' => now(),
                'failed_at' => null,
            ]);

            return $delivery->fresh();
        } catch (Throwable $exception) {
            $metadata = is_array($delivery->metadata)
                ? $delivery->metadata
                : [];

            $metadata['fallback_from'] = 'sms';
            $metadata['external_accepted'] = false;
            $metadata['external_sent'] = false;
            $metadata['mailer'] = config(
                'mail.default'
            );

            $delivery->update([
                'status' => 'failed',
                'mode' => 'live',
                'provider' => 'laravel_mail',
                'metadata' => $metadata,
                'error_message' => mb_substr(
                    $exception->getMessage(),
                    0,
                    5000
                ),
                'failed_at' => now(),
            ]);

            throw $exception;
        }
    }
}
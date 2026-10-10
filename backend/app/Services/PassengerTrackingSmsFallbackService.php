<?php

namespace App\Services;

use App\Jobs\SendPassengerTrackingEmailFallback;
use App\Models\PassengerNotificationDelivery;
use App\Models\Transfer;
use LogicException;
use RuntimeException;
use Throwable;

class PassengerTrackingSmsFallbackService
{
    public function __construct(
        private TwilioSmsService $twilioSms
    ) {
    }

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

        $whatsAppDelivery =
            PassengerNotificationDelivery::query()
                ->where('transfer_id', $transfer->id)
                ->where(
                    'notification_type',
                    PassengerTrackingNotificationService::NOTIFICATION_TYPE
                )
                ->where('channel', 'whatsapp')
                ->first();

        if (
            !$whatsAppDelivery
            || $whatsAppDelivery->status !== 'failed'
        ) {
            throw new LogicException(
                'WhatsApp başarısız olmadan SMS fallback gönderilemez.'
            );
        }

        $trackingUrl = $transfer->publicTrackingUrl();

        $message = sprintf(
            'Skyfleet: Your driver is on the way for %s. Track: %s',
            $transfer->booking_reference
                ?: '#' . $transfer->id,
            $trackingUrl
        );

        $recipient = trim(
            (string) $transfer->passenger_phone
        );

        $delivery =
            PassengerNotificationDelivery::query()
                ->firstOrCreate(
                    [
                        'transfer_id' => $transfer->id,
                        'notification_type' =>
                            PassengerTrackingNotificationService::NOTIFICATION_TYPE,
                        'channel' => 'sms',
                    ],
                    [
                        'status' => $recipient
                            ? 'prepared'
                            : 'unavailable',
                        'mode' => 'dry_run',
                        'recipient' =>
                            $recipient ?: null,
                        'attempt_count' => 0,
                        'payload' => [
                            'message_preview' => $message,
                            'tracking_url' => $trackingUrl,
                            'booking_reference' =>
                                $transfer->booking_reference,
                        ],
                        'metadata' => [
                            'priority' => 2,
                            'fallback_from' =>
                                'whatsapp',
                            'external_sent' => false,
                        ],
                        'error_message' => $recipient
                            ? null
                            : 'Yolcu telefon numarası bulunamadı.',
                    ]
                );

        if (!$recipient) {
            $delivery->update([
                'status' => 'unavailable',
                'error_message' =>
                    'Yolcu telefon numarası bulunamadı.',
            ]);

            SendPassengerTrackingEmailFallback::dispatch(
                (int) $transfer->id
            );

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
                [
                    'provider_accepted',
                    'sent',
                    'delivered',
                ],
                true
            )
        ) {
            return $delivery;
        }

        if ($delivery->attempt_count >= 3) {
            throw new LogicException(
                'SMS gönderimi azami deneme sayısına ulaştı.'
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
            $result = $this->twilioSms->send(
                $recipient,
                $message
            );

            $messageId = trim(
                (string) ($result['message_id'] ?? '')
            );

            if ($messageId === '') {
                throw new RuntimeException(
                    'Twilio mesaj kimliği döndürmedi.'
                );
            }

            $metadata = is_array($delivery->metadata)
                ? $delivery->metadata
                : [];

            $metadata['fallback_from'] = 'whatsapp';
            $metadata['external_accepted'] = true;
            $metadata['external_sent'] = false;
            $metadata['twilio_status'] =
                $result['status'] ?? null;
            $metadata['twilio_response'] =
                $result['response'] ?? null;

            $delivery->update([
                'status' => 'provider_accepted',
                'provider' =>
                    $result['provider']
                    ?? 'twilio_sms',
                'provider_message_id' =>
                    $messageId,
                'recipient' =>
                    $result['to']
                    ?? $recipient,
                'metadata' => $metadata,
                'error_message' => null,
                'failed_at' => null,
            ]);

            return $delivery->fresh();
        } catch (Throwable $exception) {
            $metadata = is_array($delivery->metadata)
                ? $delivery->metadata
                : [];

            $metadata['fallback_from'] = 'whatsapp';
            $metadata['external_accepted'] = false;
            $metadata['external_sent'] = false;

            $delivery->update([
                'status' => 'failed',
                'provider' => 'twilio_sms',
                'metadata' => $metadata,
                'error_message' => mb_substr(
                    $exception->getMessage(),
                    0,
                    5000
                ),
                'failed_at' => now(),
            ]);

            SendPassengerTrackingEmailFallback::dispatch(
                (int) $transfer->id
            );

            return $delivery->fresh();
        }
    }
}
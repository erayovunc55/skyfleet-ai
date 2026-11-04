<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class TwilioSmsService
{
    public function send(
        string $phone,
        string $message
    ): array {
        $accountSid = trim(
            (string) config('services.twilio.account_sid')
        );

        $authToken = trim(
            (string) config('services.twilio.auth_token')
        );

        $fromNumber = trim(
            (string) config('services.twilio.from_number')
        );

        $messagingServiceSid = trim(
            (string) config(
                'services.twilio.messaging_service_sid'
            )
        );

        $statusCallbackUrl = trim(
            (string) config(
                'services.twilio.status_callback_url'
            )
        );

        if ($accountSid === '') {
            throw new RuntimeException(
                'TWILIO_ACCOUNT_SID tanımlı değil.'
            );
        }

        if ($authToken === '') {
            throw new RuntimeException(
                'TWILIO_AUTH_TOKEN tanımlı değil.'
            );
        }

        if (
            $fromNumber === ''
            && $messagingServiceSid === ''
        ) {
            throw new RuntimeException(
                'TWILIO_FROM_NUMBER veya TWILIO_MESSAGING_SERVICE_SID tanımlanmalıdır.'
            );
        }

        $to = $this->normalizePhone($phone);

        if (!$to) {
            throw new RuntimeException(
                'Yolcu telefon numarası SMS gönderimi için geçersiz.'
            );
        }

        $body = trim($message);

        if ($body === '') {
            throw new RuntimeException(
                'SMS mesajı boş olamaz.'
            );
        }

        if (mb_strlen($body) > 1600) {
            throw new RuntimeException(
                'SMS mesajı 1600 karakterden uzun olamaz.'
            );
        }

        $payload = [
            'To' => $to,
            'Body' => $body,
        ];

        if ($messagingServiceSid !== '') {
            $payload['MessagingServiceSid'] =
                $messagingServiceSid;
        } else {
            $payload['From'] = $this->normalizePhone(
                $fromNumber
            );

            if (!$payload['From']) {
                throw new RuntimeException(
                    'TWILIO_FROM_NUMBER geçersiz.'
                );
            }
        }

        if ($statusCallbackUrl !== '') {
            if (
                !filter_var(
                    $statusCallbackUrl,
                    FILTER_VALIDATE_URL
                )
                || !str_starts_with(
                    strtolower($statusCallbackUrl),
                    'https://'
                )
            ) {
                throw new RuntimeException(
                    'TWILIO_STATUS_CALLBACK_URL geçerli bir HTTPS adresi olmalıdır.'
                );
            }

            $payload['StatusCallback'] =
                $statusCallbackUrl;
        }

        $url = sprintf(
            'https://api.twilio.com/2010-04-01/Accounts/%s/Messages.json',
            rawurlencode($accountSid)
        );

        $response = Http::withBasicAuth(
            $accountSid,
            $authToken
        )
            ->asForm()
            ->acceptJson()
            ->timeout(20)
            ->post($url, $payload);

        $responseBody = $response->json();

        if (!$response->successful()) {
            $providerMessage = data_get(
                $responseBody,
                'message'
            );

            throw new RuntimeException(
                'Twilio SMS gönderimi başarısız. HTTP '
                . $response->status()
                . (
                    $providerMessage
                        ? ' - ' . $providerMessage
                        : ''
                )
            );
        }

        $messageSid = trim(
            (string) data_get($responseBody, 'sid', '')
        );

        if ($messageSid === '') {
            throw new RuntimeException(
                'Twilio SMS mesaj kimliği döndürmedi.'
            );
        }

        return [
            'provider' => 'twilio_sms',
            'to' => $to,
            'message_id' => $messageSid,
            'status' => data_get(
                $responseBody,
                'status'
            ),
            'response' => $responseBody,
        ];
    }

    private function normalizePhone(
        string $phone
    ): ?string {
        $digits = preg_replace(
            '/\D+/',
            '',
            trim($phone)
        );

        if (
            !$digits
            || strlen($digits) < 8
            || strlen($digits) > 15
        ) {
            return null;
        }

        return '+' . $digits;
    }
}
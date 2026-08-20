<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class MetaWhatsAppService
{
    public function sendPassengerPickupTemplate(
        string $phone,
        string $passengerName,
        string $flightNumber
    ): array {
        $token = (string) config('services.meta_whatsapp.access_token');
        $phoneNumberId = (string) config('services.meta_whatsapp.phone_number_id');
        $graphVersion = (string) config('services.meta_whatsapp.graph_version');
        $templateName = (string) config('services.meta_whatsapp.template_name');
        $templateLanguage = (string) config('services.meta_whatsapp.template_language', 'en_US');

        foreach ([
            'META_WHATSAPP_ACCESS_TOKEN' => $token,
            'META_WHATSAPP_PHONE_NUMBER_ID' => $phoneNumberId,
            'META_WHATSAPP_GRAPH_VERSION' => $graphVersion,
            'META_WHATSAPP_TEMPLATE_NAME' => $templateName,
        ] as $key => $value) {
            if (!$value) {
                throw new RuntimeException($key . ' tanımlı değil.');
            }
        }

        $to = $this->normalizePhone($phone);

        if (!$to) {
            throw new RuntimeException('Yolcu telefon numarası WhatsApp gönderimi için geçersiz.');
        }

        $url = sprintf(
            'https://graph.facebook.com/%s/%s/messages',
            rawurlencode($graphVersion),
            rawurlencode($phoneNumberId)
        );

        $payload = [
            'messaging_product' => 'whatsapp',
            'recipient_type' => 'individual',
            'to' => $to,
            'type' => 'template',
            'template' => [
                'name' => $templateName,
                'language' => [
                    'code' => $templateLanguage,
                ],
                'components' => [
                    [
                        'type' => 'body',
                        'parameters' => [
                            [
                                'type' => 'text',
                                'text' => trim($passengerName) ?: 'Passenger',
                            ],
                            [
                                'type' => 'text',
                                'text' => trim($flightNumber),
                            ],
                        ],
                    ],
                ],
            ],
        ];

        $response = Http::withToken($token)
            ->acceptJson()
            ->timeout(20)
            ->post($url, $payload);

        $body = $response->json();

        if (!$response->successful()) {
            $providerMessage = data_get($body, 'error.message');
            throw new RuntimeException(
                'Meta WhatsApp gönderimi başarısız. HTTP '
                . $response->status()
                . ($providerMessage ? ' - ' . $providerMessage : '')
            );
        }

        return [
            'provider' => 'meta_whatsapp_cloud_api',
            'to' => $to,
            'message_id' => data_get($body, 'messages.0.id'),
            'response' => $body,
        ];
    }

    private function normalizePhone(string $phone): ?string
    {
        $digits = preg_replace('/\D+/', '', trim($phone));

        if (!$digits || strlen($digits) < 8 || strlen($digits) > 15) {
            return null;
        }

        return $digits;
    }
}

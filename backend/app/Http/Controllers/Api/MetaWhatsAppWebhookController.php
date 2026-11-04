<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\SendPassengerTrackingSmsFallback;
use App\Models\PassengerNotificationDelivery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class MetaWhatsAppWebhookController extends Controller
{
    public function verify(Request $request)
    {
        $mode = (string) $request->query(
            'hub_mode',
            $request->query('hub.mode', '')
        );

        $challenge = (string) $request->query(
            'hub_challenge',
            $request->query('hub.challenge', '')
        );

        $receivedToken = (string) $request->query(
            'hub_verify_token',
            $request->query('hub.verify_token', '')
        );

        $expectedToken = (string) config(
            'services.meta_whatsapp.verify_token'
        );

        if (
            $mode !== 'subscribe'
            || $expectedToken === ''
            || !hash_equals($expectedToken, $receivedToken)
        ) {
            return response()->json([
                'message' => 'Webhook doğrulaması başarısız.',
            ], 403);
        }

        return response(
            $challenge,
            200,
            ['Content-Type' => 'text/plain']
        );
    }

    public function receive(Request $request): JsonResponse
    {
        $appSecret = (string) config(
            'services.meta_whatsapp.app_secret'
        );

        if ($appSecret === '') {
            return response()->json([
                'message' => 'Webhook yapılandırılmamış.',
            ], 503);
        }

        $rawBody = $request->getContent();

        $expectedSignature = 'sha256=' . hash_hmac(
            'sha256',
            $rawBody,
            $appSecret
        );

        $receivedSignature = (string) $request->header(
            'X-Hub-Signature-256',
            ''
        );

        if (
            $receivedSignature === ''
            || !hash_equals(
                $expectedSignature,
                $receivedSignature
            )
        ) {
            Log::warning(
                'Geçersiz Meta WhatsApp webhook imzası.'
            );

            return response()->json([
                'message' => 'Geçersiz webhook imzası.',
            ], 401);
        }

        $statusCount = 0;

        foreach ($request->input('entry', []) as $entry) {
            foreach (data_get($entry, 'changes', []) as $change) {
                foreach (
                    data_get($change, 'value.statuses', [])
                    as $statusPayload
                ) {
                    if (is_array($statusPayload)) {
                        $this->recordStatus($statusPayload);
                        $statusCount++;
                    }
                }
            }
        }

        return response()->json([
            'received' => true,
            'status_count' => $statusCount,
        ]);
    }

    private function recordStatus(array $payload): void
    {
        $messageId = trim(
            (string) data_get($payload, 'id', '')
        );

        $metaStatus = strtolower(
            trim((string) data_get($payload, 'status', ''))
        );

        $allowedStatuses = [
            'sent',
            'delivered',
            'read',
            'failed',
        ];

        if (
            $messageId === ''
            || !in_array($metaStatus, $allowedStatuses, true)
        ) {
            return;
        }

        $delivery = PassengerNotificationDelivery::query()
            ->where('channel', 'whatsapp')
            ->where('provider_message_id', $messageId)
            ->first();

        if (!$delivery) {
            Log::notice(
                'Meta webhook mesaj kaydı bulunamadı.',
                ['provider_message_id' => $messageId]
            );

            return;
        }

        $metadata = is_array($delivery->metadata)
            ? $delivery->metadata
            : [];

        $metadata['meta_webhook'] = $payload;
        $metadata['external_sent'] = $metaStatus !== 'failed';

        $errorMessage = collect([
            data_get($payload, 'errors.0.code'),
            data_get($payload, 'errors.0.title'),
            data_get($payload, 'errors.0.message'),
            data_get($payload, 'errors.0.error_data.details'),
        ])->filter()->implode(' - ');

        $updates = [
            'status' => $metaStatus,
            'provider' => 'meta_whatsapp_cloud_api',
            'metadata' => $metadata,
            'attempted_at' => $delivery->attempted_at ?? now(),
            'error_message' => $metaStatus === 'failed'
                ? ($errorMessage ?: 'Meta teslimatı başarısız.')
                : null,
        ];

        if ($metaStatus === 'failed') {
            $updates['failed_at'] = now();
        } else {
            $updates['sent_at'] = $delivery->sent_at ?? now();
            $updates['failed_at'] = null;
        }

        $wasAlreadyFailed =
            $delivery->status === 'failed';

        $delivery->update($updates);

        if (
            $metaStatus === 'failed'
            && !$wasAlreadyFailed
        ) {
            SendPassengerTrackingSmsFallback::dispatch(
                (int) $delivery->transfer_id
            );
        }
    }
}
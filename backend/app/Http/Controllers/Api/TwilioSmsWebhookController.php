<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\SendPassengerTrackingEmailFallback;
use App\Models\PassengerNotificationDelivery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Twilio\Security\RequestValidator;

class TwilioSmsWebhookController extends Controller
{
    public function receive(
        Request $request
    ): JsonResponse {
        $authToken = trim(
            (string) config(
                'services.twilio.auth_token'
            )
        );

        $callbackUrl = trim(
            (string) config(
                'services.twilio.status_callback_url'
            )
        );

        if (
            $authToken === ''
            || $callbackUrl === ''
        ) {
            return response()->json([
                'message' =>
                    'Twilio webhook yapılandırılmamış.',
            ], 503);
        }

        $signature = (string) $request->header(
            'X-Twilio-Signature',
            ''
        );

        $validator = new RequestValidator(
            $authToken
        );

        if (
            $signature === ''
            || !$validator->validate(
                $signature,
                $callbackUrl,
                $request->post()
            )
        ) {
            Log::warning(
                'Geçersiz Twilio SMS webhook imzası.'
            );

            return response()->json([
                'message' =>
                    'Geçersiz webhook imzası.',
            ], 401);
        }

        $messageSid = trim(
            (string) $request->input(
                'MessageSid',
                ''
            )
        );

        $twilioStatus = strtolower(
            trim(
                (string) $request->input(
                    'MessageStatus',
                    ''
                )
            )
        );

        $statusMap = [
            'accepted' => 'provider_accepted',
            'scheduled' => 'provider_accepted',
            'queued' => 'provider_accepted',
            'sending' => 'sending',
            'sent' => 'sent',
            'delivered' => 'delivered',
            'read' => 'read',
            'failed' => 'failed',
            'undelivered' => 'failed',
        ];

        if (
            $messageSid === ''
            || !isset($statusMap[$twilioStatus])
        ) {
            return response()->json([
                'received' => true,
                'updated' => false,
            ]);
        }

        $delivery =
            PassengerNotificationDelivery::query()
                ->where('channel', 'sms')
                ->where(
                    'provider_message_id',
                    $messageSid
                )
                ->first();

        if (!$delivery) {
            Log::notice(
                'Twilio webhook SMS kaydı bulunamadı.',
                ['provider_message_id' => $messageSid]
            );

            return response()->json([
                'received' => true,
                'updated' => false,
            ]);
        }

        $nextStatus = $statusMap[$twilioStatus];

        if (
            $this->shouldIgnoreStatus(
                (string) $delivery->status,
                $nextStatus
            )
        ) {
            return response()->json([
                'received' => true,
                'updated' => false,
                'ignored' => true,
            ]);
        }

        $errorMessage = collect([
            $request->input('ErrorCode'),
            $request->input('ErrorMessage'),
        ])->filter(
            fn ($value) =>
                $value !== null
                && $value !== ''
        )->implode(' - ');

        $metadata = is_array($delivery->metadata)
            ? $delivery->metadata
            : [];

        $metadata['twilio_webhook'] =
            $request->post();

        $metadata['twilio_status'] =
            $twilioStatus;

        $metadata['external_accepted'] =
            $nextStatus !== 'failed';

        $metadata['external_sent'] =
            in_array(
                $nextStatus,
                ['sent', 'delivered', 'read'],
                true
            );

        $updates = [
            'status' => $nextStatus,
            'provider' => 'twilio_sms',
            'metadata' => $metadata,
            'attempted_at' =>
                $delivery->attempted_at ?? now(),
            'error_message' =>
                $nextStatus === 'failed'
                    ? (
                        $errorMessage
                        ?: 'Twilio SMS teslimatı başarısız.'
                    )
                    : null,
        ];

        if (
            in_array(
                $nextStatus,
                ['sent', 'delivered', 'read'],
                true
            )
        ) {
            $updates['sent_at'] =
                $delivery->sent_at ?? now();

            $updates['failed_at'] = null;
        }

        if ($nextStatus === 'failed') {
            $updates['failed_at'] = now();
        }

        $delivery->update($updates);

        if ($nextStatus === 'failed') {
            SendPassengerTrackingEmailFallback::dispatch(
                (int) $delivery->transfer_id
            );
        }

        return response()->json([
            'received' => true,
            'updated' => true,
            'status' => $nextStatus,
        ]);
    }

    private function shouldIgnoreStatus(
        string $currentStatus,
        string $nextStatus
    ): bool {
        if ($currentStatus === $nextStatus) {
            return true;
        }

        if (
            in_array(
                $currentStatus,
                ['delivered', 'read'],
                true
            )
        ) {
            return true;
        }

        if (
            $currentStatus === 'failed'
            && $nextStatus !== 'failed'
        ) {
            return true;
        }

        $rank = [
            'prepared' => 0,
            'provider_accepted' => 1,
            'sending' => 2,
            'sent' => 3,
            'delivered' => 4,
            'read' => 5,
        ];

        return isset(
            $rank[$currentStatus],
            $rank[$nextStatus]
        )
            && $rank[$nextStatus]
                < $rank[$currentStatus];
    }
}
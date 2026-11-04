<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transfer;
use App\Models\TransferSupportMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PassengerSupportController extends Controller
{
    public function index(string $token): JsonResponse
    {
        $transfer = $this->findTransferByToken($token);

        if (!$transfer) {
            return response()->json([
                'message' =>
                    'Takip bağlantısı geçersiz veya süresi dolmuş.',
            ], 404);
        }

        $messages = TransferSupportMessage::query()
            ->where('transfer_id', $transfer->id)
            ->orderBy('created_at')
            ->get()
            ->map(fn (TransferSupportMessage $message) => [
                'id' => $message->id,
                'sender_type' => $message->sender_type,
                'message' => $message->message,
                'translated_message' =>
                    $message->translated_message,
                'original_language' =>
                    $message->original_language,
                'translated_language' =>
                    $message->translated_language,
                'category' => $message->category,
                'priority' => $message->priority,
                'created_at' =>
                    $message->created_at?->toISOString(),
            ]);

        return response()->json([
            'data' => [
                'booking_reference' =>
                    $transfer->booking_reference,
                'messages' => $messages,
            ],
        ]);
    }

    public function store(
        Request $request,
        string $token
    ): JsonResponse {
        $transfer = $this->findTransferByToken($token);

        if (!$transfer) {
            return response()->json([
                'message' =>
                    'Takip bağlantısı geçersiz veya süresi dolmuş.',
            ], 404);
        }

        $validated = $request->validate([
            'message' => [
                'required',
                'string',
                'max:2000',
            ],
            'category' => [
                'nullable',
                'string',
                'in:general,driver_not_found,vehicle_not_arrived,help,emergency',
            ],
            'language' => [
                'nullable',
                'string',
                'max:10',
            ],
        ]);

        $category =
            $validated['category']
            ?? 'general';

        $priority =
            $this->resolvePriority($category);

        $message = TransferSupportMessage::create([
            'transfer_id' =>
                $transfer->id,
            'sender_type' =>
                'passenger',
            'sender_user_id' =>
                null,
            'message' =>
                trim($validated['message']),
            'original_language' =>
                $validated['language']
                ?? null,
            'translated_message' =>
                null,
            'translated_language' =>
                null,
            'category' =>
                $category,
            'priority' =>
                $priority,
            'is_read' =>
                false,
            'read_at' =>
                null,
            'metadata' => [
                'source' =>
                    'passenger_tracking',
                'user_agent' =>
                    $request->userAgent(),
                'ip_address' =>
                    $request->ip(),
            ],
        ]);

        return response()->json([
            'message' =>
                'Mesajınız operasyon ekibine iletildi.',
            'data' => [
                'id' =>
                    $message->id,
                'sender_type' =>
                    $message->sender_type,
                'message' =>
                    $message->message,
                'category' =>
                    $message->category,
                'priority' =>
                    $message->priority,
                'created_at' =>
                    $message
                        ->created_at
                        ?->toISOString(),
            ],
        ], 201);
    }

    private function findTransferByToken(
        string $token
    ): ?Transfer {
        $transfer = Transfer::query()
            ->where(
                'public_tracking_token',
                $token
            )
            ->first();

        if (
            !$transfer
            || !$transfer
                ->publicTrackingIsAvailable()
        ) {
            return null;
        }

        return $transfer;
    }

    private function resolvePriority(
        string $category
    ): string {
        return match ($category) {
            'emergency' =>
                'critical',

            'driver_not_found',
            'vehicle_not_arrived' =>
                'high',

            'help' =>
                'urgent',

            default =>
                'normal',
        };
    }
}
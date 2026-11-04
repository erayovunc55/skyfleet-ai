<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transfer;
use App\Models\TransferSupportMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminSupportController extends Controller
{
    public function index(): JsonResponse
    {
        $conversations = TransferSupportMessage::query()
            ->select('transfer_id')
            ->selectRaw('MAX(id) as last_message_id')
            ->selectRaw('MAX(created_at) as last_message_at')
            ->selectRaw("
                SUM(
                    CASE
                        WHEN sender_type = 'passenger'
                        AND is_read = 0
                        THEN 1
                        ELSE 0
                    END
                ) as unread_count
            ")
            ->groupBy('transfer_id')
            ->orderByDesc('last_message_at')
            ->get();

        $data = $conversations->map(function ($conversation) {
            $transfer = Transfer::query()
                ->find($conversation->transfer_id);

            $lastMessage = TransferSupportMessage::query()
                ->find($conversation->last_message_id);

            if (!$transfer || !$lastMessage) {
                return null;
            }

            return [
                'transfer_id' => $transfer->id,
                'booking_reference' => $transfer->booking_reference,
                'passenger_name' => $transfer->passenger_name,
                'passenger_phone' => $transfer->passenger_phone,
                'status' => $transfer->status,
                'pickup_time' => $transfer->pickup_time?->toISOString(),

                'last_message' => [
                    'id' => $lastMessage->id,
                    'sender_type' => $lastMessage->sender_type,
                    'message' => $lastMessage->message,
                    'category' => $lastMessage->category,
                    'priority' => $lastMessage->priority,
                    'created_at' => $lastMessage->created_at?->toISOString(),
                ],

                'unread_count' => (int) $conversation->unread_count,
            ];
        })
        ->filter()
        ->values();

        return response()->json([
            'data' => $data,
        ]);
    }

    public function show(
        Transfer $transfer
    ): JsonResponse {
        $messages = TransferSupportMessage::query()
            ->where('transfer_id', $transfer->id)
            ->orderBy('created_at')
            ->get();

        TransferSupportMessage::query()
            ->where('transfer_id', $transfer->id)
            ->where('sender_type', 'passenger')
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);

        return response()->json([
            'data' => [
                'transfer' => [
                    'id' => $transfer->id,
                    'booking_reference' => $transfer->booking_reference,
                    'passenger_name' => $transfer->passenger_name,
                    'passenger_phone' => $transfer->passenger_phone,
                    'passenger_email' => $transfer->passenger_email,
                    'status' => $transfer->status,
                    'pickup' => $transfer->pickup,
                    'dropoff' => $transfer->dropoff,
                    'pickup_time' => $transfer->pickup_time?->toISOString(),
                ],
                'messages' => $messages->map(
                    fn (TransferSupportMessage $message) => [
                        'id' => $message->id,
                        'sender_type' => $message->sender_type,
                        'sender_user_id' => $message->sender_user_id,
                        'message' => $message->message,
                        'original_language' => $message->original_language,
                        'translated_message' => $message->translated_message,
                        'translated_language' => $message->translated_language,
                        'category' => $message->category,
                        'priority' => $message->priority,
                        'is_read' => $message->is_read,
                        'read_at' => $message->read_at?->toISOString(),
                        'created_at' => $message->created_at?->toISOString(),
                    ]
                ),
            ],
        ]);
    }

    public function store(
        Request $request,
        Transfer $transfer
    ): JsonResponse {
        $validated = $request->validate([
            'message' => [
                'required',
                'string',
                'max:2000',
            ],
            'language' => [
                'nullable',
                'string',
                'max:10',
            ],
        ]);

        $user = $request->user();

        $message = TransferSupportMessage::create([
            'transfer_id' => $transfer->id,
            'sender_type' => 'operation',
            'sender_user_id' => $user?->id,
            'message' => trim($validated['message']),
            'original_language' => $validated['language'] ?? null,
            'translated_message' => null,
            'translated_language' => null,
            'category' => 'general',
            'priority' => 'normal',
            'is_read' => false,
            'read_at' => null,
            'metadata' => [
                'source' => 'operations_panel',
            ],
        ]);

        return response()->json([
            'message' => 'Operasyon yanıtı gönderildi.',
            'data' => [
                'id' => $message->id,
                'sender_type' => $message->sender_type,
                'sender_user_id' => $message->sender_user_id,
                'message' => $message->message,
                'category' => $message->category,
                'priority' => $message->priority,
                'created_at' => $message->created_at?->toISOString(),
            ],
        ], 201);
    }
}
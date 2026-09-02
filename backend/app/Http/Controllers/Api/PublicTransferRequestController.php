<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TransferRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class PublicTransferRequestController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'pickup' => ['required', 'string', 'max:1000'],
            'pickup_place_id' => ['nullable', 'string', 'max:255'],
            'pickup_lat' => [
                'nullable',
                'numeric',
                'between:-90,90',
                'required_with:pickup_lng',
            ],
            'pickup_lng' => [
                'nullable',
                'numeric',
                'between:-180,180',
                'required_with:pickup_lat',
            ],
            'dropoff' => ['required', 'string', 'max:1000'],
            'dropoff_place_id' => ['nullable', 'string', 'max:255'],
            'dropoff_lat' => [
                'nullable',
                'numeric',
                'between:-90,90',
                'required_with:dropoff_lng',
            ],
            'dropoff_lng' => [
                'nullable',
                'numeric',
                'between:-180,180',
                'required_with:dropoff_lat',
            ],
            'pickup_date' => ['required', 'date', 'after_or_equal:today'],
            'pickup_time' => ['required', 'date_format:H:i'],
            'timezone' => ['required', 'timezone'],
            'flight_number' => ['nullable', 'string', 'max:50'],
            'passengers' => ['required', 'integer', 'min:1', 'max:100'],
            'luggage_count' => ['nullable', 'integer', 'min:0', 'max:100'],
            'vehicle_type' => ['nullable', 'string', 'max:100'],
            'passenger_name' => ['required', 'string', 'max:255'],
            'passenger_phone' => ['required', 'string', 'max:50'],
            'passenger_email' => ['required', 'email:rfc', 'max:255'],
            'note' => ['nullable', 'string', 'max:3000'],
            'locale' => ['nullable', 'string', Rule::in(['en', 'tr'])],
            'terms_accepted' => ['accepted'],
        ]);

        $transferRequest = TransferRequest::query()->create([
            ...collect($validated)->except('terms_accepted')->all(),
            'request_reference' => $this->newReference(),
            'status' => TransferRequest::STATUS_NEW,
            'luggage_count' => $validated['luggage_count'] ?? 0,
            'locale' => $validated['locale'] ?? 'en',
            'source' => 'public_website',
        ]);

        return response()->json([
            'message' => 'Transfer request received.',
            'data' => [
                'request_reference' => $transferRequest->request_reference,
                'status' => $transferRequest->status,
            ],
        ], 201);
    }

    private function newReference(): string
    {
        do {
            $reference = 'STR-'.now()->format('Ymd').'-'
                .Str::upper(Str::random(6));
        } while (
            TransferRequest::query()
                ->where('request_reference', $reference)
                ->exists()
        );

        return $reference;
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\HeytripService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicHeytripQuoteController extends Controller
{
    public function __construct(private readonly HeytripService $heytrip)
    {
    }

    public function __invoke(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'pickup' => ['required', 'array'],
            'pickup.name' => ['required', 'string', 'max:255'],
            'pickup.address' => ['required', 'string', 'max:1000'],
            'pickup.latitude' => ['required', 'numeric', 'between:-90,90'],
            'pickup.longitude' => ['required', 'numeric', 'between:-180,180'],
            'pickup.country' => ['nullable', 'string', 'size:2'],
            'pickup.city' => ['nullable', 'string', 'max:100'],
            'pickup.iata' => ['nullable', 'string', 'size:3'],
            'dropoff' => ['required', 'array'],
            'dropoff.name' => ['required', 'string', 'max:255'],
            'dropoff.address' => ['required', 'string', 'max:1000'],
            'dropoff.latitude' => ['required', 'numeric', 'between:-90,90'],
            'dropoff.longitude' => ['required', 'numeric', 'between:-180,180'],
            'dropoff.country' => ['nullable', 'string', 'size:2'],
            'dropoff.city' => ['nullable', 'string', 'max:100'],
            'dropoff.iata' => ['nullable', 'string', 'size:3'],
            'pickup_datetime' => ['required', 'date'],
            'timezone' => ['required', 'timezone'],
            'passengers' => ['required', 'integer', 'min:1', 'max:100'],
            'adults' => ['nullable', 'integer', 'min:0', 'max:100'],
            'children' => ['nullable', 'integer', 'min:0', 'max:100'],
            'infants' => ['nullable', 'integer', 'min:0', 'max:100'],
            'luggage_count' => ['nullable', 'integer', 'min:0', 'max:100'],
            'currency' => ['nullable', 'string', 'size:3'],
            'transfer_type' => ['nullable', 'string', 'in:Airport2Point,Point2Airport,Point2Point'],
        ]);

        $pickupDateTime = Carbon::parse($validated['pickup_datetime'], $validated['timezone']);
        $luggageCount = (int) ($validated['luggage_count'] ?? 0);

        $payload = [
            'language' => config('services.heytrip.language', 'en-US'),
            'currency' => strtoupper($validated['currency'] ?? config('services.heytrip.currency', 'EUR')),
            'pickup' => $this->location($validated['pickup'], $pickupDateTime),
            'dropoff' => $this->location($validated['dropoff']),
            'passengerInfo' => [
                'totalCount' => (int) $validated['passengers'],
                'details' => [
                    'adult' => (int) ($validated['adults'] ?? $validated['passengers']),
                    'child' => (int) ($validated['children'] ?? 0),
                    'infant' => (int) ($validated['infants'] ?? 0),
                ],
            ],
            'luggageInfo' => [
                'totalCount' => $luggageCount,
                'details' => ['medium' => $luggageCount],
            ],
            'transferType' => $validated['transfer_type'] ?? 'Point2Point',
        ];

        return response()->json($this->heytrip->quote($payload));
    }

    private function location(array $location, ?Carbon $dateTime = null): array
    {
        $result = [
            'country' => $location['country'] ?? null,
            'city' => $location['city'] ?? null,
            'iata' => $location['iata'] ?? null,
            'name' => $location['name'],
            'address' => $location['address'],
            'longitude' => (float) $location['longitude'],
            'latitude' => (float) $location['latitude'],
        ];

        if ($dateTime) {
            $result['datetime'] = $dateTime->toIso8601String();
            $result['unixTimestamp'] = $dateTime->timestamp;
        }

        return array_filter($result, static fn ($value) => $value !== null && $value !== '');
    }
}

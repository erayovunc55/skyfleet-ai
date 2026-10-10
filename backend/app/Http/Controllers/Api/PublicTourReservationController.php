<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TransferRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class PublicTourReservationController extends Controller
{
    private const TOURS = [
        'B1' => [
            'title' => 'Prince Islands',
            'adult_price' => 35,
            'child_price' => 30,
            'currency' => 'USD',
        ],
    ];

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'tour_code' => ['required', 'string', Rule::in(array_keys(self::TOURS))],
            'tour_date' => ['required', 'date', 'after_or_equal:today'],
            'adults' => ['required', 'integer', 'min:1', 'max:100'],
            'children' => ['nullable', 'integer', 'min:0', 'max:100'],
            'infants' => ['nullable', 'integer', 'min:0', 'max:100'],
            'passenger_name' => ['required', 'string', 'max:255'],
            'passenger_phone' => ['required', 'string', 'max:50'],
            'passenger_email' => ['required', 'email:rfc', 'max:255'],
            'note' => ['nullable', 'string', 'max:3000'],
            'locale' => ['nullable', 'string', Rule::in(['en', 'tr'])],
            'terms_accepted' => ['accepted'],
        ]);

        $validator->after(function ($validator) use ($request): void {
            $passengers = (int) $request->input('adults', 0)
                + (int) $request->input('children', 0)
                + (int) $request->input('infants', 0);

            if ($passengers > 100) {
                $validator->errors()->add('adults', 'The total number of guests may not exceed 100.');
            }
        });

        $validated = $validator->validate();
        $tour = self::TOURS[$validated['tour_code']];
        $adults = (int) $validated['adults'];
        $children = (int) ($validated['children'] ?? 0);
        $infants = (int) ($validated['infants'] ?? 0);
        $total = $adults + $children + $infants;
        $price = $adults * $tour['adult_price'] + $children * $tour['child_price'];

        $reservation = TransferRequest::query()->create([
            'request_reference' => $this->newReference(),
            'request_type' => 'tour',
            'status' => TransferRequest::STATUS_NEW,
            'pickup' => 'Istanbul tour meeting point (to be confirmed)',
            'dropoff' => 'Prince Islands: Kinaliada and Buyukada',
            'pickup_date' => $validated['tour_date'],
            'pickup_time' => '08:30',
            'timezone' => 'Europe/Istanbul',
            'passengers' => $total,
            'luggage_count' => 0,
            'vehicle_type' => 'B1 tour',
            'passenger_name' => $validated['passenger_name'],
            'passenger_phone' => $validated['passenger_phone'],
            'passenger_email' => $validated['passenger_email'],
            'note' => $validated['note'] ?? null,
            'locale' => $validated['locale'] ?? 'en',
            'source' => 'public_tour_booking',
            'tour_code' => $validated['tour_code'],
            'tour_title' => $tour['title'],
            'tour_adults' => $adults,
            'tour_children' => $children,
            'tour_infants' => $infants,
            'tour_price_total' => $price,
            'tour_currency' => $tour['currency'],
            'pricing_snapshot' => [
                'tour_code' => $validated['tour_code'],
                'adult_price' => $tour['adult_price'],
                'child_price' => $tour['child_price'],
                'currency' => $tour['currency'],
                'total' => $price,
            ],
        ]);

        return response()->json([
            'message' => 'Tour reservation request received.',
            'data' => [
                'request_reference' => $reservation->request_reference,
                'status' => $reservation->status,
                'tour_title' => $tour['title'],
                'tour_date' => $validated['tour_date'],
                'passengers' => $total,
                'price' => $price,
                'currency' => $tour['currency'],
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

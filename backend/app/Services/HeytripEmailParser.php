<?php

namespace App\Services;

use Carbon\Carbon;
use RuntimeException;

class HeytripEmailParser
{
    public function parse(string $subject, string $body): array
    {
        $text = preg_replace('/\r\n?/', "\n", $body) ?: $body;
        $confirmation = $this->match($text, '/HeyTrip Confirmation Number:\s*([^\s\n]+)/i');
        if (! $confirmation) {
            throw new RuntimeException('HeyTrip confirmation number not found.');
        }

        $pickup = $this->location($this->match($text, '/Pickup From:\s*(.+?)(?=\n\n|\nPick up time)/is'));
        $dropoff = $this->location($this->match($text, '/Dropoff At:\s*(.+?)(?=\n\n|\nFlight number)/is'));
        $pickupDate = $this->match($text, '/Pick up time \(local time\):.*?\((\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\)/i');
        $vehicle = $this->match($text, '/Vehicle:\s*(.+)/i');
        $price = $this->match($text, '/Settlement Amount Total:\s*([0-9]+(?:\.[0-9]+)?)\s*([A-Z]{3})/i');
        preg_match('/Adult:\s*(\d+)\s*Child:\s*(\d+)/i', $text, $passengers);
        $status = preg_match('/\b(cancelled|canceled|cancel)\b/i', $subject."\n".$text) ? 'cancelled' : 'pending';

        preg_match('/Pickup From:.*?\((-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)\)/is', $text, $pickupCoordinates);
        preg_match('/Dropoff At:.*?\((-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)\)/is', $text, $dropoffCoordinates);

        return [
            'ota_booking_reference' => trim($confirmation),
            'ota_source' => 'heytrip_email',
            'booking_reference' => 'HT-'.trim($confirmation),
            'passenger_name' => $this->match($text, '/Passenger Information:[ \t]*\n[ \t]*Name:[ \t]*([^\r\n]*)/i') ?: 'HeyTrip passenger',
            'pickup' => trim($pickup),
            'pickup_lat' => isset($pickupCoordinates[1]) ? (float) $pickupCoordinates[1] : null,
            'pickup_lng' => isset($pickupCoordinates[2]) ? (float) $pickupCoordinates[2] : null,
            'dropoff' => trim($dropoff),
            'dropoff_lat' => isset($dropoffCoordinates[1]) ? (float) $dropoffCoordinates[1] : null,
            'dropoff_lng' => isset($dropoffCoordinates[2]) ? (float) $dropoffCoordinates[2] : null,
            'pickup_time' => $pickupDate ? Carbon::parse($pickupDate, config('app.timezone', 'UTC'))->utc() : null,
            'flight_number' => $this->match($text, '/Flight number:\s*([^\s\n]+)/i'),
            'vehicle_type' => $vehicle ? trim($vehicle) : null,
            'adult' => isset($passengers[1]) ? (int) $passengers[1] : 1,
            'child' => isset($passengers[2]) ? (int) $passengers[2] : 0,
            'baby' => 0,
            'luggage_count' => $this->extractCapacity($text, 'Luggage'),
            'price' => isset($price[1]) ? (float) $price[1] : null,
            'currency' => $price[2] ?? 'EUR',
            'passenger_note' => $this->match($text, '/Notes:\s*(.+?)(?=\n\n|\nSupplier Vehicle Type)/is'),
            'status' => $status,
        ];
    }

    private function location(?string $value): string
    {
        return trim(preg_replace('/\s+/', ' ', (string) $value));
    }

    private function match(string $text, string $pattern): ?string
    {
        return preg_match($pattern, $text, $matches) ? trim($matches[1]) : null;
    }

    private function extractCapacity(string $text, string $label): int
    {
        if (preg_match('/'.$label.':\s*(\d+)/i', $text, $matches)) {
            return (int) $matches[1];
        }

        return 0;
    }
}

<?php

namespace App\Services;

use Carbon\Carbon;
use RuntimeException;

class HeytripEmailParser
{
    public function parse(string $subject, string $body): array
    {
        $text = $this->normalize($body);

        $confirmation = $this->match($text, '/HeyTrip Confirmation Number\s*:?\s*([A-Z0-9]{10,})/i')
            ?: $this->match($subject, '/\b([A-Z]{2}[A-Z0-9]{8,})/i');

        if (! $confirmation) {
            throw new RuntimeException('HeyTrip confirmation number not found.');
        }

        $itinerary = $this->section($text, 'ITINERARY', 'SUPPLIER VEHICLE TYPE');
        $vehicleSection = $this->section($text, 'SUPPLIER VEHICLE TYPE', 'PRICE INCLUDES');
        $passenger = $this->section($text, 'PASSENGER INFORMATION', '\bPRICE\b(?!\s+INCLUDES)');
        $priceSection = $this->section($text, '\bPRICE\b(?!\s+INCLUDES)', null);

        $pickupLine = $this->line($itinerary, 'Pickup From');
        $dropoffLine = $this->line($itinerary, 'Dropoff At');
        [$pickup, $pickupLat, $pickupLng] = $this->addressAndCoordinates($pickupLine);
        [$dropoff, $dropoffLat, $dropoffLng] = $this->addressAndCoordinates($dropoffLine);

        $localTime = $this->match($itinerary, '/Pick up time.{0,300}?\((\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\)/is');
        if (! $localTime) {
            throw new RuntimeException('HeyTrip pickup time not found.');
        }

        $price = null;
        $currency = 'EUR';
        if (preg_match('/Settlement Amount\s*Total\s*:?\s*(?:([A-Z]{3})\s*([\d.,]+)|([\d.,]+)\s*([A-Z]{3}))/i', $priceSection ?: $text, $m)) {
            $currency = strtoupper($m[1] !== '' ? $m[1] : ($m[4] ?? 'EUR'));
            $price = (float) str_replace(',', '', $m[2] !== '' ? $m[2] : ($m[3] ?? '0'));
        }

        preg_match('/Adult\s*:?\s*(\d+)/i', $passenger, $adult);
        preg_match('/Child\s*:?\s*(\d+)/i', $passenger, $child);

        $vehicle = $this->line($vehicleSection, 'Name');
        $luggage = $this->match($vehicleSection, '/Luggage\s*:?\s*(\d+)/i');
        $phone = $this->line($passenger, 'Phone Number');
        $email = $this->match($passenger, '/([A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,})/i');

        return [
            'type' => $this->type($subject, $text),
            'ota_booking_reference' => trim($confirmation),
            'ota_source' => 'heytrip_email',
            'booking_reference' => 'HT-'.trim($confirmation),
            'passenger_name' => $this->line($passenger, 'Name') ?: 'HeyTrip passenger',
            'passenger_phone' => $phone ? trim($phone, " `") : null,
            'passenger_email' => $email,
            'pickup' => $pickup,
            'pickup_lat' => $pickupLat,
            'pickup_lng' => $pickupLng,
            'dropoff' => $dropoff,
            'dropoff_lat' => $dropoffLat,
            'dropoff_lng' => $dropoffLng,
            'pickup_time' => $localTime
                ? Carbon::parse($localTime, 'Europe/Istanbul')->utc()
                : null,
            'flight_number' => $this->line($itinerary, 'Flight number'),
            'vehicle_type' => $vehicle,
            'adult' => isset($adult[1]) ? (int) $adult[1] : 1,
            'child' => isset($child[1]) ? (int) $child[1] : 0,
            'baby' => 0,
            'luggage_count' => $luggage !== null ? (int) $luggage : 0,
            'price' => $price,
            'currency' => $currency,
            'passenger_note' => $this->line($itinerary, 'Notes') ?: $this->line($itinerary, 'Note'),
        ];
    }

    /** new | update | cancelled */
    private function type(string $subject, string $text): string
    {
        $head = $subject."\n".mb_substr($text, 0, 700);

        if (preg_match('/\b(cancel+ed|cancell?ation|cancel)\b/i', $head)) {
            return 'cancelled';
        }

        if (preg_match('/\b(amend\w*|modif\w*|updat\w*|chang\w*|revis\w*)\b/i', $head)) {
            return 'update';
        }

        return 'new';
    }

    private function normalize(string $body): string
    {
        $text = preg_replace('/\r\n?/', "\n", $body) ?: $body;

        if (preg_match('/<\s*(html|body|table|div|p|br)\b/i', $text)) {
            $text = preg_replace('/<(script|style)\b.*?<\/\1>/is', '', $text);
            $text = preg_replace('/<\s*(br|\/p|\/div|\/tr|\/li|\/h[1-6]|\/table)\s*\/?>/i', "\n", $text);
            $text = preg_replace('/<\s*\/(td|th)\s*>/i', ' ', $text);
            $text = strip_tags($text);
            $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        }

        $text = str_replace("\u{00A0}", ' ', $text);
        $lines = array_map(
            fn ($line) => trim(preg_replace('/[ \t]+/', ' ', str_replace(['**', '`'], '', $line))),
            explode("\n", $text)
        );

        return implode("\n", array_values(array_filter($lines, fn ($l) => $l !== '')));
    }

    private function section(string $text, string $from, ?string $to): string
    {
        if (! preg_match('/'.$from.'/i', $text, $start, PREG_OFFSET_CAPTURE)) {
            return '';
        }

        $rest = substr($text, $start[0][1] + strlen($start[0][0]));

        if ($to !== null && preg_match('/'.$to.'/i', $rest, $end, PREG_OFFSET_CAPTURE)) {
            $rest = substr($rest, 0, $end[0][1]);
        }

        return $rest;
    }

    /** Value of the first line that starts with the label (colon optional). */
    private function line(string $text, string $label): ?string
    {
        if (preg_match('/^\s*'.preg_quote($label, '/').'\s*:?\s*(.+)$/im', $text, $m)) {
            $value = trim($m[1]);

            return $value === '' ? null : $value;
        }

        return null;
    }

    private function addressAndCoordinates(?string $value): array
    {
        if (! $value) {
            return ['', null, null];
        }

        $value = preg_replace('/\[([^\]]*)\]\(https?:[^)]*\)/', '$1', $value);
        $lat = $lng = null;
        if (preg_match('/\(?\[?(-?\d{1,3}\.\d+),\s*(-?\d{1,3}\.\d+)\]?\)?\s*$/', $value, $m)) {
            $lat = (float) $m[1];
            $lng = (float) $m[2];
            $value = substr($value, 0, strrpos($value, $m[0]));
        }

        $value = preg_replace('/\(https?:\/\/[^)]*\)/', '', $value);

        return [trim(preg_replace('/\s+/', ' ', $value), " ,"), $lat, $lng];
    }

    private function match(string $text, string $pattern): ?string
    {
        return preg_match($pattern, $text, $matches) ? trim($matches[1]) : null;
    }
}
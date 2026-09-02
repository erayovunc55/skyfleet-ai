<?php

namespace App\Services;

use App\Models\Location;
use App\Models\Transfer;
use Illuminate\Support\Str;

class TransferLocationResolver
{
    public function apply(Transfer $transfer): Transfer
    {
        if (!$transfer->pickup_location_id) {
            $pickup = $this->resolve(
                $transfer->pickup,
                $transfer->pickup_lat,
                $transfer->pickup_lng,
            );

            if ($pickup) {
                $transfer->pickup_location_id = $pickup->id;
            }
        }

        if (!$transfer->dropoff_location_id) {
            $dropoff = $this->resolve(
                $transfer->dropoff,
                $transfer->dropoff_lat,
                $transfer->dropoff_lng,
            );

            if ($dropoff) {
                $transfer->dropoff_location_id = $dropoff->id;
            }
        }

        return $transfer;
    }

    public function resolve(
        ?string $address,
        int|float|string|null $latitude = null,
        int|float|string|null $longitude = null,
    ): ?Location {
        $text = trim((string) $address);

        if ($text === '') {
            return null;
        }

        if ($location = $this->resolveByCode($text)) {
            return $location;
        }

        if ($location = $this->resolveByName($text)) {
            return $location;
        }

        if (is_numeric($latitude) && is_numeric($longitude)) {
            return $this->resolveByCoordinates(
                (float) $latitude,
                (float) $longitude,
            );
        }

        return null;
    }

    private function resolveByCode(string $text): ?Location
    {
        preg_match_all(
            '/(?:\(|\b)([A-Z]{3})(?:\)|\b)/u',
            strtoupper($text),
            $matches,
        );

        $codes = array_values(array_unique($matches[1] ?? []));

        if ($codes === []) {
            return null;
        }

        return Location::query()
            ->where('is_active', true)
            ->whereIn('code', $codes)
            ->orderByRaw(
                'CASE WHEN code = ? THEN 0 ELSE 1 END',
                [$codes[0]],
            )
            ->first();
    }

    private function resolveByName(string $text): ?Location
    {
        $normalizedAddress = $this->normalize($text);

        return Location::query()
            ->where('is_active', true)
            ->where(function ($query): void {
                $query
                    ->whereNotNull('name')
                    ->orWhereNotNull('native_name');
            })
            ->get()
            ->first(function (Location $location) use ($normalizedAddress): bool {
                foreach ([$location->name, $location->native_name] as $name) {
                    if (!$name) {
                        continue;
                    }

                    $normalizedName = $this->normalize($name);

                    if (
                        mb_strlen($normalizedName) >= 5
                        && str_contains($normalizedAddress, $normalizedName)
                    ) {
                        return true;
                    }
                }

                return false;
            });
    }

    private function resolveByCoordinates(
        float $latitude,
        float $longitude,
    ): ?Location {
        $bestLocation = null;
        $bestDistance = null;

        $locations = Location::query()
            ->where('is_active', true)
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->get();

        foreach ($locations as $location) {
            $distance = $this->distanceMeters(
                $latitude,
                $longitude,
                (float) $location->latitude,
                (float) $location->longitude,
            );

            $radius = max(
                500,
                (int) ($location->geofence_radius_meters ?: 1500),
            );

            if ($distance > $radius) {
                continue;
            }

            if ($bestDistance === null || $distance < $bestDistance) {
                $bestLocation = $location;
                $bestDistance = $distance;
            }
        }

        return $bestLocation;
    }

    private function normalize(string $value): string
    {
        return Str::of($value)
            ->ascii()
            ->lower()
            ->replaceMatches('/[^a-z0-9]+/', ' ')
            ->squish()
            ->toString();
    }

    private function distanceMeters(
        float $lat1,
        float $lng1,
        float $lat2,
        float $lng2,
    ): float {
        $earthRadius = 6371000;

        $latDelta = deg2rad($lat2 - $lat1);
        $lngDelta = deg2rad($lng2 - $lng1);

        $a = sin($latDelta / 2) ** 2
            + cos(deg2rad($lat1))
            * cos(deg2rad($lat2))
            * sin($lngDelta / 2) ** 2;

        return $earthRadius * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }
}

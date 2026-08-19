<?php

namespace App\Services;

use App\Models\Supplier;
use App\Models\SupplierCoverage;
use App\Models\Transfer;
use Illuminate\Support\Collection;

class SupplierMatchingService
{
    public function forTransfer(Transfer $transfer): Collection
    {
        $pickupLocationId = $transfer->pickup_location_id ? (int) $transfer->pickup_location_id : null;
        $dropoffLocationId = $transfer->dropoff_location_id ? (int) $transfer->dropoff_location_id : null;

        if (!$pickupLocationId && !$dropoffLocationId) {
            return collect();
        }

        $coverages = SupplierCoverage::query()
            ->where('is_active', true)
            ->where(function ($query) use ($pickupLocationId, $dropoffLocationId) {
                if ($pickupLocationId) {
                    $query->orWhere(function ($pickup) use ($pickupLocationId) {
                        $pickup->where('location_id', $pickupLocationId)
                            ->where('pickup_enabled', true);
                    });
                }

                if ($dropoffLocationId) {
                    $query->orWhere(function ($dropoff) use ($dropoffLocationId) {
                        $dropoff->where('location_id', $dropoffLocationId)
                            ->where('dropoff_enabled', true);
                    });
                }
            })
            ->with([
                'supplier' => fn ($query) => $query
                    ->withCount(['vehicles', 'users'])
                    ->where('status', Supplier::STATUS_APPROVED)
                    ->where('is_active', true),
                'location:id,name,code,country_id,city_id',
            ])
            ->get()
            ->filter(fn (SupplierCoverage $coverage) => $coverage->supplier !== null)
            ->groupBy('supplier_id');

        return $coverages->map(function (Collection $rows) use ($pickupLocationId, $dropoffLocationId) {
            /** @var SupplierCoverage $first */
            $first = $rows->first();
            $supplier = $first->supplier;

            $pickupMatch = $pickupLocationId
                ? $rows->first(fn (SupplierCoverage $coverage) =>
                    (int) $coverage->location_id === $pickupLocationId && $coverage->pickup_enabled)
                : null;

            $dropoffMatch = $dropoffLocationId
                ? $rows->first(fn (SupplierCoverage $coverage) =>
                    (int) $coverage->location_id === $dropoffLocationId && $coverage->dropoff_enabled)
                : null;

            $score = 0;
            $reasons = [];

            if ($pickupMatch) {
                $score += 70;
                $reasons[] = 'pickup_coverage';
            }

            if ($dropoffMatch) {
                $score += 25;
                $reasons[] = 'dropoff_coverage';
            }

            if ($supplier->vehicles_count > 0) {
                $score += 3;
                $reasons[] = 'vehicle_capacity_available';
            }

            if ($supplier->users_count > 0) {
                $score += 2;
                $reasons[] = 'driver_team_available';
            }

            return [
                'supplier_id' => $supplier->id,
                'company_name' => $supplier->company_name,
                'status' => $supplier->status,
                'is_active' => (bool) $supplier->is_active,
                'country_code' => $supplier->country_code,
                'city' => $supplier->city,
                'score' => min(100, $score),
                'match_level' => $pickupMatch && $dropoffMatch ? 'full' : 'partial',
                'pickup_match' => (bool) $pickupMatch,
                'dropoff_match' => (bool) $dropoffMatch,
                'vehicles_count' => (int) $supplier->vehicles_count,
                'drivers_count' => (int) $supplier->users_count,
                'reasons' => $reasons,
                'coverage' => [
                    'pickup' => $pickupMatch ? [
                        'id' => $pickupMatch->id,
                        'location_id' => $pickupMatch->location_id,
                        'service_radius_meters' => $pickupMatch->service_radius_meters,
                    ] : null,
                    'dropoff' => $dropoffMatch ? [
                        'id' => $dropoffMatch->id,
                        'location_id' => $dropoffMatch->location_id,
                        'service_radius_meters' => $dropoffMatch->service_radius_meters,
                    ] : null,
                ],
            ];
        })
            ->sortByDesc('score')
            ->values();
    }
}
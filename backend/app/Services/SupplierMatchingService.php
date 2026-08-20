<?php

namespace App\Services;

use App\Models\Supplier;
use App\Models\SupplierCoverage;
use App\Models\Transfer;
use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

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
                    $query->orWhere(fn ($pickup) => $pickup->where('location_id', $pickupLocationId)->where('pickup_enabled', true));
                }
                if ($dropoffLocationId) {
                    $query->orWhere(fn ($dropoff) => $dropoff->where('location_id', $dropoffLocationId)->where('dropoff_enabled', true));
                }
            })
            ->with([
                'supplier' => fn ($query) => $query->where('status', Supplier::STATUS_APPROVED)->where('is_active', true),
                'location:id,name,code,country_id,city_id',
            ])
            ->get()
            ->filter(fn (SupplierCoverage $coverage) => $coverage->supplier !== null)
            ->groupBy('supplier_id');

        $supplierIds = $coverages->keys()->map(fn ($id) => (int) $id)->values();

        $vehiclesBySupplier = Vehicle::query()
            ->whereIn('supplier_id', $supplierIds)
            ->where('is_active', true)
            ->where('operational_status', 'active')
            ->get(['id','supplier_id','plate','brand','model','vehicle_type','passenger_capacity','luggage_capacity'])
            ->groupBy('supplier_id');

        $driversBySupplier = User::query()
            ->whereIn('supplier_id', $supplierIds)
            ->where('role', 'driver')
            ->where('is_active', true)
            ->get(['id','supplier_id','name','vehicle_id'])
            ->groupBy('supplier_id');

        // Reliability uses only finished operations. Active/pending transfers
        // must never lower a supplier's historical performance score.
        $performanceBySupplier = Transfer::query()
            ->whereIn('supplier_id', $supplierIds)
            ->whereIn('status', ['completed', 'no_show', 'cancelled'])
            ->selectRaw("supplier_id, COUNT(*) as total_count, SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count, SUM(CASE WHEN status = 'no_show' THEN 1 ELSE 0 END) as no_show_count, SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_count")
            ->groupBy('supplier_id')
            ->get()
            ->keyBy('supplier_id');

        $passengerCount = max(1, (int) ($transfer->adult ?? 0) + (int) ($transfer->child ?? 0) + (int) ($transfer->baby ?? 0));
        $luggageCount = max(0, (int) ($transfer->luggage_count ?? 0));
        $requestedVehicleType = trim((string) ($transfer->vehicle_type ?? ''));

        return $coverages
            ->map(function (Collection $rows) use ($pickupLocationId, $dropoffLocationId, $vehiclesBySupplier, $driversBySupplier, $performanceBySupplier, $passengerCount, $luggageCount, $requestedVehicleType) {
                /** @var SupplierCoverage $first */
                $first = $rows->first();
                $supplier = $first->supplier;

                $pickupMatch = $pickupLocationId ? $rows->first(fn (SupplierCoverage $coverage) => (int) $coverage->location_id === $pickupLocationId && $coverage->pickup_enabled) : null;
                $dropoffMatch = $dropoffLocationId ? $rows->first(fn (SupplierCoverage $coverage) => (int) $coverage->location_id === $dropoffLocationId && $coverage->dropoff_enabled) : null;

                $vehicles = $vehiclesBySupplier->get($supplier->id, collect());
                $drivers = $driversBySupplier->get($supplier->id, collect());

                $capacityVehicles = $vehicles->filter(fn (Vehicle $vehicle) => !$vehicle->passenger_capacity || $vehicle->passenger_capacity >= $passengerCount);
                $luggageVehicles = $capacityVehicles->filter(fn (Vehicle $vehicle) => $luggageCount === 0 || !$vehicle->luggage_capacity || $vehicle->luggage_capacity >= $luggageCount);
                $typeVehicles = $luggageVehicles->filter(fn (Vehicle $vehicle) => $this->vehicleTypeMatches($requestedVehicleType, (string) $vehicle->vehicle_type, (string) $vehicle->brand, (string) $vehicle->model));
                $bestVehicle = $typeVehicles->first() ?? $luggageVehicles->first() ?? $capacityVehicles->first() ?? $vehicles->first();

                $score = 0;
                $reasons = [];
                $warnings = [];

                if ($pickupMatch) { $score += 45; $reasons[] = 'pickup_coverage'; }
                if ($dropoffMatch) { $score += 20; $reasons[] = 'dropoff_coverage'; }
                if ($vehicles->isNotEmpty()) { $score += 3; $reasons[] = 'operational_vehicle_available'; } else { $warnings[] = 'no_operational_vehicle'; }
                if ($capacityVehicles->isNotEmpty()) { $score += 7; $reasons[] = 'passenger_capacity_fit'; } else { $warnings[] = 'passenger_capacity_unavailable'; }
                if ($luggageCount === 0 || $luggageVehicles->isNotEmpty()) { $score += 3; $reasons[] = 'luggage_capacity_fit'; } else { $warnings[] = 'luggage_capacity_unavailable'; }
                if ($requestedVehicleType !== '') {
                    if ($typeVehicles->isNotEmpty()) { $score += 3; $reasons[] = 'vehicle_type_fit'; } else { $warnings[] = 'vehicle_type_not_confirmed'; }
                }
                if ($drivers->isNotEmpty()) { $score += 4; $reasons[] = 'active_driver_available'; } else { $warnings[] = 'no_active_driver'; }

                $performance = $this->performanceSnapshot($performanceBySupplier->get($supplier->id));
                $score += $performance['score_bonus'];
                if ($performance['sample_sufficient']) {
                    $reasons[] = 'supplier_performance_tracked';
                    if ($performance['reliability_score'] >= 85) $reasons[] = 'high_supplier_reliability';
                    if ($performance['reliability_score'] < 60) $warnings[] = 'low_supplier_reliability';
                } else {
                    $warnings[] = 'limited_supplier_history';
                }

                $eligible = ($pickupMatch || $dropoffMatch) && $capacityVehicles->isNotEmpty() && $drivers->isNotEmpty();

                return [
                    'supplier_id' => $supplier->id,
                    'company_name' => $supplier->company_name,
                    'status' => $supplier->status,
                    'is_active' => (bool) $supplier->is_active,
                    'country_code' => $supplier->country_code,
                    'city' => $supplier->city,
                    'score' => min(100, max(0, $score)),
                    'eligible' => $eligible,
                    'match_level' => $this->matchLevel($pickupLocationId, $dropoffLocationId, (bool) $pickupMatch, (bool) $dropoffMatch, $eligible),
                    'pickup_match' => (bool) $pickupMatch,
                    'dropoff_match' => (bool) $dropoffMatch,
                    'vehicles_count' => $vehicles->count(),
                    'drivers_count' => $drivers->count(),
                    'passenger_count' => $passengerCount,
                    'luggage_count' => $luggageCount,
                    'reasons' => $reasons,
                    'warnings' => $warnings,
                    'performance' => $performance,
                    'best_vehicle' => $bestVehicle ? [
                        'id' => $bestVehicle->id,
                        'plate' => $bestVehicle->plate,
                        'brand' => $bestVehicle->brand,
                        'model' => $bestVehicle->model,
                        'vehicle_type' => $bestVehicle->vehicle_type,
                        'passenger_capacity' => $bestVehicle->passenger_capacity,
                        'luggage_capacity' => $bestVehicle->luggage_capacity,
                    ] : null,
                    'coverage' => [
                        'pickup' => $pickupMatch ? ['id'=>$pickupMatch->id,'location_id'=>$pickupMatch->location_id,'service_radius_meters'=>$pickupMatch->service_radius_meters] : null,
                        'dropoff' => $dropoffMatch ? ['id'=>$dropoffMatch->id,'location_id'=>$dropoffMatch->location_id,'service_radius_meters'=>$dropoffMatch->service_radius_meters] : null,
                    ],
                ];
            })
            ->sort(function (array $a, array $b): int {
                if ($a['eligible'] !== $b['eligible']) return $a['eligible'] ? -1 : 1;
                if ($a['score'] !== $b['score']) return $b['score'] <=> $a['score'];
                return ($b['performance']['reliability_score'] ?? 0) <=> ($a['performance']['reliability_score'] ?? 0);
            })
            ->values();
    }

    private function performanceSnapshot($row): array
    {
        $total = (int) ($row->total_count ?? 0);
        $completed = (int) ($row->completed_count ?? 0);
        $noShow = (int) ($row->no_show_count ?? 0);
        $cancelled = (int) ($row->cancelled_count ?? 0);
        $sampleSufficient = $total >= 5;

        if ($total === 0) {
            return [
                'total_transfers' => 0,
                'completed_transfers' => 0,
                'no_show_transfers' => 0,
                'cancelled_transfers' => 0,
                'completion_rate' => null,
                'no_show_rate' => null,
                'cancellation_rate' => null,
                'reliability_score' => null,
                'score_bonus' => 0,
                'sample_sufficient' => false,
            ];
        }

        $completionRate = round(($completed / $total) * 100, 1);
        $noShowRate = round(($noShow / $total) * 100, 1);
        $cancellationRate = round(($cancelled / $total) * 100, 1);
        $reliability = max(0, min(100, round($completionRate - ($noShowRate * 1.5) - $cancellationRate, 1)));
        $bonus = $sampleSufficient ? (int) round(($reliability / 100) * 15) : 0;

        return [
            'total_transfers' => $total,
            'completed_transfers' => $completed,
            'no_show_transfers' => $noShow,
            'cancelled_transfers' => $cancelled,
            'completion_rate' => $completionRate,
            'no_show_rate' => $noShowRate,
            'cancellation_rate' => $cancellationRate,
            'reliability_score' => $reliability,
            'score_bonus' => $bonus,
            'sample_sufficient' => $sampleSufficient,
        ];
    }

    private function vehicleTypeMatches(string $requested, string $vehicleType, string $brand, string $model): bool
    {
        if ($requested === '') return true;
        $requestedNormalized = Str::of($requested)->lower()->ascii()->replaceMatches('/[^a-z0-9]+/', ' ')->squish()->value();
        $candidate = Str::of(trim($vehicleType.' '.$brand.' '.$model))->lower()->ascii()->replaceMatches('/[^a-z0-9]+/', ' ')->squish()->value();
        if ($candidate === '') return false;
        foreach (preg_split('/\s+/', $requestedNormalized) ?: [] as $token) {
            if (strlen($token) >= 4 && str_contains($candidate, $token)) return true;
        }
        return false;
    }

    private function matchLevel(?int $pickupLocationId, ?int $dropoffLocationId, bool $pickupMatch, bool $dropoffMatch, bool $eligible): string
    {
        if (!$eligible) return 'review';
        $knownSides = ($pickupLocationId ? 1 : 0) + ($dropoffLocationId ? 1 : 0);
        $matchedSides = ($pickupMatch ? 1 : 0) + ($dropoffMatch ? 1 : 0);
        return $knownSides > 0 && $knownSides === $matchedSides ? 'full' : 'partial';
    }
}

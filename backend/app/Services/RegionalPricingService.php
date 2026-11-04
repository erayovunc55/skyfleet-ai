<?php

namespace App\Services;

use App\Models\Location;
use App\Models\SupplierCoverage;
use InvalidArgumentException;

class RegionalPricingService
{
    public function calculate(
        float $latitude,
        float $longitude,
        string $direction,
        string $vehicleType,
        int $airportLocationId
    ): array {
        if (
            !in_array(
                $direction,
                [
                    'pickup',
                    'dropoff',
                ],
                true
            )
        ) {
            throw new InvalidArgumentException(
                'Direction must be pickup or dropoff.'
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Seçilen havalimanını doğrula
        |--------------------------------------------------------------------------
        */

        $airportLocation = Location::query()
            ->whereKey($airportLocationId)
            ->whereNotNull('airport_id')
            ->where('is_active', true)
            ->first();

        if (!$airportLocation) {
            return [
                'available' => false,
                'message' =>
                    'Selected airport is not available for regional pricing.',
                'suppliers' => [],
            ];
        }

        /*
        |--------------------------------------------------------------------------
        | Yalnızca seçilen havalimanına bağlı kapsama alanlarını ara
        |--------------------------------------------------------------------------
        |
        | Örnek:
        |
        | SAW + Taksim
        |
        | burada IST polygonları kesinlikle hesaba katılmaz.
        |
        */

        $prices = SupplierCoverage::query()
            ->with(
                'supplier:id,company_name'
            )
            ->where(
                'location_id',
                $airportLocation->id
            )
            ->where(
                'coverage_type',
                'polygon'
            )
            ->where(
                'is_active',
                true
            )
            ->where(
                $direction === 'pickup'
                    ? 'pickup_enabled'
                    : 'dropoff_enabled',
                true
            )
            ->get()
            ->map(
                function (
                    SupplierCoverage $coverage
                ) use (
                    $latitude,
                    $longitude,
                    $vehicleType,
                    $direction
                ): ?array {
                    $polygon =
                        $coverage->polygon;

                    if (
                        !is_array($polygon) ||
                        count($polygon) < 3 ||
                        !$this->contains(
                            $polygon,
                            $latitude,
                            $longitude
                        )
                    ) {
                        return null;
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | Araç fiyatı
                    |--------------------------------------------------------------------------
                    */

                    $vehiclePrices =
    $coverage->vehicle_prices ?? [];

$directionPrices =
    $vehiclePrices[$direction] ?? [];

/*
|--------------------------------------------------------------------------
| Vehicle-specific pricing
|--------------------------------------------------------------------------
|
| Eğer bu coverage kaydında araç bazlı fiyatlandırma kullanılıyorsa,
| seçilen araç sınıfının fiyatı mutlaka tanımlı olmalıdır.
|
| Örnek:
|
| standard_car = 34 EUR
| executive_car = 48 EUR
| luxury_car = boş
|
| Kullanıcı Luxury seçerse base_price'e düşmeyiz.
| Bu durumda o araç sınıfı için fiyat bulunamadı kabul edilir.
|
| Eski coverage kayıtlarında hiç vehicle_prices yoksa geriye dönük
| uyumluluk için base_price kullanılmaya devam eder.
|
*/

$hasVehiclePricing =
    !empty($vehiclePrices['pickup'])
    ||
    !empty($vehiclePrices['dropoff']);

if ($hasVehiclePricing) {
    $price =
        $directionPrices[$vehicleType]
        ?? null;
} else {
    $price =
        $coverage->base_price;
}

if (
    !is_numeric($price)
    ||
    (float) $price < 0
) {
    return null;
}

                    return [
                        'supplier_id' =>
                            $coverage->supplier_id,

                        'supplier_name' =>
                            $coverage->supplier
                                ?->company_name,

                        'coverage_id' =>
                            $coverage->id,

                        'coverage_label' =>
                            $coverage->label,

                        'provider_price' =>
                            round(
                                (float) $price,
                                2
                            ),

                        'currency' =>
                            $coverage->currency
                            ?: 'EUR',
                    ];
                }
            )
            ->filter()
            ->values();

        /*
        |--------------------------------------------------------------------------
        | Uygun fiyat yok
        |--------------------------------------------------------------------------
        */

        if ($prices->isEmpty()) {
            return [
                'available' => false,

                'airport_location_id' =>
                    $airportLocation->id,

                'airport_code' =>
                    $airportLocation->code,

                'direction' =>
                    $direction,

                'vehicle_type' =>
                    $vehicleType,

                'message' =>
                    'No supplier price is configured for this airport, region and vehicle type.',

                'suppliers' => [],
            ];
        }

        /*
        |--------------------------------------------------------------------------
        | Para birimi güvenliği
        |--------------------------------------------------------------------------
        |
        | Şimdilik farklı currency kayıtlarını birbirine karıştırmıyoruz.
        | İlk bulunan para birimi esas alınır.
        |
        */

        $currency =
            $prices->first()['currency'];

        $sameCurrencyPrices =
            $prices
                ->filter(
                    fn (array $row): bool =>
                        $row['currency'] ===
                        $currency
                )
                ->values();

        $values =
            $sameCurrencyPrices
                ->pluck(
                    'provider_price'
                )
                ->map(
                    fn ($value) =>
                        (float) $value
                )
                ->values();

        $lowest =
            $values->min();

        $highest =
            $values->max();

        /*
        |--------------------------------------------------------------------------
        | Supplier ortalaması
        |--------------------------------------------------------------------------
        */

        $supplierAverage =
            round(
                (
                    $lowest +
                    $highest
                ) / 2,
                2
            );

        /*
        |--------------------------------------------------------------------------
        | Skyfleet markup
        |--------------------------------------------------------------------------
        */

        $commissionPercent =
            (float) config(
                'services.regional_pricing.commission_percent',
                23
            );

        $customerPrice =
            round(
                $supplierAverage *
                (
                    1 +
                    (
                        $commissionPercent /
                        100
                    )
                ),
                2
            );

        return [
            'available' => true,

            'airport_location_id' =>
                $airportLocation->id,

            'airport_id' =>
                $airportLocation->airport_id,

            'airport_code' =>
                $airportLocation->code,

            'airport_name' =>
                $airportLocation->name,

            'direction' =>
                $direction,

            'vehicle_type' =>
                $vehicleType,

            'currency' =>
                $currency,

            'supplier_count' =>
                $sameCurrencyPrices->count(),

            'lowest_supplier_price' =>
                $lowest,

            'highest_supplier_price' =>
                $highest,

            'supplier_average_price' =>
                $supplierAverage,

            'commission_percent' =>
                $commissionPercent,

            'customer_price' =>
                $customerPrice,

            'suppliers' =>
                $sameCurrencyPrices->all(),
        ];
    }

    private function contains(
        array $polygon,
        float $latitude,
        float $longitude
    ): bool {
        $inside = false;

        $count =
            count($polygon);

        for (
            $index = 0,
            $previous = $count - 1;
            $index < $count;
            $previous = $index++
        ) {
            $current =
                $polygon[$index];

            $prior =
                $polygon[$previous];

            if (
                !is_array($current) ||
                !is_array($prior) ||
                count($current) < 2 ||
                count($prior) < 2
            ) {
                continue;
            }

            $currentLat =
                (float) $current[0];

            $currentLng =
                (float) $current[1];

            $priorLat =
                (float) $prior[0];

            $priorLng =
                (float) $prior[1];

            $intersects =
                (
                    ($currentLng > $longitude) !==
                    ($priorLng > $longitude)
                )
                &&
                (
                    $latitude <
                    (
                        (
                            ($priorLat - $currentLat) *
                            ($longitude - $currentLng)
                        )
                        /
                        (
                            ($priorLng - $currentLng)
                            ?: 0.0000001
                        )
                    )
                    +
                    $currentLat
                );

            if ($intersects) {
                $inside =
                    !$inside;
            }
        }

        return $inside;
    }
}
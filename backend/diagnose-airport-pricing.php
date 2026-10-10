<?php

// Read-only CLI report: put beside artisan and run php diagnose-airport-pricing.php.
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

try {
    $pricing = $app->make(App\Services\AirportTaxiPricingService::class);
    $report = [];
    foreach (['IST', 'SAW'] as $code) {
        $airports = App\Models\Airport::query()
            ->with('country')
            ->where('iata_code', $code)
            ->get();
        $records = [];
        foreach ($airports as $airport) {
            $countryIso = strtoupper(trim((string) $airport->country?->iso2));
            $locations = App\Models\Location::withTrashed()
                ->where('airport_id', $airport->id)
                ->get();
            $records[] = [
                'airport_id' => $airport->id,
                'country_iso' => $countryIso,
                'country_active' => (bool) $airport->country?->is_active,
                'airport_active' => (bool) $airport->is_active,
                'scheduled_service' => $airport->metadata['scheduled_service'] ?? null,
                'market_configured' => array_key_exists($countryIso, config('taxi_pricing.markets', [])),
                'airport_allowlisted' => in_array($code, config('taxi_pricing.international_airports.' . $countryIso, []), true),
                'pricing_market_enabled' => $pricing->marketEnabled($airport),
                'locations' => $locations->map(fn ($location) => [
                    'location_id' => $location->id,
                    'active' => (bool) $location->is_active,
                    'public' => (bool) $location->is_public,
                    'deleted' => $location->trashed(),
                    'has_coordinates' => $location->latitude !== null && $location->longitude !== null,
                    'active_supplier_coverage_count' => App\Models\SupplierCoverage::query()
                        ->where('location_id', $location->id)
                        ->where('is_active', true)
                        ->count(),
                ])->all(),
            ];
        }
        $report[$code] = ['airport_count' => $airports->count(), 'records' => $records];
    }
    echo json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR) . PHP_EOL;
} catch (Throwable $error) {
    fwrite(STDERR, 'Diagnostic failed (' . get_class($error) . '). Check the Laravel log on the server.' . PHP_EOL);
    exit(1);
}

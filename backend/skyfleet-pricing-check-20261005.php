<?php

// Temporary, token-protected, read-only pricing diagnostic.
ini_set('display_errors', '0');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private');
header('X-Robots-Tag: noindex, nofollow');
header('Referrer-Policy: no-referrer');
header('X-Content-Type-Options: nosniff');

$key = PHP_SAPI === 'cli' ? ($argv[1] ?? '') : ($_GET['key'] ?? '');
if (!is_string($key) || !hash_equals('38a671b0ef8f2a89f6f23808460e1d64a67d1a74c23f01e7c3a7e5cd5ca8a3f9', hash('sha256', $key))) {
    http_response_code(404);
    echo '{"message":"Not found"}';
    exit(1);
}

function pricingCheckReport(array $report, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
}

try {
    $root = null;
    $candidates = [];
    $indexFile = __DIR__ . '/index.php';
    if (is_readable($indexFile)) {
        // Read path literals only; never execute the website's index.php.
        $indexSource = file_get_contents($indexFile);
        preg_match_all(
            '~([\'\"])([^\'\"\r\n]+)\1~',
            $indexSource,
            $pathMatches,
            PREG_OFFSET_CAPTURE
        );
        foreach ($pathMatches[2] as [$literal, $offset]) {
            $prefix = substr($indexSource, max(0, $offset - 100), min(100, $offset));
            $base = null;
            if (preg_match('/dirname\(\s*__DIR__\s*(?:,\s*(\d+))?\s*\)\s*\.\s*[\'\"]$/', $prefix, $match)) {
                $base = dirname(__DIR__, max(1, (int) ($match[1] ?? 1)));
            } elseif (preg_match('/__DIR__\s*\.\s*[\'\"]$/', $prefix)) {
                $base = __DIR__;
            }
            $path = $base !== null ? $base . $literal : $literal;
            if ($base === null && !preg_match('~^(?:/|[a-zA-Z]:[\\\\/])~', $path)) {
                $path = __DIR__ . '/' . $path;
            }
            if (str_ends_with($path, '/vendor/autoload.php') || str_ends_with($path, '/bootstrap/app.php')) {
                $candidates[] = dirname($path, 2);
            } else {
                // Also handles a literal directory assigned to $backendPath.
                $candidates[] = rtrim($path, '/');
            }
        }
    }
    $candidates = array_merge($candidates, [__DIR__, dirname(__DIR__), dirname(__DIR__) . '/backend', dirname(__DIR__, 2) . '/backend']);
    foreach ($candidates as $candidate) {
        if (is_file($candidate . '/vendor/autoload.php') && is_file($candidate . '/bootstrap/app.php')) {
            $root = realpath($candidate);
            break;
        }
    }
    if ($root === null) {
        // Check nearby deployment folders within the hosting account, without
        // recursive traversal or opening environment files.
        $nearbyRoots = [];
        foreach ([__DIR__, dirname(__DIR__), dirname(__DIR__, 2)] as $base) {
            foreach (['/*/bootstrap/app.php', '/*/backend/bootstrap/app.php'] as $pattern) {
                foreach (glob($base . $pattern) ?: [] as $bootstrap) {
                    $candidate = dirname($bootstrap, 2);
                    if (is_file($candidate . '/vendor/autoload.php')) {
                        $nearbyRoots[] = realpath($candidate);
                    }
                }
            }
        }
        $nearbyRoots = array_values(array_unique(array_filter($nearbyRoots)));
        if (count($nearbyRoots) === 1) {
            $root = $nearbyRoots[0];
        } elseif (count($nearbyRoots) > 1) {
            pricingCheckReport([
                'status' => 'multiple_laravel_roots',
                'message' => 'Birden fazla Laravel projesi bulundu. api/index.php icindeki vendor/autoload.php ve bootstrap/app.php satirlarini paylasin.',
            ], 500);
            exit;
        }
    }
    if ($root === null) {
        pricingCheckReport([
            'status' => 'laravel_root_not_found',
            'message' => 'Laravel klasoru bulunamadi. api/index.php icindeki vendor/autoload.php ve bootstrap/app.php satirlarini paylasin.',
        ], 500);
        exit;
    }

    // Validate the tariff file before Laravel loads configuration, so a broken
    // upload cannot hide its own diagnostic behind a bootstrap exception.
    $tariffFile = $root . '/database/data/airport_taxi_tariffs.json';
    if (!is_readable($tariffFile)) {
        pricingCheckReport([
            'status' => 'tariff_file_missing_or_unreadable',
            'tariff_file' => str_replace('\\', '/', $tariffFile),
            'message' => 'Tarife JSON dosyasi bulunamadi veya okunamiyor.',
        ], 500);
        exit;
    }
    $tariffContent = file_get_contents($tariffFile);
    try {
        $tariffs = json_decode($tariffContent, true, 512, JSON_THROW_ON_ERROR);
        if (!is_array($tariffs) || !array_is_list($tariffs)) {
            throw new JsonException('Tariff JSON must be a list.');
        }
    } catch (JsonException $error) {
        pricingCheckReport([
            'status' => 'invalid_tariff_json',
            'tariff_file' => str_replace('\\', '/', $tariffFile),
            'file_bytes' => strlen($tariffContent),
            'utf8_bom' => str_starts_with($tariffContent, "\xEF\xBB\xBF"),
            'json_error' => $error->getMessage(),
            'message' => 'Tarife JSON dosyasini verilen ZIP icindeki dosyayla yeniden yukleyin.',
        ], 500);
        exit;
    }

    require $root . '/vendor/autoload.php';
    $app = require $root . '/bootstrap/app.php';
    $app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
    $pricing = $app->make(App\Services\AirportTaxiPricingService::class);
    $diskConfig = is_file($root . '/config/taxi_pricing.php')
        ? require $root . '/config/taxi_pricing.php'
        : [];
    $report = [
        'status' => 'ok',
        'laravel_root' => str_replace('\\', '/', $root),
        'taxi_pricing_file' => str_replace('\\', '/', $root . '/config/taxi_pricing.php'),
        'taxi_pricing_file_exists' => is_file($root . '/config/taxi_pricing.php'),
        'configuration_cached' => $app->configurationIsCached(),
        'loaded_turkey_market' => array_key_exists('TR', config('taxi_pricing.markets', [])),
        'file_turkey_market' => array_key_exists('TR', $diskConfig['markets'] ?? []),
        'loaded_turkey_airport_codes' => config('taxi_pricing.international_airports.TR', []),
        'file_turkey_airport_codes' => $diskConfig['international_airports']['TR'] ?? [],
        'pricing_controller_dependencies' => array_map(
            fn ($parameter) => (string) $parameter->getType(),
            (new ReflectionClass(App\Http\Controllers\Api\PublicRegionalPricingController::class))
                ->getConstructor()?->getParameters() ?? []
        ),
        'airports' => [],
    ];

    foreach (['IST', 'SAW'] as $code) {
        $airports = App\Models\Airport::query()->with('country')->where('iata_code', $code)->get();
        $records = [];
        foreach ($airports as $airport) {
            $iso = strtoupper(trim((string) $airport->country?->iso2));
            $records[] = [
                'airport_id' => $airport->id,
                'country_iso' => $iso,
                'country_active' => (bool) $airport->country?->is_active,
                'airport_active' => (bool) $airport->is_active,
                'scheduled_service' => $airport->metadata['scheduled_service'] ?? null,
                'market_configured' => array_key_exists($iso, config('taxi_pricing.markets', [])),
                'airport_allowlisted' => in_array($code, config('taxi_pricing.international_airports.' . $iso, []), true),
                'pricing_market_enabled' => $pricing->marketEnabled($airport),
                'locations' => App\Models\Location::withTrashed()->where('airport_id', $airport->id)->get()
                    ->map(fn ($location) => [
                        'location_id' => $location->id,
                        'active' => (bool) $location->is_active,
                        'public' => (bool) $location->is_public,
                        'deleted' => $location->trashed(),
                        'has_coordinates' => $location->latitude !== null && $location->longitude !== null,
                        'active_supplier_coverage_count' => App\Models\SupplierCoverage::query()
                            ->where('location_id', $location->id)->where('is_active', true)->count(),
                        'coverage_settings' => App\Models\SupplierCoverage::query()
                            ->where('location_id', $location->id)->where('is_active', true)->get()
                            ->map(fn ($coverage) => [
                                'coverage_id' => $coverage->id,
                                'type' => $coverage->coverage_type,
                                'pickup_enabled' => (bool) $coverage->pickup_enabled,
                                'dropoff_enabled' => (bool) $coverage->dropoff_enabled,
                                'polygon_points' => is_array($coverage->polygon) ? count($coverage->polygon) : 0,
                                'base_price_positive' => is_numeric($coverage->base_price) && (float) $coverage->base_price > 0,
                                'pickup_vehicle_types' => array_keys($coverage->vehicle_prices['pickup'] ?? []),
                                'dropoff_vehicle_types' => array_keys($coverage->vehicle_prices['dropoff'] ?? []),
                            ])->all(),
                        'marmara_taksim_price_checks' => array_map(function ($vehicle) use ($app, $location) {
                            $result = $app->make(App\Services\RegionalPricingService::class)->calculate(
                                41.0364373, 28.9863444, 'pickup', $vehicle, $location->id
                            );
                            return [
                                'vehicle_type' => $vehicle,
                                'available' => (bool) ($result['available'] ?? false),
                                'matched_supplier_count' => count($result['suppliers'] ?? []),
                                'message' => $result['message'] ?? null,
                            ];
                        }, ['executive_people_carrier', 'executive_car', 'luxury_car']),
                    ])->all(),
            ];
        }
        $report['airports'][$code] = ['airport_count' => $airports->count(), 'records' => $records];
    }
    pricingCheckReport($report);
} catch (Throwable $error) {
    pricingCheckReport([
        'status' => 'diagnostic_failed',
        'error_type' => get_class($error),
        'message' => 'Kontrol tamamlanamadi. Laravel hata kaydini kontrol edin.',
    ], 500);
}

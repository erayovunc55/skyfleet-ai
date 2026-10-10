<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use Throwable;

class CurrencyService
{
    public function supportedCurrencies(): array
    {
        return array_values(
            array_unique(
                array_map(
                    fn ($currency) => strtoupper(trim((string) $currency)),
                    config('currency.supported_currencies', [
                        'TRY',
                        'EUR',
                        'USD',
                        'GBP',
                    ])
                )
            )
        );
    }

    public function isSupported(string $currency): bool
    {
        return in_array(
            strtoupper(trim($currency)),
            $this->supportedCurrencies(),
            true
        );
    }

    public function convert(
        float $amount,
        string $from,
        string $to
    ): array {
        $from = strtoupper(trim($from));
        $to = strtoupper(trim($to));

        if (!$this->isSupported($from)) {
            throw new RuntimeException(
                "Unsupported source currency: {$from}"
            );
        }

        if (!$this->isSupported($to)) {
            throw new RuntimeException(
                "Unsupported display currency: {$to}"
            );
        }

        if ($amount < 0) {
            throw new RuntimeException(
                'Currency conversion amount cannot be negative.'
            );
        }

        if ($from === $to) {
            return [
                'amount' => $this->roundAmount($amount),
                'from' => $from,
                'to' => $to,
                'rate' => 1.0,
                'source' => 'identity',
                'reference_date' => now()->toDateString(),
                'fetched_at' => now()->toIso8601String(),
                'stale' => false,
            ];
        }

        $rate = $this->rate($from, $to);

        return [
            'amount' => $this->roundAmount(
                $amount * (float) $rate['rate']
            ),
            'from' => $from,
            'to' => $to,
            'rate' => (float) $rate['rate'],
            'source' => $rate['source'],
            'reference_date' => $rate['reference_date'],
            'fetched_at' => $rate['fetched_at'],
            'stale' => (bool) ($rate['stale'] ?? false),
        ];
    }

    public function rate(
        string $from,
        string $to
    ): array {
        $from = strtoupper(trim($from));
        $to = strtoupper(trim($to));

        if ($from === $to) {
            return [
                'rate' => 1.0,
                'source' => 'identity',
                'reference_date' => now()->toDateString(),
                'fetched_at' => now()->toIso8601String(),
                'stale' => false,
            ];
        }

        $cacheKey = "currency:fx:{$from}:{$to}";
        $lastKnownKey = "currency:fx:last:{$from}:{$to}";

        $cached = Cache::get($cacheKey);

        if (is_array($cached)) {
            return $cached;
        }

        try {
            $response = Http::acceptJson()
                ->connectTimeout(
                    max(
                        1,
                        (int) config(
                            'currency.connect_timeout_seconds',
                            3
                        )
                    )
                )
                ->timeout(
                    max(
                        1,
                        (int) config(
                            'currency.timeout_seconds',
                            8
                        )
                    )
                )
                ->retry(1, 250, throw: false)
                ->get(
                    config(
                        'currency.endpoint',
                        'https://api.frankfurter.app/latest'
                    ),
                    [
                        'from' => $from,
                        'to' => $to,
                    ]
                );
        } catch (ConnectionException|Throwable $exception) {
            report($exception);

            return $this->staleOrFail(
                $lastKnownKey,
                $from,
                $to
            );
        }

        if (!$response->successful()) {
            report(
                new RuntimeException(
                    sprintf(
                        'FX provider failed with HTTP %s.',
                        $response->status()
                    )
                )
            );

            return $this->staleOrFail(
                $lastKnownKey,
                $from,
                $to
            );
        }

        $rate = $response->json("rates.{$to}");

        if (!is_numeric($rate) || (float) $rate <= 0) {
            return $this->staleOrFail(
                $lastKnownKey,
                $from,
                $to
            );
        }

        $data = [
            'rate' => (float) $rate,
            'source' => (string) config(
                'currency.provider',
                'frankfurter'
            ),
            'reference_date' => (string) (
                $response->json('date')
                ?? now()->toDateString()
            ),
            'fetched_at' => now()->toIso8601String(),
            'stale' => false,
        ];

        Cache::put(
            $cacheKey,
            $data,
            now()->addSeconds(
                max(
                    60,
                    (int) config(
                        'currency.cache_ttl_seconds',
                        21600
                    )
                )
            )
        );

        Cache::forever(
            $lastKnownKey,
            $data
        );

        return $data;
    }

    private function staleOrFail(
        string $lastKnownKey,
        string $from,
        string $to
    ): array {
        if (
            config(
                'currency.allow_stale_fallback',
                true
            )
        ) {
            $lastKnown = Cache::get(
                $lastKnownKey
            );

            if (
                is_array($lastKnown)
                && isset($lastKnown['rate'])
                && is_numeric($lastKnown['rate'])
                && (float) $lastKnown['rate'] > 0
            ) {
                $lastKnown['stale'] = true;

                return $lastKnown;
            }
        }

        throw new RuntimeException(
            "Currency conversion unavailable for {$from}/{$to}."
        );
    }

    private function roundAmount(float $amount): float
    {
        return round(
            $amount,
            max(
                0,
                (int) config(
                    'currency.decimal_places',
                    2
                )
            )
        );
    }
}

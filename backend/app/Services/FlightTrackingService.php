<?php

namespace App\Services;

use App\Models\FlightStatusSnapshot;
use App\Models\Transfer;
use Carbon\Carbon;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class FlightTrackingService
{
    public function sync(Transfer $transfer): FlightStatusSnapshot
    {
        if (!$transfer->flight_number) {
            throw new RuntimeException('Transfer için uçuş numarası bulunamadı.');
        }

        $provider = config('services.flight_tracking.provider', 'aviationstack');

        return match ($provider) {
            'aviationstack' => $this->syncAviationstack($transfer),
            default => throw new RuntimeException('Desteklenmeyen flight tracking provider: ' . $provider),
        };
    }

    private function syncAviationstack(Transfer $transfer): FlightStatusSnapshot
    {
        $accessKey = config('services.flight_tracking.key');

        if (!$accessKey) {
            throw new RuntimeException('FLIGHT_TRACKING_API_KEY tanımlı değil.');
        }

        $flightNumber = strtoupper(preg_replace('/\s+/', '', $transfer->flight_number));

        /*
         * Aviationstack Free plan real-time flight data sağlar; ancak tarih
         * filtreleri historical/future flight erişimine girebildiği için plan
         * kısıtlaması oluşturabilir. Bu nedenle canlı sorguda yalnızca IATA
         * uçuş numarasını gönderiyoruz ve dönen adaylar arasından transfer
         * saatine en yakın kaydı aşağıda seçiyoruz.
         */
        $response = Http::timeout(15)
            ->retry(2, 500)
            ->get('https://api.aviationstack.com/v1/flights', [
                'access_key' => $accessKey,
                'flight_iata' => $flightNumber,
                'limit' => 20,
            ]);

        $payload = $response->json();

        if (!$response->successful()) {
            $providerCode = data_get($payload, 'error.code');
            $providerMessage = data_get($payload, 'error.message');

            throw new RuntimeException(
                trim(implode(' ', array_filter([
                    'Uçuş sağlayıcısı hatası.',
                    $providerCode ? '[' . $providerCode . ']' : null,
                    $providerMessage,
                    'HTTP ' . $response->status(),
                ])))
            );
        }

        $items = is_array($payload['data'] ?? null) ? $payload['data'] : [];

        if ($items === []) {
            $providerError = data_get($payload, 'error.message');
            throw new RuntimeException(
                $providerError ?: $flightNumber . ' için aktif uçuş kaydı bulunamadı.'
            );
        }

        $flight = $this->selectBestFlight($items, $transfer);
        $arrival = is_array($flight['arrival'] ?? null) ? $flight['arrival'] : [];
        $departure = is_array($flight['departure'] ?? null) ? $flight['departure'] : [];

        $scheduled = $this->parseDate($arrival['scheduled'] ?? null);
        $estimated = $this->parseDate($arrival['estimated'] ?? null);
        $actual = $this->parseDate($arrival['actual'] ?? null);

        $delay = $arrival['delay'] ?? null;
        if ($delay === null && $scheduled && ($estimated || $actual)) {
            $comparison = $actual ?: $estimated;
            $delay = (int) $scheduled->diffInMinutes($comparison, false);
        }

        return FlightStatusSnapshot::query()->create([
            'transfer_id' => $transfer->id,
            'provider' => 'aviationstack',
            'flight_number' => data_get($flight, 'flight.iata') ?: $flightNumber,
            'status' => $flight['flight_status'] ?? null,
            'airline_name' => data_get($flight, 'airline.name'),
            'departure_airport' => $departure['airport'] ?? null,
            'departure_iata' => $departure['iata'] ?? null,
            'arrival_airport' => $arrival['airport'] ?? null,
            'arrival_iata' => $arrival['iata'] ?? null,
            'arrival_terminal' => $arrival['terminal'] ?? null,
            'arrival_gate' => $arrival['gate'] ?? null,
            'scheduled_arrival_at' => $scheduled,
            'estimated_arrival_at' => $estimated,
            'actual_arrival_at' => $actual,
            'delay_minutes' => is_numeric($delay) ? (int) round($delay) : null,
            'raw_payload' => $flight,
            'recorded_at' => now(),
        ]);
    }

    private function selectBestFlight(array $items, Transfer $transfer): array
    {
        if (count($items) === 1 || !$transfer->pickup_time) {
            return $items[0];
        }

        $target = $transfer->pickup_time->copy()->utc()->timestamp;

        usort($items, function (array $left, array $right) use ($target): int {
            $leftTime = $this->parseDate(data_get($left, 'arrival.scheduled'))?->timestamp;
            $rightTime = $this->parseDate(data_get($right, 'arrival.scheduled'))?->timestamp;

            $leftDistance = $leftTime ? abs($leftTime - $target) : PHP_INT_MAX;
            $rightDistance = $rightTime ? abs($rightTime - $target) : PHP_INT_MAX;

            return $leftDistance <=> $rightDistance;
        });

        return $items[0];
    }

    private function parseDate(?string $value): ?Carbon
    {
        if (!$value) {
            return null;
        }

        try {
            return Carbon::parse($value)->utc();
        } catch (\Throwable) {
            return null;
        }
    }
}

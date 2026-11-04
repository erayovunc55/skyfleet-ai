<?php

namespace App\Services;

use App\Models\HeytripOrder;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class HeytripService
{
    public function quote(array $payload): array
    {
        $data = $this->validatedResponse(
            $this->request()->post('/api/transferTrip/GetQuotes', $payload)->json()
        );

        $markup = (float) config('services.heytrip.markup_percent', 15);
        $data['products'] = collect($data['products'] ?? [])
            ->map(function (array $product) use ($markup): array {
                $providerPrice = (float) ($product['price'] ?? 0);
                $product['provider_price'] = round($providerPrice, 2);
                $product['customer_price'] = round($providerPrice * (1 + ($markup / 100)), 2);
                $product['markup_percent'] = $markup;
                return $product;
            })
            ->values()
            ->all();

        return $data;
    }

    public function createOrder(array $payload): array
    {
        $data = $this->validatedResponse(
            $this->request()->post('/api/transferTrip/CreateOrder', $payload)->json()
        );

        if (($data['bookResult'] ?? null) !== 'Success' || empty($data['orderNumber'])) {
            throw new RuntimeException($data['resultMessage'] ?? 'HeyTrip booking was not successful.');
        }

        return $data;
    }

    public function getOrderDetails(string $partnerOrderNumber): array
    {
        return $this->validatedResponse(
            $this->request()->get('/api/transferTrip/GetOrderDetails', [
                'partnerOrderNumber' => $partnerOrderNumber,
            ])->json()
        );
    }

    public function cancelOrder(array $payload): array
    {
        return $this->validatedResponse(
            $this->request()->post('/api/transferTrip/cancelOrder', $payload)->json()
        );
    }

    public function persistQuote(string $partnerOrderNumber, array $quote, ?int $transferId = null): HeytripOrder
    {
        $product = $quote['products'][0] ?? [];
        $providerTotal = (float) ($product['provider_price'] ?? $product['price'] ?? 0);
        $customerTotal = (float) ($product['customer_price'] ?? $providerTotal);

        return HeytripOrder::query()->updateOrCreate(
            ['partner_order_number' => $partnerOrderNumber],
            [
                'transfer_id' => $transferId,
                'status' => 'quote',
                'currency' => $quote['currency'] ?? config('services.heytrip.currency', 'EUR'),
                'provider_total' => $providerTotal,
                'markup_percent' => config('services.heytrip.markup_percent', 15),
                'customer_total' => $customerTotal,
                'quote_payload' => $quote,
            ]
        );
    }

    private function request(): PendingRequest
    {
        if (! config('services.heytrip.enabled')) {
            throw new RuntimeException('HeyTrip integration is disabled. Set HEYTRIP_ENABLED=true after sandbox configuration.');
        }

        return Http::baseUrl(rtrim(config('services.heytrip.base_url'), '/'))
            ->acceptJson()
            ->asJson()
            ->timeout((int) config('services.heytrip.timeout', 20))
            ->withHeaders(['Token' => $this->token()]);
    }

    private function token(): string
    {
        $authorizationUrl = config('services.heytrip.authorization_url');
        if (! $authorizationUrl) {
            throw new RuntimeException('HEYTRIP_AUTHORIZATION_URL is not configured.');
        }

        return Cache::remember('heytrip.access_token', now()->addMinutes(50), function () use ($authorizationUrl): string {
            $response = Http::asForm()
                ->acceptJson()
                ->timeout((int) config('services.heytrip.timeout', 20))
                ->post($authorizationUrl, [
                    'username' => config('services.heytrip.username'),
                    'password' => config('services.heytrip.password'),
                ]);

            $data = $response->json();
            $token = $data['accessToken'] ?? $data['token'] ?? null;
            if (! $response->successful() || ! is_string($token) || $token === '') {
                throw new RuntimeException('HeyTrip authorization failed.');
            }

            return $token;
        });
    }

    private function validatedResponse(?array $data): array
    {
        if (! is_array($data)) {
            throw new RuntimeException('HeyTrip returned an invalid response.');
        }

        if (($data['resultCode'] ?? '200') !== '200') {
            throw new RuntimeException($data['resultMessage'] ?? 'HeyTrip request failed.');
        }

        return $data;
    }
}

<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class PublicAddressSearchTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Cache::flush();
        config([
            'geocoding.provider' => 'geoapify',
            'geocoding.geoapify.key' => 'test-api-key',
            'geocoding.geoapify.endpoint' => 'https://api.geoapify.com/v1/geocode/search',
            'geocoding.geoapify.language' => 'tr',
        ]);
    }

    public function test_public_address_search_returns_geoapify_suggestions(): void
    {
        Http::fake([
            'https://api.geoapify.com/*' => Http::response([
                'features' => [
                    [
                        'properties' => [
                            'name' => 'Taksim Meydanı',
                            'formatted' => 'Taksim Meydanı, Beyoğlu, İstanbul, Türkiye',
                            'lat' => 41.0379547,
                            'lon' => 28.9852034,
                            'place_id' => 'taksim-place-id',
                            'country' => 'Türkiye',
                            'city' => 'İstanbul',
                            'postcode' => '34437',
                        ],
                    ],
                ],
            ]),
        ]);

        $response = $this->getJson(
            '/api/public/address-search?q=Taksim%20Meydan%C4%B1'
        );

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Taksim Meydanı')
            ->assertJsonPath(
                'data.0.formatted_address',
                'Taksim Meydanı, Beyoğlu, İstanbul, Türkiye'
            )
            ->assertJsonPath('data.0.latitude', 41.0379547)
            ->assertJsonPath('data.0.longitude', 28.9852034)
            ->assertJsonPath('data.0.provider', 'geoapify');

        Http::assertSent(function ($request): bool {
            return str_starts_with(
                $request->url(),
                'https://api.geoapify.com/v1/geocode/search?'
            )
                && $request['text'] === 'Taksim Meydanı'
                && $request['limit'] === 6
                && $request['lang'] === 'tr'
                && $request['apiKey'] === 'test-api-key';
        });
    }

    public function test_public_address_search_rejects_short_queries(): void
    {
        Http::fake();

        $this->getJson('/api/public/address-search?q=A')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('q');

        Http::assertNothingSent();
    }
}

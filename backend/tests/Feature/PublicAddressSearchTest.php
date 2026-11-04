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
        Http::preventStrayRequests();
        config([
            'google_places.enabled' => false,
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
            '/public/address-search?q=Taksim%20Meydan%C4%B1'
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

        $this->getJson('/public/address-search?q=A')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('q');

        Http::assertNothingSent();
    }

    public function test_selected_google_place_falls_back_to_text_geocoding_for_coordinates(): void
    {
        config([
            'google_places.enabled' => true,
            'google_places.key' => 'test-google-key',
        ]);

        Http::fake([
            'https://places.googleapis.com/*' => Http::response([], 403),
            'https://api.geoapify.com/*' => Http::response([
                'features' => [[
                    'properties' => [
                        'name' => 'Istanbul Airport',
                        'formatted' => 'Istanbul Airport, Arnavutköy, İstanbul, Türkiye',
                        'lat' => 41.275,
                        'lon' => 28.752,
                        'place_id' => 'geoapify-airport-place',
                    ],
                ]],
            ]),
        ]);

        $this->getJson('/public/address-search?' . http_build_query([
            'place_id' => 'google-airport-place',
            'fallback_query' => 'Istanbul Airport, İstanbul, Türkiye',
        ]))
            ->assertOk()
            ->assertJsonPath('data.latitude', 41.275)
            ->assertJsonPath('data.longitude', 28.752)
            ->assertJsonPath('data.provider', 'geoapify');

        Http::assertSent(function ($request): bool {
            return str_starts_with(
                $request->url(),
                'https://api.geoapify.com/v1/geocode/search?'
            )
                && $request['text'] === 'Istanbul Airport, İstanbul, Türkiye'
                && $request['apiKey'] === 'test-api-key';
        });
    }

    public function test_city_and_address_words_do_not_match_airport_code_substrings(): void
    {
        Http::fake([
            'https://api.geoapify.com/*' => Http::response([
                'features' => [[
                    'properties' => [
                        'name' => 'Address result',
                        'formatted' => 'Address result',
                        'lat' => 41.0,
                        'lon' => 29.0,
                        'place_id' => 'address-result',
                    ],
                ]],
            ]),
        ]);

        foreach (['Taksim Istanbul', 'Taksim İstanbul', 'Artist Hotel', 'Sawgrass Hotel'] as $query) {
            foreach (['pickup', 'dropoff'] as $field) {
                $this->getJson('/public/address-search?' . http_build_query([
                    'q' => $query,
                    'field' => $field,
                ]))
                    ->assertOk()
                    ->assertJsonCount(1, 'data')
                    ->assertJsonPath('data.0.name', 'Address result')
                    ->assertJsonPath('data.0.is_airport', false);
            }
        }
    }
}

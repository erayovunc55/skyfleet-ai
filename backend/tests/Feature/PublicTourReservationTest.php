<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicTourReservationTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_can_create_a_b1_tour_reservation_request(): void
    {
        $response = $this->postJson('/public/tour-reservations', [
            'tour_code' => 'B1',
            'tour_date' => now()->addDay()->toDateString(),
            'adults' => 2,
            'children' => 1,
            'infants' => 1,
            'passenger_name' => 'Tour Guest',
            'passenger_phone' => '+905551112233',
            'passenger_email' => 'guest@example.com',
            'locale' => 'tr',
            'terms_accepted' => true,
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.status', 'new')
            ->assertJsonPath('data.tour_title', 'Prince Islands')
            ->assertJsonPath('data.passengers', 4)
            ->assertJsonPath('data.price', 100)
            ->assertJsonPath('data.currency', 'USD');

        $reference = $response->json('data.request_reference');
        $this->assertDatabaseHas('transfer_requests', [
            'request_reference' => $reference,
            'request_type' => 'tour',
            'tour_code' => 'B1',
            'tour_adults' => 2,
            'tour_children' => 1,
            'tour_infants' => 1,
            'tour_price_total' => 100,
            'tour_currency' => 'USD',
            'passenger_email' => 'guest@example.com',
            'status' => 'new',
            'source' => 'public_tour_booking',
        ]);
        $this->assertDatabaseCount('transfers', 0);
    }

    public function test_tour_reservation_rejects_unknown_codes_and_invalid_dates(): void
    {
        $response = $this->postJson('/public/tour-reservations', [
            'tour_code' => 'H1',
            'tour_date' => now()->subDay()->toDateString(),
            'adults' => 1,
            'passenger_name' => 'Tour Guest',
            'passenger_phone' => '+905551112233',
            'passenger_email' => 'guest@example.com',
            'terms_accepted' => true,
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['tour_code', 'tour_date']);
        $this->assertDatabaseCount('transfer_requests', 0);
    }
}

<?php

namespace Tests\Feature;

use App\Models\TransferRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminTransferRequestTest extends TestCase
{
    use RefreshDatabase;

    public function test_dispatcher_can_list_and_update_transfer_requests(): void
    {
        $dispatcher = User::factory()->create([
            'role' => 'dispatcher',
            'is_active' => true,
            'phone' => '+10000000071',
        ]);
        Sanctum::actingAs($dispatcher);

        $transferRequest = $this->createTransferRequest();

        $this->getJson('/api/admin/transfer-requests')
            ->assertOk()
            ->assertJsonPath('data.0.request_reference', 'STR-20260826-ADMIN1')
            ->assertJsonPath('counts.new', 1);

        $this->patchJson(
            "/api/admin/transfer-requests/{$transferRequest->id}/status",
            ['status' => 'quoted']
        )
            ->assertOk()
            ->assertJsonPath('data.status', 'quoted');

        $this->assertDatabaseHas('transfer_requests', [
            'id' => $transferRequest->id,
            'status' => 'quoted',
            'handled_by_user_id' => $dispatcher->id,
        ]);
    }

    public function test_driver_cannot_access_admin_transfer_requests(): void
    {
        $driver = User::factory()->create([
            'role' => 'driver',
            'is_active' => true,
            'phone' => '+10000000072',
        ]);
        Sanctum::actingAs($driver);

        $this->getJson('/api/admin/transfer-requests')->assertForbidden();
    }

    private function createTransferRequest(): TransferRequest
    {
        return TransferRequest::query()->create([
            'request_reference' => 'STR-20260826-ADMIN1',
            'status' => 'new',
            'pickup' => 'Istanbul Airport',
            'dropoff' => 'City Hotel',
            'pickup_date' => now()->addDay()->toDateString(),
            'pickup_time' => '14:30',
            'timezone' => 'Europe/Istanbul',
            'passengers' => 2,
            'luggage_count' => 2,
            'passenger_name' => 'Panel Test',
            'passenger_phone' => '+905551112233',
            'passenger_email' => 'panel@example.com',
            'locale' => 'en',
            'source' => 'public_website',
        ]);
    }
}

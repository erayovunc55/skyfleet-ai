<?php

namespace Tests\Feature;

use Tests\TestCase;

class HealthCheckTest extends TestCase
{
    public function test_public_health_endpoint_returns_ok_status(): void
    {
        $response = $this->getJson('/health');

        $response->assertOk()
            ->assertJsonPath('status', 'ok')
            ->assertJsonStructure([
                'status',
                'timestamp',
                'app',
            ]);
    }
}

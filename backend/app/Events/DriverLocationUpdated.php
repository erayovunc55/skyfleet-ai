<?php

namespace App\Events;

use App\Models\DriverLocation;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DriverLocationUpdated implements ShouldBroadcastNow
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public function __construct(
        public DriverLocation $location
    ) {
    }

    public function broadcastOn(): array
    {
        return [
            new Channel(
                'transfer.' . $this->location->transfer_id
            ),
        ];
    }

    public function broadcastAs(): string
    {
        return 'driver.location.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'transfer_id' => $this->location->transfer_id,
            'driver_id' => $this->location->driver_id,
            'latitude' => $this->location->latitude,
            'longitude' => $this->location->longitude,
            'accuracy' => $this->location->accuracy,
            'speed' => $this->location->speed,
            'heading' => $this->location->heading,
            'recorded_at' => $this->location->recorded_at?->toISOString(),
        ];
    }
}
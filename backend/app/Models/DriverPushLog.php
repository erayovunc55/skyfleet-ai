<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DriverPushLog extends Model
{
    protected $fillable = ['transfer_id', 'driver_id', 'type', 'sent_at', 'successful_tokens'];

    protected function casts(): array
    {
        return ['sent_at' => 'datetime'];
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OperationalAlertRead extends Model
{
    protected $fillable = [
        'user_id',
        'alert_key',
        'read_at',
    ];

    protected function casts(): array
    {
        return [
            'read_at' => 'datetime',
        ];
    }
}

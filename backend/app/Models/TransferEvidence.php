<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TransferEvidence extends Model
{
    protected $table = 'transfer_evidences';

    protected $fillable = [
        'transfer_id',
        'driver_id',
        'type',
        'file_path',
        'latitude',
        'longitude',
        'accuracy',
        'note',
        'recorded_at',
    ];
}
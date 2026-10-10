<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class TourPackage extends Model
{
    protected $fillable = [
        'slug', 'region', 'title', 'description', 'image_url', 'tag',
        'duration', 'price', 'currency', 'is_active', 'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (TourPackage $package): void {
            $package->slug ??= Str::slug($package->title).'-'.Str::lower(Str::random(5));
        });
    }
}

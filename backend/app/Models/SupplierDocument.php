<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SupplierDocument extends Model
{
    use HasFactory;

    public const TYPES = [
        'contract',
        'company_registration',
        'tax_document',
        'insurance',
        'transport_license',
        'tourism_license',
        'other',
    ];

    protected $fillable = [
        'supplier_id',
        'type',
        'title',
        'document_number',
        'file_path',
        'issued_at',
        'expires_at',
        'note',
        'uploaded_by',
    ];

    protected function casts(): array
    {
        return [
            'issued_at' => 'date',
            'expires_at' => 'date',
        ];
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function uploadedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}

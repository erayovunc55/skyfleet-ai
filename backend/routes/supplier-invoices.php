<?php

use App\Http\Controllers\Api\SupplierPortalInvoiceController;
use Illuminate\Support\Facades\Route;

Route::middleware(
    'auth:sanctum'
)->prefix(
    'supplier-portal'
)->group(function (): void {
    Route::get(
        'invoices',
        [
            SupplierPortalInvoiceController::class,
            'index',
        ]
    );

    Route::post(
        'invoices',
        [
            SupplierPortalInvoiceController::class,
            'store',
        ]
    );

    Route::get(
        'invoices/{invoice}/download',
        [
            SupplierPortalInvoiceController::class,
            'download',
        ]
    );

    Route::get(
        'invoices/{invoice}',
        [
            SupplierPortalInvoiceController::class,
            'show',
        ]
    );
});
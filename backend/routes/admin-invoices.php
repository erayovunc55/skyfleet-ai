<?php

use App\Http\Controllers\Api\AdminSupplierInvoiceController;
use Illuminate\Support\Facades\Route;

Route::middleware([
    'auth:sanctum',
    'panel.role:dispatcher,admin,super_admin',
])->prefix(
    'admin/invoices'
)->group(function (): void {
    Route::get(
        '/',
        [
            AdminSupplierInvoiceController::class,
            'index',
        ]
    );

    Route::get(
        '{invoice}/download',
        [
            AdminSupplierInvoiceController::class,
            'download',
        ]
    );

    Route::get(
        '{invoice}',
        [
            AdminSupplierInvoiceController::class,
            'show',
        ]
    );

    Route::patch(
        '{invoice}/approve',
        [
            AdminSupplierInvoiceController::class,
            'approve',
        ]
    );

    Route::patch(
        '{invoice}/request-revision',
        [
            AdminSupplierInvoiceController::class,
            'requestRevision',
        ]
    );

    Route::patch(
        '{invoice}/reject',
        [
            AdminSupplierInvoiceController::class,
            'reject',
        ]
    );
});
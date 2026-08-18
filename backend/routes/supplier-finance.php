<?php

use App\Http\Controllers\Api\SupplierPortalFinanceController;
use Illuminate\Support\Facades\Route;

Route::middleware(
    'auth:sanctum'
)->prefix(
    'supplier-portal'
)->group(function (): void {
    Route::get(
        'financials',
        [
            SupplierPortalFinanceController::class,
            'index',
        ]
    );

    Route::get(
        'financials/{financial}',
        [
            SupplierPortalFinanceController::class,
            'show',
        ]
    );
});
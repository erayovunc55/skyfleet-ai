<?php

use App\Http\Controllers\Api\SupplierDocumentController;
use App\Http\Controllers\Api\SupplierPortalFinanceController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->prefix('supplier-portal')->group(function (): void {
    Route::get('financials', [SupplierPortalFinanceController::class, 'index']);
    Route::get('financials/{financial}', [SupplierPortalFinanceController::class, 'show']);
});

Route::middleware([
    'auth:sanctum',
    'panel.role:dispatcher,admin,super_admin',
])->group(function (): void {
    Route::get('suppliers/{supplier}/documents', [SupplierDocumentController::class, 'index']);
    Route::post('suppliers/{supplier}/documents', [SupplierDocumentController::class, 'store']);
    Route::delete('suppliers/{supplier}/documents/{document}', [SupplierDocumentController::class, 'destroy']);
});

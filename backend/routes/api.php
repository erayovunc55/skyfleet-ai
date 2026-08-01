<?php
use App\Http\Controllers\Api\TransferEvidenceController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DispatcherController;
use App\Http\Controllers\Api\DriverController;
use App\Http\Controllers\Api\DriverLocationController;
use App\Http\Controllers\Api\LocationController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\TransferController;
use App\Http\Controllers\Api\TransferEventController;
use App\Http\Controllers\Api\VehicleController;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post(
    'login',
    [AuthController::class, 'login']
);

Route::middleware('auth:sanctum')->group(function () {

    /*
    |--------------------------------------------------------------------------
    | Authenticated User
    |--------------------------------------------------------------------------
    */

    Route::get(
        'user',
        function (Request $request) {
            return $request->user();
        }
    );

    /*
    |--------------------------------------------------------------------------
    | Vehicles
    |--------------------------------------------------------------------------
    */

    Route::apiResource(
        'vehicles',
        VehicleController::class
    );

    Route::patch(
        'vehicles/{vehicle}/status',
        [VehicleController::class, 'changeStatus']
    );

    Route::post(
        'vehicles/{vehicle}/photo',
        [VehicleController::class, 'uploadPhoto']
    );

    /*
    |--------------------------------------------------------------------------
    | Drivers
    |--------------------------------------------------------------------------
    */

    Route::get(
        'drivers',
        [DriverController::class, 'index']
    );

    Route::get(
        'driver/transfers',
        [DriverController::class, 'myTransfers']
    );
    Route::get(
    'driver/dashboard',
    [DriverController::class, 'dashboard']
);

    Route::patch(
        'drivers/{driver}/vehicle',
        [DriverController::class, 'assignVehicle']
    );

    /*
    |--------------------------------------------------------------------------
    | Dispatcher
    |--------------------------------------------------------------------------
    */

    Route::get(
        'dispatcher/transfers',
        [DispatcherController::class, 'transfers']
    );

    Route::post(
        'dispatcher/transfers',
        [DispatcherController::class, 'store']
    );
Route::patch(
    'dispatcher/transfers/{transfer}/assign',
    [DispatcherController::class, 'assign']
);
    /*
    |--------------------------------------------------------------------------
    | Transfers
    |--------------------------------------------------------------------------
    */

    Route::get(
        'transfers',
        [TransferController::class, 'index']
    );

Route::post(
    'transfers/{transfer}/no-show-evidence',
    [
        TransferEvidenceController::class,
        'storeNoShow',
    ]
);
    Route::get(
        'transfers/{transfer}',
        [TransferController::class, 'show']
    );

    Route::patch(
        'transfers/{transfer}/assignment',
        [
            TransferController::class,
            'updateAssignment',
        ]
    );

    Route::patch(
        'transfers/{transfer}/status',
        [
            TransferController::class,
            'updateStatus',
        ]
    );

    Route::post(
        'transfers/{transfer}/event',
        [TransferEventController::class, 'store']
    );

    Route::post(
        'transfers/{transfer}/location',
        [DriverLocationController::class, 'store']
    );

    /*
    |--------------------------------------------------------------------------
    | Suppliers
    |--------------------------------------------------------------------------
    */

    Route::get(
        'suppliers',
        [SupplierController::class, 'index']
    );

    Route::post(
        'suppliers',
        [SupplierController::class, 'store']
    );

    Route::get(
        'suppliers/{supplier}',
        [SupplierController::class, 'show']
    );

    Route::patch(
        'suppliers/{supplier}',
        [SupplierController::class, 'update']
    );

    Route::patch(
        'suppliers/{supplier}/submit',
        [SupplierController::class, 'submit']
    );

    Route::patch(
        'suppliers/{supplier}/approve',
        [SupplierController::class, 'approve']
    );

    Route::patch(
        'suppliers/{supplier}/request-revision',
        [
            SupplierController::class,
            'requestRevision',
        ]
    );

    Route::patch(
        'suppliers/{supplier}/reject',
        [SupplierController::class, 'reject']
    );

    Route::patch(
        'suppliers/{supplier}/suspend',
        [SupplierController::class, 'suspend']
    );

    Route::patch(
        'suppliers/{supplier}/reactivate',
        [SupplierController::class, 'reactivate']
    );

    /*
    |--------------------------------------------------------------------------
    | Location Master Data
    |--------------------------------------------------------------------------
    */

    Route::get(
        'location-types',
        [LocationController::class, 'locationTypes']
    );

    Route::get(
        'countries',
        [LocationController::class, 'countries']
    );

    Route::get(
        'countries/{country}/cities',
        [LocationController::class, 'cities']
    );

    Route::get(
        'cities/{city}/locations',
        [LocationController::class, 'locations']
    );

    Route::get(
        'locations/{location}',
        [LocationController::class, 'show']
    );

    Route::get(
        'locations/{location}/points',
        [LocationController::class, 'points']
    );

    /*
    |--------------------------------------------------------------------------
    | Logout
    |--------------------------------------------------------------------------
    */

    Route::post(
        'logout',
        [AuthController::class, 'logout']
    );
});

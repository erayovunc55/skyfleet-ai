<?php
use App\Http\Controllers\Api\DispatcherTransferStatusController;
use App\Http\Controllers\Api\AdminAgencyController;
use App\Http\Controllers\Api\AdminPanelUserController;
use App\Http\Controllers\Api\AiTrainingController;
use App\Http\Controllers\Api\AgencyAuthController;
use App\Http\Controllers\Api\AgencyPasswordResetController;
use App\Http\Controllers\Api\SkyfleetAiController;
use App\Http\Controllers\Api\AgencyPortalController;
use App\Http\Controllers\Api\AgencyTransferController;
use App\Http\Controllers\Api\AgencyRegionalPricingController;
use App\Http\Controllers\Api\AdminTransferRequestController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AdminDashboardController;
use App\Http\Controllers\Api\AdminSupportController;
use App\Http\Controllers\Api\DispatcherController;
use App\Http\Controllers\Api\DispatcherTransferManagementController;
use App\Http\Controllers\Api\DriverController;
use App\Http\Controllers\Api\DriverLocationController;
use App\Http\Controllers\Api\DriverPasswordResetController;
use App\Http\Controllers\Api\DriverPushTokenController;
use App\Http\Controllers\Api\FlightOperationalAlertController;
use App\Http\Controllers\Api\FlightTrackingController;
use App\Http\Controllers\Api\HealthController;
use App\Http\Controllers\Api\LocationController;
use App\Http\Controllers\Api\LocationPointController;
use App\Http\Controllers\Api\MetaWhatsAppWebhookController;
use App\Http\Controllers\Api\OperationalAlertController;
use App\Http\Controllers\Api\PassengerTrackingController;
use App\Http\Controllers\Api\PassengerSupportController;
use App\Http\Controllers\Api\PublicAddressSearchController;
use App\Http\Controllers\Api\PublicAgencyApplicationController;
use App\Http\Controllers\Api\PublicHeytripQuoteController;
use App\Http\Controllers\Api\PublicRegionalPricingController;
use App\Http\Controllers\Api\PublicTransferRequestController;
use App\Http\Controllers\Api\PublicTransferPaymentController;
use App\Http\Controllers\Api\StripeWebhookController;
use App\Http\Controllers\Api\PublicTourReservationController;
use App\Http\Controllers\Api\PublicSupplierApplicationController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\SupplierAccountController;
use App\Http\Controllers\Api\SupplierCoverageController;
use App\Http\Controllers\Api\SupplierDeletionController;
use App\Http\Controllers\Api\SupplierJobPoolController;
use App\Http\Controllers\Api\SupplierMatchController;
use App\Http\Controllers\Api\SupplierPasswordResetController;
use App\Http\Controllers\Api\SupplierPortalAssignmentController;
use App\Http\Controllers\Api\SupplierPortalController;
use App\Http\Controllers\Api\SupplierPortalCoverageController;
use App\Http\Controllers\Api\SupplierPortalDriverController;
use App\Http\Controllers\Api\SupplierPortalVehicleController;
use App\Http\Controllers\Api\TransferController;
use App\Http\Controllers\Api\TourPackageController;
use App\Http\Controllers\Api\TwilioSmsWebhookController;
use App\Http\Controllers\Api\TransferRequestConversionController;
use App\Http\Controllers\Api\TransferEventController;
use App\Http\Controllers\Api\TransferEvidenceController;
use App\Http\Controllers\Api\TransferExcelImportController;
use App\Http\Controllers\Api\TransferRouteController;
use App\Http\Controllers\Api\TransferSupplierDispatchController;
use App\Http\Controllers\Api\VehicleController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public / Webhook Routes
|--------------------------------------------------------------------------
*/

Route::get(
    'webhooks/meta/whatsapp',
    [MetaWhatsAppWebhookController::class, 'verify']
)->middleware('throttle:30,1');

Route::post(
    'webhooks/meta/whatsapp',
    [MetaWhatsAppWebhookController::class, 'receive']
)->middleware('throttle:300,1');

Route::post(
    'webhooks/twilio/sms',
    [TwilioSmsWebhookController::class, 'receive']
)->middleware('throttle:300,1');

Route::get('health', HealthController::class);

Route::get(
    'public/tour-packages',
    [TourPackageController::class, 'index']
);

Route::post(
    'public/supplier-applications',
    [PublicSupplierApplicationController::class, 'store']
)->middleware('throttle:3,1');

Route::post(
    'public/agency-applications',
    [PublicAgencyApplicationController::class, 'store']
)->middleware('throttle:5,1');

Route::get(
    'public/address-search',
    PublicAddressSearchController::class
)->middleware('throttle:60,1');

Route::post(
    'public/transfer-requests',
    [PublicTransferRequestController::class, 'store']
)->middleware('throttle:10,1');

Route::get(
    'public/transfer-payments/confirm',
    [PublicTransferPaymentController::class, 'confirm']
)->middleware('throttle:30,1');

Route::post(
    'webhooks/stripe/transfer',
    [StripeWebhookController::class, 'handle']
);

Route::post(
    'public/tour-reservations',
    [PublicTourReservationController::class, 'store']
)->middleware('throttle:10,1');

Route::post(
    'public/regional-pricing',
    PublicRegionalPricingController::class
)->middleware('throttle:30,1');

Route::get(
    'public/tracking/{token}',
    [PassengerTrackingController::class, 'show']
)->middleware('throttle:120,1');

Route::get(
    'public/tracking/{token}/messages',
    [PassengerSupportController::class, 'index']
)->middleware('throttle:120,1');

Route::post(
    'public/tracking/{token}/messages',
    [PassengerSupportController::class, 'store']
)->middleware('throttle:60,1');

/*
|--------------------------------------------------------------------------
| Authentication Routes
|--------------------------------------------------------------------------
*/

Route::post(
    'login',
    [AuthController::class, 'login']
);

Route::post(
    'agency/login',
    [AgencyAuthController::class, 'login']
)->middleware('throttle:10,1');

Route::post(
    'agency-password/forgot',
    [AgencyPasswordResetController::class, 'forgot']
)->middleware('throttle:5,1');

Route::post(
    'agency-password/reset',
    [AgencyPasswordResetController::class, 'reset']
)->middleware('throttle:10,1');

Route::post(
    'supplier-password/forgot',
    [SupplierPasswordResetController::class, 'forgot']
)->middleware('throttle:5,1');

Route::post(
    'supplier-password/reset',
    [SupplierPasswordResetController::class, 'reset']
)->middleware('throttle:10,1');

Route::post(
    'driver-password/reset',
    [DriverPasswordResetController::class, 'reset']
)->middleware('throttle:10,1');

/*
|--------------------------------------------------------------------------
| Authenticated Routes
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get(
        'user',
        function (Request $request) {
            return $request
                ->user()
                ?->load([
                    'supplierCompany',
                    'agencyCompany',
                ]);
        }
    );

    /*
    |--------------------------------------------------------------------------
    | Agency Portal
    |--------------------------------------------------------------------------
    */

    Route::prefix('agency')->group(function (): void {
        Route::get(
            'profile',
            [AgencyPortalController::class, 'profile']
        );

        Route::post(
            'pricing',
            AgencyRegionalPricingController::class
        );

        Route::get(
            'dashboard',
            [AgencyPortalController::class, 'dashboard']
        );

        Route::get(
            'transfers',
            [AgencyTransferController::class, 'index']
        );

        Route::post(
            'transfers',
            [AgencyTransferController::class, 'store']
        );

        Route::get(
            'transfers/{transfer}',
            [AgencyTransferController::class, 'show']
        );

        Route::post(
            'logout',
            [AgencyAuthController::class, 'logout']
        );
    });

    /*
    |--------------------------------------------------------------------------
    | Dispatcher / Admin Routes
    |--------------------------------------------------------------------------
    */

    Route::middleware('panel.role:admin,super_admin')->prefix('admin/users')->group(function (): void {
    Route::get('/', [AdminPanelUserController::class, 'index']);
    Route::post('/', [AdminPanelUserController::class, 'store']);
    Route::patch('{user}', [AdminPanelUserController::class, 'update']);
});

Route::middleware('panel.role:dispatcher,admin,super_admin')
    ->group(function (): void {

        // SKYFLEET - DISPATCHER STATUS UPDATE
        Route::patch(
            'dispatcher/transfers/{transfer}/status',
            [DispatcherTransferStatusController::class, 'update']
        );
            /*
            |------------------------------------------------------------------
            | Admin Agency Management
            |------------------------------------------------------------------
            */

            Route::prefix('admin/agencies')->group(function (): void {
                Route::get(
                    '/',
                    [AdminAgencyController::class, 'index']
                );

                Route::post(
                    '/',
                    [AdminAgencyController::class, 'store']
                );

                Route::get(
                    '{agency}',
                    [AdminAgencyController::class, 'show']
                );

                Route::patch(
                    '{agency}',
                    [AdminAgencyController::class, 'update']
                );

                Route::patch(
                    '{agency}/toggle-status',
                    [AdminAgencyController::class, 'toggleStatus']
                );

                Route::post(
                    '{agency}/users',
                    [AdminAgencyController::class, 'createUser']
                );
            });

            /*
            |------------------------------------------------------------------
            | Transfer Requests
            |------------------------------------------------------------------
            */

            Route::get(
                'admin/transfer-requests',
                [AdminTransferRequestController::class, 'index']
            );

            Route::patch(
                'admin/transfer-requests/{transferRequest}/status',
                [AdminTransferRequestController::class, 'updateStatus']
            );

            Route::post(
                'admin/transfer-requests/{transferRequest}/convert',
                [TransferRequestConversionController::class, 'store']
            );

            /*
            |------------------------------------------------------------------
            | Tour Packages
            |------------------------------------------------------------------
            */

            Route::get(
                'tour-packages',
                [TourPackageController::class, 'index']
            );

            Route::post(
                'tour-packages',
                [TourPackageController::class, 'store']
            );

            Route::patch(
                'tour-packages/{tourPackage}',
                [TourPackageController::class, 'update']
            );

            Route::delete(
                'tour-packages/{tourPackage}',
                [TourPackageController::class, 'destroy']
            );

            /*
            |------------------------------------------------------------------
            | Vehicles / Drivers
            |------------------------------------------------------------------
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

            Route::get(
                'drivers',
                [DriverController::class, 'index']
            );

            Route::post(
                'drivers',
                [DriverController::class, 'store']
            );

            Route::patch(
                'drivers/{driver}',
                [DriverController::class, 'update']
            );

            Route::patch(
                'drivers/{driver}/vehicle',
                [DriverController::class, 'assignVehicle']
            );

            /*
            |------------------------------------------------------------------
            | Dispatcher Transfers
            |------------------------------------------------------------------
            */

            Route::get(
                'dispatcher/transfers',
                [DispatcherController::class, 'transfers']
            );

            Route::post(
                'dispatcher/heytrip/quotes',
                PublicHeytripQuoteController::class
            );

            Route::post(
                'dispatcher/transfers',
                [DispatcherController::class, 'store']
            );

            Route::post(
                'dispatcher/transfers/import',
                [TransferExcelImportController::class, 'store']
            );

            Route::get(
                'dispatcher/transfers/import/{transferImport}',
                [TransferExcelImportController::class, 'show']
            );

            Route::patch(
                'dispatcher/transfers/{transfer}',
                [DispatcherTransferManagementController::class, 'update']
            );

            Route::patch(
                'dispatcher/transfers/{transfer}/cancel',
                [DispatcherTransferManagementController::class, 'cancel']
            );

            Route::post(
                'dispatcher/transfers/bulk-assign-supplier',
                [DispatcherController::class, 'bulkAssignSupplier']
            );

            Route::post(
                'dispatcher/transfers/bulk-job-pool',
                [TransferSupplierDispatchController::class, 'bulkPublish']
            );

            Route::patch(
                'dispatcher/transfers/{transfer}/assign',
                [DispatcherController::class, 'assign']
            );

            Route::patch(
                'dispatcher/transfers/{transfer}/supplier',
                [TransferSupplierDispatchController::class, 'assign']
            );

            Route::post(
                'dispatcher/transfers/{transfer}/job-pool',
                [TransferSupplierDispatchController::class, 'publish']
            );

            Route::delete(
                'dispatcher/transfers/{transfer}/job-pool',
                [TransferSupplierDispatchController::class, 'retract']
            );

            Route::get(
                'dispatcher/transfers/{transfer}/route',
                [TransferRouteController::class, 'show']
            );

            Route::get(
                'dispatcher/transfers/{transfer}/supplier-matches',
                [SupplierMatchController::class, 'index']
            );

            Route::get(
                'dispatcher/transfers/{transfer}/flight',
                [FlightTrackingController::class, 'show']
            );

            Route::post(
                'dispatcher/transfers/{transfer}/flight/sync',
                [FlightTrackingController::class, 'sync']
            );

            /*
            |------------------------------------------------------------------
            | Suppliers
            |------------------------------------------------------------------
            */

            Route::post(
                'suppliers/with-account',
                [SupplierAccountController::class, 'store']
            );

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

            Route::delete(
                'suppliers/{supplier}',
                SupplierDeletionController::class
            );

            Route::post(
                'suppliers/{supplier}/password-reset',
                [SupplierPasswordResetController::class, 'adminSend']
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
                [SupplierController::class, 'requestRevision']
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

            Route::get(
                'suppliers/{supplier}/coverages',
                [SupplierCoverageController::class, 'index']
            );

            Route::post(
                'suppliers/{supplier}/coverages',
                [SupplierCoverageController::class, 'store']
            );

            Route::patch(
                'suppliers/{supplier}/coverages/{coverage}',
                [SupplierCoverageController::class, 'update']
            );

            Route::delete(
                'suppliers/{supplier}/coverages/{coverage}',
                [SupplierCoverageController::class, 'destroy']
            );

            /*
            |------------------------------------------------------------------
            | Locations
            |------------------------------------------------------------------
            */

            Route::get(
                'airports/search',
                [LocationController::class, 'airportSearch']
            );

            Route::get(
                'cities/{city}/airports',
                [LocationController::class, 'airports']
            );

            Route::post(
                'locations',
                [LocationController::class, 'store']
            );

            Route::patch(
                'locations/{location}',
                [LocationController::class, 'update']
            );

            Route::post(
                'locations/{location}/points',
                [LocationController::class, 'storePoint']
            );

            Route::patch(
                'locations/{location}/points/{point}',
                [LocationPointController::class, 'update']
            );

            Route::delete(
                'locations/{location}/points/{point}',
                [LocationPointController::class, 'destroy']
            );
        });

    /*
    |--------------------------------------------------------------------------
    | Supplier Portal
    |--------------------------------------------------------------------------
    */

    Route::prefix('supplier-portal')->group(function (): void {
        Route::get(
            'profile',
            [SupplierPortalController::class, 'profile']
        );

        Route::get(
            'documents',
            [SupplierPortalController::class, 'documents']
        );

        Route::get(
            'available-jobs',
            [SupplierJobPoolController::class, 'index']
        );

        Route::post(
            'available-jobs/{transfer}/accept',
            [SupplierJobPoolController::class, 'accept']
        );

        Route::get(
            'transfers',
            [SupplierPortalController::class, 'transfers']
        );

        Route::get(
            'transfers/{transfer}',
            [SupplierPortalController::class, 'show']
        );

        Route::get(
            'airports/search',
            [LocationController::class, 'airportSearch']
        );

        Route::get(
            'coverages',
            [SupplierPortalCoverageController::class, 'index']
        );

        Route::post(
            'coverages',
            [SupplierPortalCoverageController::class, 'store']
        );

        Route::patch(
            'coverages/{coverage}',
            [SupplierPortalCoverageController::class, 'update']
        );

        Route::delete(
            'coverages/{coverage}',
            [SupplierPortalCoverageController::class, 'destroy']
        );

        Route::get(
            'vehicles',
            [SupplierPortalVehicleController::class, 'index']
        );

        Route::post(
            'vehicles',
            [SupplierPortalVehicleController::class, 'store']
        );

        Route::get(
            'vehicles/{vehicle}',
            [SupplierPortalVehicleController::class, 'show']
        );

        Route::patch(
            'vehicles/{vehicle}',
            [SupplierPortalVehicleController::class, 'update']
        );

        Route::patch(
            'vehicles/{vehicle}/status',
            [SupplierPortalVehicleController::class, 'changeStatus']
        );

        Route::delete(
            'vehicles/{vehicle}',
            [SupplierPortalVehicleController::class, 'destroy']
        );

        Route::get(
            'drivers',
            [SupplierPortalDriverController::class, 'index']
        );

        Route::post(
            'drivers',
            [SupplierPortalDriverController::class, 'store']
        );

        Route::get(
            'drivers/{driver}',
            [SupplierPortalDriverController::class, 'show']
        );

        Route::patch(
            'drivers/{driver}',
            [SupplierPortalDriverController::class, 'update']
        );

        Route::patch(
            'drivers/{driver}/vehicle',
            [SupplierPortalDriverController::class, 'assignVehicle']
        );

        Route::post(
            'drivers/{driver}/password-reset-link',
            [DriverPasswordResetController::class, 'createWhatsAppLink']
        );

        Route::delete(
            'drivers/{driver}',
            [SupplierPortalDriverController::class, 'destroy']
        );

        Route::patch(
            'transfers/{transfer}/assignment',
            [SupplierPortalAssignmentController::class, 'assign']
        );

        Route::patch(
            'transfers/{transfer}/unassign',
            [SupplierPortalAssignmentController::class, 'unassign']
        );
    });

    /*
    |--------------------------------------------------------------------------
    | Driver / Transfer Routes
    |--------------------------------------------------------------------------
    */

    Route::get(
        'driver/dashboard',
        [DriverController::class, 'dashboard']
    );

    Route::get(
        'driver/transfers',
        [DriverController::class, 'myTransfers']
    );

    Route::post(
        'driver/push-token',
        [DriverPushTokenController::class, 'store']
    );

    Route::get(
        'transfers/{transfer}/tracking-link',
        [PassengerTrackingController::class, 'link']
    );

    Route::get(
        'transfers',
        [TransferController::class, 'index']
    );

    Route::get(
        'transfers/{transfer}/evidences',
        [TransferEvidenceController::class, 'index']
    );

    Route::post(
        'transfers/{transfer}/no-show-evidence',
        [TransferEvidenceController::class, 'storeNoShow']
    );

    Route::get(
        'transfers/{transfer}',
        [TransferController::class, 'show']
    );

    Route::patch(
        'transfers/{transfer}/assignment',
        [TransferController::class, 'updateAssignment']
    )->middleware('panel.role:dispatcher,admin,super_admin');

    Route::patch(
        'transfers/{transfer}/status',
        [TransferController::class, 'updateStatus']
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
    | Shared Location Read Routes
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
    | Session / Admin Utilities
    |--------------------------------------------------------------------------
    */

    Route::post(
        'logout',
        [AuthController::class, 'logout']
    );

    Route::get(
        'admin/dashboard',
        AdminDashboardController::class
    )->middleware('panel.role:dispatcher,admin,super_admin');

    Route::get(
        'admin/support',
        [AdminSupportController::class, 'index']
    )->middleware('panel.role:dispatcher,admin,super_admin');

    Route::get(
        'admin/support/{transfer}',
        [AdminSupportController::class, 'show']
    )->middleware('panel.role:dispatcher,admin,super_admin');

    Route::post(
        'admin/support/{transfer}/messages',
        [AdminSupportController::class, 'store']
    )->middleware('panel.role:dispatcher,admin,super_admin');

    Route::get(
        'admin/alerts',
        [OperationalAlertController::class, 'index']
    )->middleware('panel.role:dispatcher,admin,super_admin');

    Route::get(
        'admin/flight-alerts',
        FlightOperationalAlertController::class
    )->middleware('panel.role:dispatcher,admin,super_admin');

        Route::post(
        'admin/alerts/read',
        [OperationalAlertController::class, 'markRead']
    )->middleware('panel.role:dispatcher,admin,super_admin');

    /*
    |--------------------------------------------------------------------------
    | Skyfleet AI Training Center
    |--------------------------------------------------------------------------
    */

    Route::get(
        'admin/ai-training',
        [AiTrainingController::class, 'index']
    )->middleware('panel.role:dispatcher,admin,super_admin');

    Route::post(
        'admin/ai-training',
        [AiTrainingController::class, 'store']
    )->middleware('panel.role:admin,super_admin');

    Route::get(
        'admin/ai-training/search',
        [AiTrainingController::class, 'search']
    )->middleware('panel.role:dispatcher,admin,super_admin');

    Route::get(
        'admin/ai-training/{aiTrainingEntry}',
        [AiTrainingController::class, 'show']
    )->middleware('panel.role:dispatcher,admin,super_admin');

    Route::put(
        'admin/ai-training/{aiTrainingEntry}',
        [AiTrainingController::class, 'update']
    )->middleware('panel.role:admin,super_admin');

    Route::delete(
        'admin/ai-training/{aiTrainingEntry}',
        [AiTrainingController::class, 'destroy']
    )->middleware('panel.role:admin,super_admin');
    Route::post(
    'admin/ai/chat',
    [SkyfleetAiController::class, 'chat']
)->middleware(
    'panel.role:dispatcher,admin,super_admin'
);
});

require __DIR__ . '/finance.php';
require __DIR__ . '/supplier-finance.php';
require __DIR__ . '/supplier-invoices.php';
require __DIR__ . '/admin-invoices.php';
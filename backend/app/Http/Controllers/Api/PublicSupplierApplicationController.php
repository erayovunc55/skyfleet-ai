<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use App\Models\SupplierDocument;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Throwable;

class PublicSupplierApplicationController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            /*
            |--------------------------------------------------------------------------
            | Company
            |--------------------------------------------------------------------------
            */

            'company_name' => [
                'required',
                'string',
                'max:255',
            ],

            'legal_name' => [
                'nullable',
                'string',
                'max:255',
            ],

            'founded_year' => [
                'nullable',
                'integer',
                'min:1800',
                'max:' . now()->year,
            ],

            'website' => [
                'nullable',
                'url',
                'max:255',
            ],

            'tax_number' => [
                'nullable',
                'string',
                'max:100',
            ],

            'registration_number' => [
                'nullable',
                'string',
                'max:100',
            ],

            /*
            |--------------------------------------------------------------------------
            | Authorized Contact
            |--------------------------------------------------------------------------
            */

            'contact_name' => [
                'required',
                'string',
                'max:255',
            ],

            'contact_title' => [
                'nullable',
                'string',
                'max:150',
            ],

            'company_email' => [
                'required',
                'email',
                'max:255',
                'unique:suppliers,email',
                'unique:users,email',
            ],

            'company_phone' => [
                'required',
                'string',
                'max:50',
                'unique:users,phone',
            ],

            'whatsapp' => [
                'nullable',
                'string',
                'max:50',
            ],

            'preferred_language' => [
                'nullable',
                'string',
                'max:10',
            ],

            /*
            |--------------------------------------------------------------------------
            | Headquarters
            |--------------------------------------------------------------------------
            */

            'country_code' => [
                'required',
                'string',
                'size:2',
            ],

            'country_name' => [
                'required',
                'string',
                'max:100',
            ],

            'city' => [
                'required',
                'string',
                'max:100',
            ],

            'state_region' => [
                'nullable',
                'string',
                'max:100',
            ],

            'address' => [
                'nullable',
                'string',
                'max:2000',
            ],

            'postal_code' => [
                'nullable',
                'string',
                'max:30',
            ],

            /*
            |--------------------------------------------------------------------------
            | Operational Capacity
            |--------------------------------------------------------------------------
            */

            'service_regions' => [
                'required',
                'string',
                'max:5000',
            ],

            'service_airports' => [
                'nullable',
                'string',
                'max:10000',
            ],

            'fleet_size' => [
                'required',
                'integer',
                'min:1',
                'max:100000',
            ],

            'driver_count' => [
                'nullable',
                'integer',
                'min:0',
                'max:100000',
            ],

            'monthly_transfer_capacity' => [
                'nullable',
                'integer',
                'min:0',
                'max:10000000',
            ],

            'vehicle_types' => [
                'required',
                'string',
                'max:2000',
            ],

            'support_24_7' => [
                'nullable',
                'boolean',
            ],

            /*
            |--------------------------------------------------------------------------
            | Commercial
            |--------------------------------------------------------------------------
            */

            'default_currency' => [
                'required',
                'string',
                'size:3',
            ],

            'timezone' => [
                'required',
                'timezone',
            ],

            /*
            |--------------------------------------------------------------------------
            | Portal Account
            |--------------------------------------------------------------------------
            */

            'portal_password' => [
                'required',
                'confirmed',
                Password::min(8)
                    ->letters()
                    ->numbers(),
            ],

            /*
            |--------------------------------------------------------------------------
            | Consent
            |--------------------------------------------------------------------------
            */

            'terms_accepted' => [
                'accepted',
            ],

            /*
            |--------------------------------------------------------------------------
            | Documents
            |--------------------------------------------------------------------------
            */

            'company_registration_file' => [
                'required',
                'file',
                'mimes:pdf,jpg,jpeg,png,webp',
                'max:10240',
            ],

            'tax_document_file' => [
                'required',
                'file',
                'mimes:pdf,jpg,jpeg,png,webp',
                'max:10240',
            ],

            'insurance_file' => [
                'required',
                'file',
                'mimes:pdf,jpg,jpeg,png,webp',
                'max:10240',
            ],

            'transport_license_file' => [
                'nullable',
                'file',
                'mimes:pdf,jpg,jpeg,png,webp',
                'max:10240',
            ],
        ]);

        $storedPaths = [];

        try {
            $result = DB::transaction(function () use (
                $request,
                $validated,
                &$storedPaths
            ): array {
                $email = mb_strtolower(
                    trim($validated['company_email'])
                );

                $preferredLanguage = $this->nullableString(
                    $validated['preferred_language'] ?? null
                );

                $supplier = Supplier::create([
                    'company_name' => trim(
                        $validated['company_name']
                    ),

                    'legal_name' => $this->nullableString(
                        $validated['legal_name'] ?? null
                    ),

                    'slug' => $this->makeUniqueSlug(
                        $validated['company_name']
                    ),

                    'tax_number' => $this->nullableString(
                        $validated['tax_number'] ?? null
                    ),

                    'registration_number' => $this->nullableString(
                        $validated['registration_number'] ?? null
                    ),

                    'contact_name' => trim(
                        $validated['contact_name']
                    ),

                    'email' => $email,

                    'phone' => trim(
                        $validated['company_phone']
                    ),

                    'whatsapp' => $this->nullableString(
                        $validated['whatsapp'] ?? null
                    ),

                    'website' => $this->nullableString(
                        $validated['website'] ?? null
                    ),

                    'country_code' => mb_strtoupper(
                        trim($validated['country_code'])
                    ),

                    'country_name' => trim(
                        $validated['country_name']
                    ),

                    'city' => trim(
                        $validated['city']
                    ),

                    'state_region' => $this->nullableString(
                        $validated['state_region'] ?? null
                    ),

                    'address' => $this->nullableString(
                        $validated['address'] ?? null
                    ),

                    'postal_code' => $this->nullableString(
                        $validated['postal_code'] ?? null
                    ),

                    'status' => Supplier::STATUS_PENDING,

                    'submitted_at' => now(),

                    'timezone' => $validated['timezone'],

                    'default_currency' => mb_strtoupper(
                        trim($validated['default_currency'])
                    ),

                    'locale' => $preferredLanguage ?: 'en',

                    'is_active' => false,

                    'metadata' => [
                        'application_source' => 'public_website',

                        'founded_year' => isset(
                            $validated['founded_year']
                        )
                            ? (int) $validated['founded_year']
                            : null,

                        'contact_title' => $this->nullableString(
                            $validated['contact_title'] ?? null
                        ),

                        'preferred_language' => $preferredLanguage,

                        'service_regions' => trim(
                            $validated['service_regions']
                        ),

                        'service_airports' => $this->nullableString(
                            $validated['service_airports'] ?? null
                        ),

                        'fleet_size' => (int)
                            $validated['fleet_size'],

                        'driver_count' => isset(
                            $validated['driver_count']
                        )
                            ? (int) $validated['driver_count']
                            : null,

                        'monthly_transfer_capacity' => isset(
                            $validated['monthly_transfer_capacity']
                        )
                            ? (int)
                                $validated['monthly_transfer_capacity']
                            : null,

                        'vehicle_types' => trim(
                            $validated['vehicle_types']
                        ),

                        'support_24_7' => array_key_exists(
                            'support_24_7',
                            $validated
                        )
                            ? (bool) $validated['support_24_7']
                            : null,
                    ],
                ]);

                $portalUser = User::create([
                    'supplier_id' => $supplier->id,

                    'name' => trim(
                        $validated['contact_name']
                    ),

                    'email' => $email,

                    'phone' => trim(
                        $validated['company_phone']
                    ),

                    'password' => Hash::make(
                        $validated['portal_password']
                    ),

                    'role' => 'supplier',

                    'is_active' => false,
                ]);

                $documentDefinitions = [
                    'company_registration_file' => [
                        'type' => 'company_registration',
                        'title' => 'Company Registration',
                    ],

                    'tax_document_file' => [
                        'type' => 'tax_document',
                        'title' => 'Tax Document',
                    ],

                    'insurance_file' => [
                        'type' => 'insurance',
                        'title' => 'Insurance Certificate',
                    ],

                    'transport_license_file' => [
                        'type' => 'transport_license',
                        'title' => 'Transport Licence',
                    ],
                ];

                foreach (
                    $documentDefinitions as $field => $definition
                ) {
                    if (!$request->hasFile($field)) {
                        continue;
                    }

                    $path = $request
                        ->file($field)
                        ->store(
                            "supplier-documents/{$supplier->id}",
                            'public'
                        );

                    $storedPaths[] = $path;

                    SupplierDocument::create([
                        'supplier_id' => $supplier->id,
                        'type' => $definition['type'],
                        'title' => $definition['title'],
                        'file_path' => $path,
                        'uploaded_by' => null,
                    ]);
                }

                return [
                    'supplier' => $supplier,
                    'portal_user' => $portalUser,
                ];
            });
        } catch (Throwable $exception) {
            foreach ($storedPaths as $path) {
                Storage::disk('public')->delete($path);
            }

            throw $exception;
        }

        /*
        |--------------------------------------------------------------------------
        | Supplier Application Received Email
        |--------------------------------------------------------------------------
        */

        try {
            $supplier = $result['supplier'];

            $applicationId = $supplier->id;
            $companyName = $supplier->company_name;
            $contactName = $supplier->contact_name;
            $email = $supplier->email;

            $subject =
                'SkyTripTransfer - Supplier Application Received';

            $body =
                "Dear {$contactName},\n\n" .
                "Thank you for applying to join the SkyTripTransfer supplier network.\n\n" .
                "We have successfully received your application.\n\n" .
                "Application ID: {$applicationId}\n" .
                "Company: {$companyName}\n" .
                "Status: Under Review\n\n" .
                "Our operations team will review your company information and submitted documents.\n\n" .
                "Your supplier portal account will remain inactive until the review and approval process is completed.\n\n" .
                "If your application is approved, we will contact you with the next steps, including the supplier agreement and portal activation process.\n\n" .
                "Thank you for your interest in working with SkyTripTransfer.\n\n" .
                "SkyTripTransfer\n" .
                "Global Mobility Network";

            Mail::raw(
                $body,
                function ($message) use (
                    $email,
                    $contactName,
                    $subject
                ): void {
                    $message
                        ->to(
                            $email,
                            $contactName
                        )
                        ->subject($subject);
                }
            );
        } catch (Throwable $mailException) {
            report($mailException);
        }

        return response()->json([
            'message' =>
                'Supplier application received successfully.',

            'data' => [
                'application_id' =>
                    $result['supplier']->id,

                'company_name' =>
                    $result['supplier']->company_name,

                'status' =>
                    $result['supplier']->status,

                'portal_active' =>
                    $result['portal_user']->is_active,
            ],
        ], 201);
    }

    private function nullableString(
        mixed $value
    ): ?string {
        $resolved = trim(
            (string) $value
        );

        return $resolved !== ''
            ? $resolved
            : null;
    }

    private function makeUniqueSlug(
        string $companyName
    ): string {
        $base =
            Str::slug($companyName)
            ?: 'supplier';

        $slug = $base;
        $counter = 2;

        while (
            Supplier::withTrashed()
                ->where('slug', $slug)
                ->exists()
        ) {
            $slug =
                $base . '-' . $counter;

            $counter++;
        }

        return $slug;
    }
}
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\AgencyApplicationReceivedMail;
use App\Models\Agency;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class PublicAgencyApplicationController extends Controller
{
    public function store(
        Request $request
    ): JsonResponse {
        /*
        |--------------------------------------------------------------------------
        | Normalize incoming values
        |--------------------------------------------------------------------------
        */

        if (
            $request->filled(
                'country_code'
            )
        ) {
            $request->merge([
                'country_code' =>
                    strtoupper(
                        trim(
                            (string) $request->input(
                                'country_code'
                            )
                        )
                    ),
            ]);
        }

        if (
            $request->filled(
                'default_currency'
            )
        ) {
            $request->merge([
                'default_currency' =>
                    strtoupper(
                        trim(
                            (string) $request->input(
                                'default_currency'
                            )
                        )
                    ),
            ]);
        }


        /*
        |--------------------------------------------------------------------------
        | Validation
        |--------------------------------------------------------------------------
        */

        $data =
            $request->validate([

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

                'email' => [
                    'required',
                    'email',
                    'max:255',

                    Rule::unique(
                        'agencies',
                        'email'
                    ),

                    Rule::unique(
                        'users',
                        'email'
                    ),
                ],

               'phone' => [
    'required',
    'string',
    'max:50',
    Rule::unique(
        'users',
        'phone'
    ),
],

                'website' => [
                    'nullable',
                    'string',
                    'max:255',
                ],

                'country_code' => [
                    'nullable',
                    'string',
                    'size:2',
                ],

                'country_name' => [
                    'required',
                    'string',
                    'max:255',
                ],

                'city' => [
                    'required',
                    'string',
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

                'default_currency' => [
                    'required',

                    Rule::in([
                        'TRY',
                        'EUR',
                        'USD',
                        'GBP',
                    ]),
                ],

                'portal_password' => [
                    'required',
                    'confirmed',

                    Password::min(8)
                        ->letters()
                        ->numbers(),
                ],

                'notes' => [
                    'nullable',
                    'string',
                    'max:3000',
                ],

                'consent' => [
                    'accepted',
                ],
            ]);


        /*
        |--------------------------------------------------------------------------
        | Create agency + portal user atomically
        |--------------------------------------------------------------------------
        */

        [$agency, $user] =
            DB::transaction(
                function () use ($data): array {

                    $agency =
                        Agency::create([

                            'company_name' =>
                                $data[
                                    'company_name'
                                ],

                            'legal_name' =>
                                $data[
                                    'legal_name'
                                ]
                                ?? null,

                            'email' =>
                                $data[
                                    'email'
                                ],

                            'phone' =>
                                $data[
                                    'phone'
                                ],

                            'website' =>
                                $data[
                                    'website'
                                ]
                                ?? null,

                            'country_code' =>
                                $data[
                                    'country_code'
                                ]
                                ?? null,

                            'country_name' =>
                                $data[
                                    'country_name'
                                ],

                            'city' =>
                                $data[
                                    'city'
                                ],

                            'tax_number' =>
                                $data[
                                    'tax_number'
                                ]
                                ?? null,

                            'registration_number' =>
                                $data[
                                    'registration_number'
                                ]
                                ?? null,

                            'default_currency' =>
                                $data[
                                    'default_currency'
                                ],

                            /*
                            |--------------------------------------------------------------------------
                            | Commercial defaults
                            |--------------------------------------------------------------------------
                            */

                            'discount_percent' =>
                                0,

                            /*
                            |--------------------------------------------------------------------------
                            | Approval state
                            |--------------------------------------------------------------------------
                            |
                            | The agency exists immediately,
                            | but cannot operate until approved.
                            |
                            */

                            'is_active' =>
                                false,

                            'status' =>
                                'pending',

                            'notes' =>
                                $data[
                                    'notes'
                                ]
                                ?? null,
                        ]);


                    /*
                    |--------------------------------------------------------------------------
                    | Create Agency Portal user
                    |--------------------------------------------------------------------------
                    |
                    | The user's password is stored through the User model's
                    | password handling. The account remains inactive until
                    | the agency is approved by Skyfleet operations.
                    |
                    */

                    $user =
                        User::create([

                            'agency_id' =>
                                $agency->id,

                            'name' =>
                                $agency
                                    ->company_name,

                            'email' =>
                                $agency
                                    ->email,

                            'phone' =>
                                $agency
                                    ->phone,

                            'password' =>
                                $data[
                                    'portal_password'
                                ],

                            'role' =>
                                'agency',

                            'is_active' =>
                                false,
                        ]);


                    return [
                        $agency,
                        $user,
                    ];
                }
            );


        /*
        |--------------------------------------------------------------------------
        | Confirmation email
        |--------------------------------------------------------------------------
        |
        | The agency application must remain saved even if SMTP temporarily
        | fails. Therefore mail failure is logged but does not roll back
        | the application or portal user.
        |
        */

        try {
            \App\Support\SkyMail::mailer('agency')->to(
                $agency->email
            )->send(
                new AgencyApplicationReceivedMail(
                    $agency
                )
            );
        } catch (\Throwable $exception) {

            Log::warning(
                'Agency application confirmation email could not be sent.',
                [
                    'agency_id' =>
                        $agency->id,

                    'user_id' =>
                        $user->id,

                    'email' =>
                        $agency->email,

                    'error' =>
                        $exception
                            ->getMessage(),
                ]
            );
        }


        /*
        |--------------------------------------------------------------------------
        | Response
        |--------------------------------------------------------------------------
        */

        return response()->json(
            [
                'message' =>
                    'Agency application received successfully.',

                'data' => [
                    'id' =>
                        $agency->id,

                    'company_name' =>
                        $agency
                            ->company_name,

                    'status' =>
                        $agency
                            ->status,

                    'portal_account_created' =>
                        true,

                    'portal_account_active' =>
                        false,
                ],
            ],
            201
        );
    }
}
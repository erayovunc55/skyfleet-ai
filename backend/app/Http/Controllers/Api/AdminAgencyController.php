<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Agency;
use App\Models\Transfer;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;

class AdminAgencyController extends Controller
{
    public function index(): JsonResponse
    {
        $agencies = Agency::query()
            ->withCount([
                'users',
                'transfers',
            ])
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'data' => $agencies,
        ]);
    }

    public function show(
        Agency $agency
    ): JsonResponse {
        $agency->load([
            'users:id,agency_id,name,email,phone,role,is_active',
        ]);

        $transfers = Transfer::query()
            ->where('agency_id', $agency->id)
            ->orderByDesc('pickup_time')
            ->limit(50)
            ->get();

        return response()->json([
            'data' => [
                'agency' => $agency,
                'transfers' => $transfers,
            ],
        ]);
    }

    public function store(
        Request $request
    ): JsonResponse {
        $data = $this->validateAgency(
            $request
        );

        $agency = Agency::create(
            $data
        );

        return response()->json([
            'message' =>
                'Acenta oluşturuldu.',

            'data' =>
                $agency,
        ], 201);
    }

    public function update(
        Request $request,
        Agency $agency
    ): JsonResponse {
        $data = $this->validateAgency(
            $request,
            $agency
        );

        $agency->update(
            $data
        );

        return response()->json([
            'message' =>
                'Acenta güncellendi.',

            'data' =>
                $agency->fresh(),
        ]);
    }

    public function toggleStatus(
        Agency $agency
    ): JsonResponse {
        $activating = !$agency->is_active;

        $agency->update([
            'is_active' => $activating,
            'status' => $activating ? 'active' : 'inactive',
        ]);

        User::query()
            ->where('agency_id', $agency->id)
            ->where('role', 'agency')
            ->update(['is_active' => $activating]);

        if ($activating && $agency->email) {
            $this->sendApprovalMail($agency);
        }

        return response()->json([
            'message' =>
                'Acenta durumu güncellendi.',

            'data' =>
                $agency->fresh(),
        ]);
    }

    private function sendApprovalMail(Agency $agency): void
    {
        $url = rtrim(
            (string) config('services.agency_portal.url', 'https://skytriptransfer.com/agency'),
            '/'
        );

        try {
            \App\Support\SkyMail::raw('agency', 
                "Sayın {$agency->company_name},\n\nAcenta başvurunuz onaylandı. Acenta Portalı'na e-posta adresiniz ve başvuruda belirlediğiniz şifre ile giriş yapabilirsiniz:\n{$url}\n\nŞifrenizi unuttuysanız giriş ekranındaki \"Şifremi unuttum\" bağlantısını kullanabilirsiniz.\n\n---\n\nDear {$agency->company_name},\n\nYour agency application has been approved. You can now sign in to the Agency Portal with your email and the password you chose when applying:\n{$url}\n\nIf you forgot your password, use the \"Forgot password\" link on the sign-in page.\n\nSkyfleet AI",
                function ($message) use ($agency): void {
                    $message
                        ->to($agency->email, $agency->company_name)
                        ->subject('Skyfleet AI - Acenta Başvurunuz Onaylandı / Application Approved');
                }
            );
        } catch (\Throwable $exception) {
            Log::warning('Agency approval email could not be sent.', [
                'agency_id' => $agency->id,
                'error' => $exception->getMessage(),
            ]);
        }
    }
    public function createUser(
        Request $request,
        Agency $agency
    ): JsonResponse {
        $data = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'email' => [
                'required',
                'email',
                'max:255',
                'unique:users,email',
            ],

            'phone' => [
                'nullable',
                'string',
                'max:50',
                'unique:users,phone',
            ],

            'password' => [
                'required',
                'string',
                'min:8',
            ],
        ]);

        $user = User::create([
            ...$data,

            'agency_id' =>
                $agency->id,

            'role' =>
                'agency',

            'is_active' =>
                true,
        ]);

        return response()->json([
            'message' =>
                'Acenta kullanıcısı oluşturuldu.',

            'data' =>
                $user,
        ], 201);
    }

    private function validateAgency(
        Request $request,
        ?Agency $agency = null
    ): array {
        return $request->validate([
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
                'nullable',
                'email',
                'max:255',
            ],

            'phone' => [
                'nullable',
                'string',
                'max:50',
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
                'nullable',
                'string',
                'max:255',
            ],

            'city' => [
                'nullable',
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

            'discount_percent' => [
                'required',
                'numeric',
                'between:0,100',
            ],

            'is_active' => [
                'sometimes',
                'boolean',
            ],

            'status' => [
                'sometimes',
                Rule::in([
                    'active',
                    'inactive',
                    'pending',
                ]),
            ],

            'notes' => [
                'nullable',
                'string',
                'max:5000',
            ],
        ]);
    }
}

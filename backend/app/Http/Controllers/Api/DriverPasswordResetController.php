<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

class DriverPasswordResetController extends Controller
{
    public function createWhatsAppLink(Request $request, User $driver): JsonResponse
    {
        $supplierUser = $request->user();

        if (
            !$supplierUser ||
            $supplierUser->role !== 'supplier' ||
            !$supplierUser->is_active ||
            !$supplierUser->supplier_id
        ) {
            abort(403, 'Bu işlem yalnızca aktif tedarikçi kullanıcıları tarafından yapılabilir.');
        }

        if (
            $driver->role !== 'driver' ||
            (int) $driver->supplier_id !== (int) $supplierUser->supplier_id
        ) {
            abort(404, 'Sürücü bulunamadı.');
        }

        if (!$driver->is_active) {
            return response()->json([
                'message' => 'Pasif sürücü için şifre sıfırlama bağlantısı oluşturulamaz.',
            ], 422);
        }

        $phone = preg_replace('/\D+/', '', (string) $driver->phone);

        if (!$phone) {
            return response()->json([
                'message' => 'Sürücünün geçerli bir telefon numarası bulunmuyor.',
            ], 422);
        }

        $token = Password::broker()->createToken($driver);
        $driverAppUrl = rtrim((string) env('DRIVER_APP_URL', 'https://skytriptransfer.com/driver'), '/');
        $resetUrl = $driverAppUrl
            .'/?reset_token='.urlencode($token)
            .'&driver='.urlencode((string) $driver->id);

        $message = "Merhaba {$driver->name},\n\nSkyfleet AI sürücü hesabınızın şifresini yenilemek için aşağıdaki bağlantıyı kullanın:\n\n{$resetUrl}\n\nBu bağlantı 60 dakika geçerlidir ve tek kullanımlıktır.\n\nSkyfleet AI";

        return response()->json([
            'message' => 'Şifre sıfırlama bağlantısı hazırlandı.',
            'data' => [
                'driver_id' => $driver->id,
                'phone' => $driver->phone,
                'reset_url' => $resetUrl,
                'whatsapp_url' => 'https://wa.me/'.$phone.'?text='.rawurlencode($message),
            ],
        ]);
    }

    public function reset(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'driver_id' => ['required', 'integer'],
            'token' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $driver = User::query()
            ->whereKey($validated['driver_id'])
            ->where('role', 'driver')
            ->where('is_active', true)
            ->first();

        if (!$driver || !Password::broker()->tokenExists($driver, $validated['token'])) {
            return response()->json([
                'message' => 'Şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş.',
            ], 422);
        }

        $driver->forceFill([
            'password' => Hash::make($validated['password']),
            'remember_token' => Str::random(60),
        ])->save();

        Password::broker()->deleteToken($driver);
        $driver->tokens()->delete();

        return response()->json([
            'message' => 'Şifreniz başarıyla güncellendi. Yeni şifrenizle giriş yapabilirsiniz.',
        ]);
    }
}

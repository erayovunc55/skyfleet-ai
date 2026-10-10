<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\PanelPermissions;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminPanelUserController extends Controller
{
    private const PANEL_ROLES = ['dispatcher', 'admin', 'super_admin'];

    public function index(): JsonResponse
    {
        $users = User::query()
            ->whereIn('role', self::PANEL_ROLES)
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'phone', 'role', 'is_active', 'permissions', 'created_at']);

        return response()->json([
            'data' => $users,
            'modules' => PanelPermissions::MODULES,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:50', 'unique:users,phone'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', Rule::in(['dispatcher', 'admin'])],
            'modules' => ['nullable', 'array'],
            'modules.*' => ['string', Rule::in(PanelPermissions::MODULES)],
            'read_only' => ['nullable', 'boolean'],
        ]);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'password' => $data['password'],
            'role' => $data['role'],
            'is_active' => true,
            'permissions' => $this->buildPermissions($data),
        ]);

        return response()->json([
            'message' => 'Kullanıcı oluşturuldu.',
            'data' => $user->only(['id', 'name', 'email', 'phone', 'role', 'is_active', 'permissions']),
        ], 201);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $this->ensurePanelUser($user);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'phone' => ['nullable', 'string', 'max:50', Rule::unique('users', 'phone')->ignore($user->id)],
            'password' => ['nullable', 'string', 'min:8'],
            'role' => ['sometimes', Rule::in(['dispatcher', 'admin'])],
            'is_active' => ['sometimes', 'boolean'],
            'modules' => ['nullable', 'array'],
            'modules.*' => ['string', Rule::in(PanelPermissions::MODULES)],
            'read_only' => ['nullable', 'boolean'],
        ]);

        if ($user->id === $request->user()->id && array_key_exists('is_active', $data) && !$data['is_active']) {
            return response()->json(['message' => 'Kendi hesabınızı pasifleştiremezsiniz.'], 422);
        }

        if ($user->role === 'super_admin' && $request->user()->role !== 'super_admin') {
            return response()->json(['message' => 'Bu kullanıcıyı düzenleme yetkiniz yok.'], 403);
        }

        $fill = collect($data)->only(['name', 'email', 'phone', 'role', 'is_active'])->all();

        if (!empty($data['password'])) {
            $fill['password'] = $data['password'];
        }

        $role = $data['role'] ?? $user->role;

        if (array_key_exists('modules', $data) || array_key_exists('read_only', $data)) {
            $fill['permissions'] = $this->buildPermissions([
                'role' => $role,
                'modules' => $data['modules'] ?? ($user->permissions['modules'] ?? []),
                'read_only' => $data['read_only'] ?? ($user->permissions['read_only'] ?? false),
            ]);
        } elseif ($role !== 'dispatcher') {
            $fill['permissions'] = null;
        }

        $user->update($fill);

        if (array_key_exists('is_active', $data) && !$data['is_active'] || !empty($data['password'])) {
            $user->tokens()->delete();
        }

        return response()->json([
            'message' => 'Kullanıcı güncellendi.',
            'data' => $user->fresh()->only(['id', 'name', 'email', 'phone', 'role', 'is_active', 'permissions']),
        ]);
    }

    private function ensurePanelUser(User $user): void
    {
        abort_unless(in_array($user->role, self::PANEL_ROLES, true), 404);
    }

    /** Only dispatchers are restricted; admins always keep full access. */
    private function buildPermissions(array $data): ?array
    {
        if (($data['role'] ?? 'dispatcher') !== 'dispatcher') {
            return null;
        }

        return [
            'modules' => array_values(array_unique($data['modules'] ?? [])),
            'read_only' => (bool) ($data['read_only'] ?? false),
        ];
    }
}
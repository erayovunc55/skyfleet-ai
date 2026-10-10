<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TourPackage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class TourPackageController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = TourPackage::query()->orderBy('sort_order')->orderBy('title');
        if (! $request->user()) $query->where('is_active', true);
        return response()->json(['data' => $query->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        return $this->save($request, new TourPackage(), 201);
    }

    public function update(Request $request, TourPackage $tourPackage): JsonResponse
    {
        return $this->save($request, $tourPackage);
    }

    public function destroy(TourPackage $tourPackage): JsonResponse
    {
        $tourPackage->delete();
        return response()->json(['message' => 'Tour package deleted.']);
    }

    private function save(Request $request, TourPackage $package, int $status = 200): JsonResponse
    {
        $data = $request->validate([
            'region' => ['required', 'string', 'max:120'],
            'title' => ['required', 'string', 'max:180'],
            'description' => ['required', 'string', 'max:5000'],
            'image_url' => ['nullable', 'url', 'max:1000'],
            'tag' => ['nullable', 'string', 'max:80'],
            'duration' => ['nullable', 'string', 'max:80'],
            'price' => ['nullable', 'numeric', 'min:0'],
            'currency' => ['required', 'string', 'size:3'],
            'is_active' => ['boolean'],
            'sort_order' => ['integer', 'min:0', 'max:10000'],
        ]);
        $data['currency'] = strtoupper($data['currency']);
        $data['slug'] ??= Str::slug($data['title']);
        $package->fill($data)->save();
        return response()->json(['data' => $package->fresh()], $status);
    }
}

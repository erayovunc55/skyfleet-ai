<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Location;
use App\Models\Supplier;
use App\Models\SupplierCoverage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SupplierCoverageController extends Controller
{
    public function index(Supplier $supplier): JsonResponse
    {
        return response()->json(['data' => $supplier->coverages()
            ->with(['country:id,name,iso2','city:id,name,country_id','location:id,name,code,airport_id,latitude,longitude,geofence_radius_meters'])
            ->latest()->get()]);
    }

    public function store(Request $request, Supplier $supplier): JsonResponse
    {
        $data = $request->validate([
            'location_id'=>['required','integer','exists:locations,id'],
            'coverage_type'=>['nullable',Rule::in(['airport','city','service_area','polygon'])],
            'label'=>['nullable','string','max:150'],
            'service_radius_meters'=>['nullable','integer','min:0','max:500000'],
            'pickup_enabled'=>['nullable','boolean'],
            'dropoff_enabled'=>['nullable','boolean'],
            'is_active'=>['nullable','boolean'],
        ]);

        $location = Location::with(['country','city'])->findOrFail($data['location_id']);
        $coverage = SupplierCoverage::updateOrCreate(
            ['supplier_id'=>$supplier->id,'location_id'=>$location->id],
            [
                'country_id'=>$location->country_id,'city_id'=>$location->city_id,
                'coverage_type'=>$data['coverage_type'] ?? 'airport','label'=>$data['label'] ?? $location->name,
                'service_radius_meters'=>$data['service_radius_meters'] ?? $location->geofence_radius_meters,
                'pickup_enabled'=>$data['pickup_enabled'] ?? true,'dropoff_enabled'=>$data['dropoff_enabled'] ?? true,
                'is_active'=>$data['is_active'] ?? true,
            ]
        );

        return response()->json(['data'=>$coverage->load(['country:id,name,iso2','city:id,name,country_id','location:id,name,code,airport_id,latitude,longitude,geofence_radius_meters'])], 201);
    }

    public function update(Request $request, Supplier $supplier, SupplierCoverage $coverage): JsonResponse
    {
        abort_unless((int)$coverage->supplier_id === (int)$supplier->id, 404);
        $data=$request->validate([
            'service_radius_meters'=>['nullable','integer','min:0','max:500000'],
            'pickup_enabled'=>['nullable','boolean'],'dropoff_enabled'=>['nullable','boolean'],'is_active'=>['nullable','boolean'],
            'label'=>['nullable','string','max:150'],
        ]);
        $coverage->update($data);
        return response()->json(['data'=>$coverage->fresh()->load(['country:id,name,iso2','city:id,name,country_id','location:id,name,code,airport_id,latitude,longitude,geofence_radius_meters'])]);
    }

    public function destroy(Supplier $supplier, SupplierCoverage $coverage): JsonResponse
    {
        abort_unless((int)$coverage->supplier_id === (int)$supplier->id, 404);
        $coverage->delete();
        return response()->json(['message'=>'Coverage removed.']);
    }
}
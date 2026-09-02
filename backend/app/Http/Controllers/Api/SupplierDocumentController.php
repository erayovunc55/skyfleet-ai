<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use App\Models\SupplierDocument;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class SupplierDocumentController extends Controller
{
    public function index(Request $request, Supplier $supplier): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['nullable', Rule::in(SupplierDocument::TYPES)],
            'status' => ['nullable', Rule::in(['valid', 'expiring', 'expired', 'no_expiry'])],
            'search' => ['nullable', 'string', 'max:150'],
            'per_page' => ['nullable', 'integer', 'min:10', 'max:100'],
        ]);

        $query = $supplier->documents()->with('uploadedBy:id,name')->latest('id');

        if (!empty($validated['type'])) {
            $query->where('type', $validated['type']);
        }

        if (!empty($validated['search'])) {
            $search = trim($validated['search']);
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('document_number', 'like', "%{$search}%")
                    ->orWhere('note', 'like', "%{$search}%");
            });
        }

        $status = $validated['status'] ?? null;
        if ($status === 'expired') {
            $query->whereDate('expires_at', '<', now()->toDateString());
        } elseif ($status === 'expiring') {
            $query->whereBetween('expires_at', [now()->toDateString(), now()->addDays(60)->toDateString()]);
        } elseif ($status === 'valid') {
            $query->whereDate('expires_at', '>', now()->addDays(60)->toDateString());
        } elseif ($status === 'no_expiry') {
            $query->whereNull('expires_at');
        }

        $documents = $query->paginate((int) ($validated['per_page'] ?? 20));
        $documents->getCollection()->transform(fn (SupplierDocument $document) => $this->format($document));

        $all = $supplier->documents();
        $summary = [
            'total' => (clone $all)->count(),
            'expired' => (clone $all)->whereDate('expires_at', '<', now()->toDateString())->count(),
            'expiring' => (clone $all)->whereBetween('expires_at', [now()->toDateString(), now()->addDays(60)->toDateString()])->count(),
            'no_expiry' => (clone $all)->whereNull('expires_at')->count(),
        ];

        return response()->json([
            'data' => $documents->items(),
            'summary' => $summary,
            'meta' => [
                'current_page' => $documents->currentPage(),
                'last_page' => $documents->lastPage(),
                'per_page' => $documents->perPage(),
                'total' => $documents->total(),
            ],
        ]);
    }

    public function store(Request $request, Supplier $supplier): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['required', Rule::in(SupplierDocument::TYPES)],
            'title' => ['required', 'string', 'max:255'],
            'document_number' => ['nullable', 'string', 'max:150'],
            'issued_at' => ['nullable', 'date'],
            'expires_at' => ['nullable', 'date', 'after_or_equal:issued_at'],
            'note' => ['nullable', 'string', 'max:2000'],
            'file' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png,webp,doc,docx', 'max:15360'],
        ]);

        $path = $request->file('file')->store("supplier-documents/{$supplier->id}", 'public');

        $document = $supplier->documents()->create([
            'type' => $validated['type'],
            'title' => $validated['title'],
            'document_number' => $validated['document_number'] ?? null,
            'issued_at' => $validated['issued_at'] ?? null,
            'expires_at' => $validated['expires_at'] ?? null,
            'note' => $validated['note'] ?? null,
            'file_path' => $path,
            'uploaded_by' => $request->user()?->id,
        ]);

        $document->load('uploadedBy:id,name');

        return response()->json(['data' => $this->format($document)], 201);
    }

    public function destroy(Supplier $supplier, SupplierDocument $document): JsonResponse
    {
        abort_unless((int) $document->supplier_id === (int) $supplier->id, 404);

        Storage::disk('public')->delete($document->file_path);
        $document->delete();

        return response()->json(['message' => 'Supplier document deleted.']);
    }

    private function format(SupplierDocument $document): array
    {
        $expiresAt = $document->expires_at;
        $status = 'no_expiry';

        if ($expiresAt) {
            if ($expiresAt->isPast()) {
                $status = 'expired';
            } elseif ($expiresAt->lte(now()->addDays(60))) {
                $status = 'expiring';
            } else {
                $status = 'valid';
            }
        }

        return [
            'id' => $document->id,
            'type' => $document->type,
            'title' => $document->title,
            'document_number' => $document->document_number,
            'issued_at' => $document->issued_at?->toDateString(),
            'expires_at' => $document->expires_at?->toDateString(),
            'status' => $status,
            'note' => $document->note,
            'file_url' => url(Storage::disk('public')->url($document->file_path)),
            'uploaded_by' => $document->uploadedBy?->name,
            'created_at' => $document->created_at?->toISOString(),
        ];
    }
}

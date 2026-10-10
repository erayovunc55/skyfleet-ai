<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AiTrainingEntry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AiTrainingController extends Controller
{
    /**
     * List training entries.
     */
    public function index(Request $request): JsonResponse
    {
        $query = AiTrainingEntry::query();

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        if ($request->filled('country')) {
            $query->where('country', $request->country);
        }

        if ($request->filled('city')) {
            $query->where('city', $request->city);
        }

        if ($request->filled('airport_code')) {
            $query->where('airport_code', strtoupper($request->airport_code));
        }

        if ($request->filled('language')) {
            $query->where('language', $request->language);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $entries = $query
            ->latest()
            ->paginate(50);

        return response()->json($entries);
    }

    /**
     * Teach Skyfleet AI something new.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'question' => ['required', 'string', 'max:5000'],
            'answer' => ['required', 'string'],
            'category' => ['nullable', 'string', 'max:100'],
            'country' => ['nullable', 'string', 'max:100'],
            'city' => ['nullable', 'string', 'max:100'],
            'airport_code' => ['nullable', 'string', 'max:10'],
            'language' => ['nullable', 'string', 'max:10'],
            'priority' => ['nullable', 'in:low,normal,high,critical'],
            'status' => ['nullable', 'in:draft,active,inactive'],
        ]);

        if (!empty($validated['airport_code'])) {
            $validated['airport_code'] = strtoupper(
                $validated['airport_code']
            );
        }

        $validated['language'] = $validated['language'] ?? 'en';
        $validated['priority'] = $validated['priority'] ?? 'normal';
        $validated['status'] = $validated['status'] ?? 'active';

        if ($request->user()) {
            $validated['created_by'] = $request->user()->id;
        }

        $entry = AiTrainingEntry::create($validated);

        return response()->json([
            'message' => 'Skyfleet AI training entry created.',
            'data' => $entry,
        ], 201);
    }

    /**
     * Show one training entry.
     */
    public function show(AiTrainingEntry $aiTrainingEntry): JsonResponse
    {
        return response()->json([
            'data' => $aiTrainingEntry,
        ]);
    }

    /**
     * Correct or update something previously taught.
     */
    public function update(
        Request $request,
        AiTrainingEntry $aiTrainingEntry
    ): JsonResponse {
        $validated = $request->validate([
            'question' => ['sometimes', 'required', 'string', 'max:5000'],
            'answer' => ['sometimes', 'required', 'string'],
            'category' => ['nullable', 'string', 'max:100'],
            'country' => ['nullable', 'string', 'max:100'],
            'city' => ['nullable', 'string', 'max:100'],
            'airport_code' => ['nullable', 'string', 'max:10'],
            'language' => ['nullable', 'string', 'max:10'],
            'priority' => ['nullable', 'in:low,normal,high,critical'],
            'status' => ['nullable', 'in:draft,active,inactive'],
        ]);

        if (
            array_key_exists('airport_code', $validated)
            && $validated['airport_code']
        ) {
            $validated['airport_code'] = strtoupper(
                $validated['airport_code']
            );
        }

        $aiTrainingEntry->update($validated);

        return response()->json([
            'message' => 'Skyfleet AI training entry updated.',
            'data' => $aiTrainingEntry->fresh(),
        ]);
    }

    /**
     * Remove a training entry.
     */
    public function destroy(
        AiTrainingEntry $aiTrainingEntry
    ): JsonResponse {
        $aiTrainingEntry->delete();

        return response()->json([
            'message' => 'Skyfleet AI training entry deleted.',
        ]);
    }

    /**
     * Search the knowledge base.
     */
    public function search(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'q' => ['required', 'string', 'max:1000'],
            'airport_code' => ['nullable', 'string', 'max:10'],
            'city' => ['nullable', 'string', 'max:100'],
            'language' => ['nullable', 'string', 'max:10'],
            'category' => ['nullable', 'string', 'max:100'],
        ]);

        $term = trim($validated['q']);

        $query = AiTrainingEntry::query()
            ->where('status', 'active')
            ->where(function ($query) use ($term) {
                $query
                    ->where('question', 'like', '%' . $term . '%')
                    ->orWhere('answer', 'like', '%' . $term . '%')
                    ->orWhere('category', 'like', '%' . $term . '%')
                    ->orWhere('airport_code', 'like', '%' . $term . '%')
                    ->orWhere('city', 'like', '%' . $term . '%');
            });

        if (!empty($validated['airport_code'])) {
            $query->where(
                'airport_code',
                strtoupper($validated['airport_code'])
            );
        }

        if (!empty($validated['city'])) {
            $query->where('city', $validated['city']);
        }

        if (!empty($validated['language'])) {
            $query->where('language', $validated['language']);
        }

        if (!empty($validated['category'])) {
            $query->where('category', $validated['category']);
        }

        $results = $query
            ->orderByRaw("
                CASE priority
                    WHEN 'critical' THEN 1
                    WHEN 'high' THEN 2
                    WHEN 'normal' THEN 3
                    ELSE 4
                END
            ")
            ->limit(20)
            ->get();

        return response()->json([
            'query' => $term,
            'count' => $results->count(),
            'data' => $results,
        ]);
    }
}

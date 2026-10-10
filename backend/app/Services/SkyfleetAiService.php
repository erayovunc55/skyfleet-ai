<?php

namespace App\Services;

use App\Models\AiTrainingEntry;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class SkyfleetAiService
{
    public function ask(string $question): array
    {
        $knowledge = $this->findKnowledge($question);

        $context = $knowledge
            ->map(function (AiTrainingEntry $entry) {
                return implode("\n", [
                    "Knowledge ID: {$entry->id}",
                    "Category: " . ($entry->category ?: '-'),
                    "Country: " . ($entry->country ?: '-'),
                    "City: " . ($entry->city ?: '-'),
                    "Airport: " . ($entry->airport_code ?: '-'),
                    "Priority: {$entry->priority}",
                    "Question: {$entry->question}",
                    "Approved answer: {$entry->answer}",
                ]);
            })
            ->implode("\n\n---\n\n");

        if ($context === '') {
            $context = 'No matching Skyfleet training knowledge was found.';
        }

        $instructions = <<<'TEXT'
You are Skyfleet AI, an internal operations assistant for Skyfleet.

Your job is to help Skyfleet operations staff.

Rules:
- Treat the supplied Skyfleet Knowledge Base as the authoritative source for company-specific procedures.
- Never invent a Skyfleet procedure, policy, waiting time, meeting point, price, penalty, supplier rule, or operational fact.
- If the supplied knowledge is insufficient, clearly say that the information has not yet been taught to Skyfleet AI.
- Do not pretend to have checked live transfer, flight, driver, supplier, GPS, payment, or passenger data unless such data is explicitly supplied.
- Prefer approved Skyfleet procedures over generic advice.
- If there is a safety-critical issue, make that clear.
- Answer concisely and operationally.
- Answer in the same language as the user's question unless asked otherwise.
TEXT;

        $input = <<<TEXT
SKYFLEET KNOWLEDGE BASE:

{$context}

USER QUESTION:

{$question}
TEXT;

        $response = Http::withToken(
            config('services.openai.api_key')
        )
            ->acceptJson()
            ->timeout(60)
            ->post(
                'https://api.openai.com/v1/responses',
                [
                    'model' => config(
                        'services.openai.model',
                        'gpt-6-luna'
                    ),
                    'instructions' => $instructions,
                    'input' => $input,
                ]
            );

        if ($response->failed()) {
            throw new RuntimeException(
                'OpenAI request failed: '
                . $response->status()
                . ' '
                . $response->body()
            );
        }

        $data = $response->json();

        $answer = $this->extractText($data);

        if (!$answer) {
            throw new RuntimeException(
                'OpenAI returned no readable text.'
            );
        }

        foreach ($knowledge as $entry) {
            $entry->increment('usage_count');

            $entry->forceFill([
                'last_used_at' => now(),
            ])->save();
        }

        return [
            'answer' => $answer,

            'knowledge' => $knowledge
                ->map(fn (AiTrainingEntry $entry) => [
                    'id' => $entry->id,
                    'question' => $entry->question,
                    'category' => $entry->category,
                    'airport_code' => $entry->airport_code,
                    'priority' => $entry->priority,
                ])
                ->values()
                ->all(),

            'model' => config(
                'services.openai.model',
                'gpt-6-luna'
            ),
        ];
    }

    private function findKnowledge(string $question)
    {
        $words = collect(
            preg_split(
                '/[^\pL\pN]+/u',
                mb_strtolower($question),
                -1,
                PREG_SPLIT_NO_EMPTY
            )
        )
            ->filter(
                fn ($word) => mb_strlen($word) >= 3
            )
            ->unique()
            ->take(12)
            ->values();

        $query = AiTrainingEntry::query()
            ->where('status', 'active');

        if ($words->isNotEmpty()) {
            $query->where(function ($query) use ($words) {
                foreach ($words as $word) {
                    $query->orWhere(
                        'question',
                        'like',
                        "%{$word}%"
                    );

                    $query->orWhere(
                        'answer',
                        'like',
                        "%{$word}%"
                    );

                    $query->orWhere(
                        'category',
                        'like',
                        "%{$word}%"
                    );

                    $query->orWhere(
                        'city',
                        'like',
                        "%{$word}%"
                    );

                    $query->orWhere(
                        'airport_code',
                        'like',
                        "%{$word}%"
                    );
                }
            });
        }

        return $query
            ->orderByRaw("
                CASE priority
                    WHEN 'critical' THEN 1
                    WHEN 'high' THEN 2
                    WHEN 'normal' THEN 3
                    ELSE 4
                END
            ")
            ->limit(8)
            ->get();
    }

    private function extractText(array $data): ?string
    {
        if (!empty($data['output_text'])) {
            return trim($data['output_text']);
        }

        foreach ($data['output'] ?? [] as $output) {
            foreach ($output['content'] ?? [] as $content) {
                if (
                    ($content['type'] ?? null) === 'output_text'
                    && !empty($content['text'])
                ) {
                    return trim($content['text']);
                }
            }
        }

        return null;
    }
}

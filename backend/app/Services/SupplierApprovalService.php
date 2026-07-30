<?php

namespace App\Services;

use App\Models\ApprovalLog;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SupplierApprovalService
{
    public function submit(
        Supplier $supplier,
        ?User $actor = null,
        ?Request $request = null
    ): Supplier {
        return $this->transition(
            supplier: $supplier,
            newStatus: Supplier::STATUS_UNDER_REVIEW,
            actor: $actor,
            request: $request,
            action: 'submit',
            allowedStatuses: [
                Supplier::STATUS_PENDING,
                Supplier::STATUS_REVISION_REQUESTED,
                Supplier::STATUS_REJECTED,
            ],
            supplierUpdates: [
                'submitted_at' => now(),
                'rejected_at' => null,
                'rejection_reason' => null,
            ],
        );
    }

    public function approve(
        Supplier $supplier,
        User $actor,
        ?Request $request = null,
        ?string $note = null
    ): Supplier {
        return $this->transition(
            supplier: $supplier,
            newStatus: Supplier::STATUS_APPROVED,
            actor: $actor,
            request: $request,
            action: 'approve',
            note: $note,
            allowedStatuses: [
                Supplier::STATUS_PENDING,
                Supplier::STATUS_UNDER_REVIEW,
                Supplier::STATUS_REVISION_REQUESTED,
            ],
            supplierUpdates: [
                'approved_at' => now(),
                'approved_by' => $actor->id,
                'rejected_at' => null,
                'suspended_at' => null,
                'rejection_reason' => null,
                'suspension_reason' => null,
                'is_active' => true,
            ],
        );
    }

    public function requestRevision(
        Supplier $supplier,
        User $actor,
        string $reason,
        ?Request $request = null,
        ?string $note = null
    ): Supplier {
        return $this->transition(
            supplier: $supplier,
            newStatus: Supplier::STATUS_REVISION_REQUESTED,
            actor: $actor,
            request: $request,
            action: 'request_revision',
            reason: $reason,
            note: $note,
            allowedStatuses: [
                Supplier::STATUS_PENDING,
                Supplier::STATUS_UNDER_REVIEW,
            ],
            supplierUpdates: [
                'is_active' => false,
            ],
        );
    }

    public function reject(
        Supplier $supplier,
        User $actor,
        string $reason,
        ?Request $request = null,
        ?string $note = null
    ): Supplier {
        return $this->transition(
            supplier: $supplier,
            newStatus: Supplier::STATUS_REJECTED,
            actor: $actor,
            request: $request,
            action: 'reject',
            reason: $reason,
            note: $note,
            allowedStatuses: [
                Supplier::STATUS_PENDING,
                Supplier::STATUS_UNDER_REVIEW,
                Supplier::STATUS_REVISION_REQUESTED,
            ],
            supplierUpdates: [
                'rejected_at' => now(),
                'rejection_reason' => $reason,
                'approved_at' => null,
                'approved_by' => null,
                'is_active' => false,
            ],
        );
    }

    public function suspend(
        Supplier $supplier,
        User $actor,
        string $reason,
        ?Request $request = null,
        ?string $note = null
    ): Supplier {
        return $this->transition(
            supplier: $supplier,
            newStatus: Supplier::STATUS_SUSPENDED,
            actor: $actor,
            request: $request,
            action: 'suspend',
            reason: $reason,
            note: $note,
            allowedStatuses: [
                Supplier::STATUS_APPROVED,
            ],
            supplierUpdates: [
                'suspended_at' => now(),
                'suspension_reason' => $reason,
                'is_active' => false,
            ],
        );
    }

    public function reactivate(
        Supplier $supplier,
        User $actor,
        ?Request $request = null,
        ?string $note = null
    ): Supplier {
        return $this->transition(
            supplier: $supplier,
            newStatus: Supplier::STATUS_APPROVED,
            actor: $actor,
            request: $request,
            action: 'reactivate',
            note: $note,
            allowedStatuses: [
                Supplier::STATUS_SUSPENDED,
            ],
            supplierUpdates: [
                'approved_at' => $supplier->approved_at ?? now(),
                'approved_by' => $actor->id,
                'suspended_at' => null,
                'suspension_reason' => null,
                'is_active' => true,
            ],
        );
    }

    private function transition(
        Supplier $supplier,
        string $newStatus,
        ?User $actor,
        ?Request $request,
        string $action,
        array $allowedStatuses,
        array $supplierUpdates = [],
        ?string $reason = null,
        ?string $note = null,
        array $metadata = []
    ): Supplier {
        if (!in_array($supplier->status, $allowedStatuses, true)) {
            throw ValidationException::withMessages([
                'status' => sprintf(
                    '%s durumundaki tedarikçi için %s işlemi yapılamaz.',
                    $supplier->status,
                    $action
                ),
            ]);
        }

        return DB::transaction(function () use (
            $supplier,
            $newStatus,
            $actor,
            $request,
            $action,
            $supplierUpdates,
            $reason,
            $note,
            $metadata
        ): Supplier {
            $oldStatus = $supplier->status;

            $supplier->update([
                ...$supplierUpdates,
                'status' => $newStatus,
            ]);

            ApprovalLog::create([
                'approvable_type' => $supplier->getMorphClass(),
                'approvable_id' => $supplier->id,
                'old_status' => $oldStatus,
                'new_status' => $newStatus,
                'changed_by' => $actor?->id,
                'action' => $action,
                'reason' => $reason,
                'note' => $note,
                'ip_address' => $request?->ip(),
                'user_agent' => $request?->userAgent(),
                'metadata' => $metadata ?: null,
            ]);

            return $supplier
                ->fresh()
                ->load([
                    'approver',
                    'approvalLogs.changedBy',
                ]);
        });
    }
}
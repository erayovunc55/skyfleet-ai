<?php

namespace App\Observers;

use App\Models\Transfer;
use App\Services\TransferLocationResolver;

class TransferObserver
{
    public function __construct(
        private readonly TransferLocationResolver $resolver,
    ) {
    }

    public function creating(Transfer $transfer): void
    {
        $this->resolver->apply($transfer);
    }
}

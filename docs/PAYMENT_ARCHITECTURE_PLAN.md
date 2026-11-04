# Payment Architecture Plan

## Objective

Enable approved supplier payouts through Stripe Connect, Payoneer, or a Visa program while preserving the existing transfer finance records and creating transparent platform revenue.

This document is an implementation plan. It does not activate live money movement. Each provider requires a commercial agreement, account approval, KYC/AML controls, and production credentials.

## Recommended operating model

The platform remains the system of record. A payout is created only from an approved `TransferFinancial` record and is completed only after a provider webhook confirms the result.

```text
Completed transfer
        |
        v
TransferFinancial (gross, supplier payable, platform margin)
        |
        v
Payout request -> risk/KYC checks -> provider adapter
        |                              |
        |                              +-- Stripe Connect
        |                              +-- Payoneer
        |                              +-- Visa card program
        v
Immutable ledger + provider webhook + reconciliation
```

Do not describe the platform balance as escrow until the legal entity, licensed payment model, and provider terms explicitly support that structure.

## Provider roles

| Channel | Primary role | Best fit | Important constraint |
| --- | --- | --- | --- |
| Stripe Connect | Marketplace collection and connected-account payout | Card payments and suppliers supported by Stripe | Country and business-model availability must be confirmed |
| Payoneer | Cross-border supplier payout | International suppliers and local receiving methods | API/program access and payout corridors require approval |
| Visa program | Card-based supplier access | Virtual/prepaid card expense or payout programs | Visa is a network; an issuing/program partner and compliance program are also required |

Use adapters behind one internal contract. The business rules must never call a provider SDK directly.

## Internal payment contract

Every payout needs these fields, regardless of provider:

- internal payout ID and idempotency key
- supplier ID and source `TransferFinancial` ID
- gross amount, supplier payable, platform fee, FX fee, and net payout
- source and destination currency
- selected provider and payout method
- provider account/token reference, never raw bank or card details
- status, failure code, retry count, timestamps, and audit actor
- webhook event IDs and reconciliation state

Suggested lifecycle:

`pending` -> `under_review` -> `approved` -> `submitted` -> `processing` -> `paid`

Terminal or exception states:

`failed`, `cancelled`, `reversed`, `disputed`

Provider webhooks must be idempotent, signature-verified, stored before processing, and mapped to the internal payout ID. A browser callback must never mark a payout as paid.

## Revenue model

Keep revenue components separate so supplier statements and refunds remain auditable:

| Component | Calculation | Rule |
| --- | --- | --- |
| Platform margin | Existing gross minus supplier payable | Existing transfer agreement controls this |
| Payout fee | Fixed amount or percentage | Display before supplier approval |
| FX fee | Configured spread or disclosed conversion fee | Record source rate and applied rate |
| Fast payout fee | Optional fixed or percentage fee | Charge only when the provider supports the speed |
| Service subscription | Contracted recurring amount | Keep separate from transfer settlement |

For a supplier payout, the ledger should make the following identity explicit:

`gross amount = supplier payable + platform margin`

Provider costs must be recorded separately from platform revenue. Do not hide provider fees inside the margin field.

## Routing rules

The first release should use explicit admin-configured routing, not an opaque automatic optimizer:

1. Confirm supplier approval, KYC status, payout currency, limits, and bank/card destination.
2. Use Stripe Connect when a supported connected account exists and the transaction model is eligible.
3. Use Payoneer for an approved international payout corridor.
4. Use the Visa program only for an active issuing/program relationship and an eligible card product.
5. Otherwise keep the payout `under_review`; never silently fall back to another provider.

Routing decisions and overrides must be auditable.

## Backend implementation order

### Phase 1: Domain and controls

- Add payout, payment attempt, webhook event, and ledger entry models/migrations.
- Add provider adapter interfaces and a fake adapter for automated tests.
- Add supplier payout profile fields for provider, country, currency, KYC state, and external account reference.
- Add idempotency and unique constraints for source financial record and provider event ID.
- Add authorization, amount limits, maker-checker approval, and audit logging.

### Phase 2: Sandbox integrations

- Implement Stripe Connect onboarding, account status, payout creation, and webhook verification.
- Implement Payoneer only after API/program access and sandbox credentials are approved.
- Implement Visa through the selected issuer/program partner; do not build against the Visa network directly.
- Add retry handling with backoff and a dead-letter/manual review state.

### Phase 3: Reconciliation and operations

- Add admin screens for payout queue, provider status, failures, refunds/reversals, and reconciliation.
- Add supplier-visible payout history and fee breakdown.
- Run daily provider-to-ledger reconciliation and alert on unmatched amounts.
- Enable live credentials one provider at a time after sandbox sign-off.

## Required API surface

These names are proposals for the active backend; implementation should follow existing route and authorization conventions:

- `GET /api/admin/payouts`
- `POST /api/admin/payouts/{payout}/approve`
- `POST /api/admin/payouts/{payout}/submit`
- `POST /api/admin/payouts/{payout}/cancel`
- `GET /api/supplier/finance/payouts`
- `POST /api/payments/{provider}/webhook`
- `GET /api/admin/payment-reconciliation`

The submit endpoint should enqueue a job and return the internal payout ID. It should not wait for provider settlement.

## Security and compliance gate

Before live activation, obtain written confirmation for:

- supported countries, currencies, payout corridors, and business model
- KYC/AML, sanctions screening, and beneficial-owner requirements
- tax documents, invoices, and supplier statements
- PCI scope and tokenization responsibilities
- refund, chargeback, reversal, and negative-balance ownership
- data retention, webhook signature verification, and secret rotation
- customer funds, safeguarding, licensing, and money-transmission obligations

No card number, CVV, bank password, or provider secret may be stored in this repository or in application logs.

## Acceptance criteria for live launch

- A supplier cannot receive a payout without approved status and completed KYC checks.
- Repeating the same submit request cannot create a second provider payout.
- A forged, duplicated, or out-of-order webhook cannot corrupt the internal state.
- Every paid payout reconciles to one provider event and one ledger entry.
- Supplier sees gross amount, each fee, net amount, provider, and settlement reference.
- Failed and reversed payouts return to a controlled manual-review flow.
- Sandbox tests, backend tests, frontend build, health check, and release gate all pass.

## Immediate decision sequence

1. Confirm the legal entity and countries in which suppliers will be paid.
2. Decide whether the customer pays by card, bank transfer, or both.
3. Select Stripe Connect as the first sandbox provider if its country and marketplace eligibility are confirmed.
4. Start Payoneer commercial/API onboarding for international corridors.
5. Select a Visa issuer/program partner only if card-based supplier spending is a real requirement.
6. Implement Phase 1 domain tables and adapters before adding any live provider SDK.

The existing `TransferFinancial` records remain the source for the supplier payable and platform margin. The new payout layer should reference them, not recalculate or replace them.
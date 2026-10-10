# Operational Checklist

## Daily checks

- [ ] Confirm active project source is still the live source of truth.
- [ ] Run the release gate if changes are pending.
- [ ] Validate environment variables and secrets.
- [ ] Confirm external services are reachable.
- [ ] Review recent logs and warning patterns.

## Before production release

- [ ] Release notes are prepared.
- [ ] Deployment script is run.
- [ ] Release gate is passing.
- [ ] Rollback path is documented.
- [ ] Owner approves release.

## After deployment

- [ ] Health checks pass.
- [ ] Main user flows work.
- [ ] Monitoring is checked.
- [ ] Errors are reviewed and closed if needed.

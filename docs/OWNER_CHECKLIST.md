# Owner Checklist

## Before release

- [ ] Confirm active project source is the live source of truth.
- [ ] Confirm all backups are read-only references only.
- [ ] Verify all code changes are reviewed.
- [ ] Run the full release gate: `npm run release:check`
- [ ] Confirm no secret or private values are committed.
- [ ] Verify the environment template matches the target deployment environment.
- [ ] Prepare release notes.
- [ ] Verify rollback plan is ready.

## Deployment approval

- [ ] Frontend build passed.
- [ ] Backend tests passed.
- [ ] Health endpoint passed.
- [ ] Monitoring and notifications are ready.
- [ ] Deployment owner has reviewed the release.
- [ ] Rollback owner is assigned.

## After deployment

- [ ] Confirm frontend is reachable.
- [ ] Confirm backend health endpoint responds with `ok`.
- [ ] Confirm critical external integrations are working.
- [ ] Review logs and alert channels.
- [ ] Save release notes in the project documentation.

## Final owner sign-off

Owner name: ____________
Date: ____________
Approval: ____________

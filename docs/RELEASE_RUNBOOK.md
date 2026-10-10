# Release Runbook

## Purpose

This runbook defines the minimum operational and release standards for the active project.

## Active project rule

Only the live workspace project is considered the source of truth.

- Backup archives are read-only references
- Legacy file sets must not be used as live code paths
- Release decisions must be based on the active app tree only

## Pre-release checklist

1. Confirm the branch and environment target.
2. Confirm the source of truth is the active project.
3. Review all changed files and commit scope.
4. Validate environment variables.
5. Run smoke validation:
   - `npm run smoke:test`
   - `cd backend && php artisan test`
6. Confirm no secrets are committed.
7. Check logs and monitoring for active issues.

## Production release checklist

- [ ] Build passes
- [ ] Environment validation passes
- [ ] Backend tests pass
- [ ] Critical flows are smoke-tested
- [ ] Rollback plan is prepared
- [ ] Deployment notes are recorded
- [ ] Monitoring is active after deployment

## Rollback policy

If release validation fails:
1. Stop deployment.
2. Revert the failing release branch or commit.
3. Restore the last known good environment state.
4. Re-run validation.
5. Document the issue and retest before retrying.

## Post-release monitoring

Check the following after deployment:
- API health
- UI availability
- Key user flows
- Error logs
- External service integrations

## Owner

The project owner or lead developer must confirm release readiness before production deployment.

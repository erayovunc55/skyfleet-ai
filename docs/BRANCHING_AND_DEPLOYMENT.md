# Branching and Deployment Policy

## Branch strategy

Use a simple and consistent release workflow for the active project:

- `main` - production-ready branch
- `develop` - integration branch for active development
- `feature/*` - individual feature work
- `hotfix/*` - urgent production fixes

## Rules

1. No direct commit to `main`.
2. All feature work starts from `develop`.
3. Production release is created from a validated `develop` branch.
4. Hotfix branches are merged directly into `main` and then back into `develop`.
5. Every merge request must pass the active release gate.

## Release flow

1. Update feature branch from `develop`.
2. Complete development and validation locally.
3. Run the active release gate:
   - `npm run release:check`
4. Open pull request against `develop`.
5. Review changes and confirm the release checklist.
6. Merge to `develop`.
7. Promote validated changes to `main` for production deployment.

## Deployment rule

Production deployment must not happen without:
- successful environment validation
- successful frontend build
- successful backend tests
- final release checklist confirmation
- rollback plan ready

## Operational responsibilities

- Developer: validates code and feature readiness
- Maintainer: checks release quality and merge approval
- Owner: confirms production deployment readiness

## Documentation requirement

Every release should record:
- release summary
- impacted area
- validation results
- rollback status
- owner confirmation

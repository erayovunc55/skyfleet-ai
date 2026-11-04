# GitHub Production Policy

## Branch protection

Use the following production policy for GitHub:

- `main` is the production branch.
- `develop` is the integration branch.
- Direct pushes to `main` are prohibited.
- Pull requests are required before merging to `main`.
- At least one review is required for production merges, except for the single-developer workflow below.
- The release check must pass before merge.

## Single-developer workflow

When the project owner is the only developer and GitHub prevents self-approval,
the owner's explicit approval may replace the independent review requirement.
Record that approval in the pull request before merging. Pull requests, passing
checks, deployment readiness validation, and a rollback plan remain required.
Do not disable or bypass GitHub branch protection to use this exception.

For PR #2, the project owner approved production deployment and this exception
in the release conversation on 2026-11-04. This approval does not attest that
host deployment or rollback readiness has already been verified.

## Required checks

The following checks must pass before production merge:

- `npm run release:check`
- health validation
- environment validation
- deployment readiness review

## Release rule

Production deploys must be triggered only from a validated branch and must be approved by the project owner.

## Security rule

Never store production secrets in repository files or environment variables committed to source control. Use GitHub Actions secrets or the host secret manager.

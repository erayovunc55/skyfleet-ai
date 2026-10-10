# GitHub Production Policy

## Branch protection

Use the following production policy for GitHub:

- `main` is the production branch.
- `develop` is the integration branch.
- Direct pushes to `main` are prohibited.
- Pull requests are required before merging to `main`.
- At least one review is required for production merges.
- The release check must pass before merge.

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

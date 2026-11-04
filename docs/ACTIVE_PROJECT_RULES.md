# Active Project Rules

## Source of truth

The current workspace is the active project source of truth.

- Use only files in the active project tree for development
- Do not use archive files as live source
- Treat ZIP/TAR backups as historical references only
- Keep all active app folders under a single, explicit project workflow

## Workflow policy

1. Determine the active app before editing.
2. Confirm the source belongs to the current live project.
3. Keep backup archives outside the active development flow.
4. Update documentation if a new active app is introduced.
5. Use release checks before moving changes to production.

## Ownership

Each app area must have a clear owner and a clear purpose:
- root frontend app
- backend API
- driver app
- supplier app
- passenger tracking app
- website app

## Release standard

Before any production or staging deployment:
- build runs successfully
- environment variables are validated
- secrets are not committed
- critical flows are smoke-tested
- rollback plan is prepared

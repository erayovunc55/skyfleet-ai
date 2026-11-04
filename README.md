# SKYFLEET AIeski

Professional project setup and active workflow documentation for the current workspace.

## Project status

The active project is the current workspace version and not the legacy backup archives stored in the root directory.

Validation status:
- Frontend build check executed successfully
- Command: `npm run build`
- Result: build completed successfully with exit code 0

## Active workflow rule

- Use only the active project files in the workspace
- Treat backup, recovery, and archive ZIP/TAR files as historical references only
- Do not reuse old versions as the live source of truth
- Keep production, staging, and local configuration separated

## Repository layout

- `backend/` - Laravel backend application
- `frontend/` - main frontend app
- `driver-app/` - driver app
- `supplier-app/` - supplier app
- `passenger-tracking-app/` - passenger tracking app
- `website/` - website app
- `src/` - root frontend source used by the active app
- `public/` - root public assets
- `database/` - shared database migration and seed assets

## Local development

### Root frontend app

```bash
npm install
npm run dev
```

### Production build validation

```bash
npm run build
```

## Environment configuration

Use the project environment files as the source of configuration for local and deployment settings.

- Keep secrets out of source control
- Use `.env.example` as a safe template
- Keep `.env` files local-only

## Professional standards

This project follows a professional delivery pattern:

- Active code only; no legacy clone is used as live development source
- Build validation before release
- Clean separation of active files and historical backup archives
- Versioned workflow and deployment discipline
- Documentation aligned with the current live setup

## Important note

The historical archive files in the repository root are intentionally not the active project source. They should be treated as backups and reference materials only.

## License

Project-specific terms should be defined by the owning team or client. Use the active production contract and delivery requirements rather than archive-only assumptions.

# Deployment Checklist

## Pre-deployment

- [ ] Active project source is confirmed
- [ ] Backup and archive folders are not used as live source
- [ ] Environment files are reviewed and sanitized
- [ ] Secrets are not committed to the repository
- [ ] Production config is separated from local config
- [ ] Build passes successfully
- [ ] Critical path tests are run
- [ ] Error logging and monitoring are available

## Release validation

- [ ] Frontend build passes
- [ ] Backend boot check passes if applicable
- [ ] API endpoints respond correctly
- [ ] Authentication and permissions work
- [ ] Critical user flows are validated
- [ ] Rollback procedure is documented

## Post-deployment

- [ ] Health check is verified
- [ ] Logs are reviewed
- [ ] Error monitoring is checked
- [ ] Any release issue is tracked and resolved
- [ ] Deployment notes are recorded

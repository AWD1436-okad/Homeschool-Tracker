# Testing Log

## Current Status
Source-code linting passed for the current application code.

Production build verification is currently blocked by Windows/OneDrive file locking in the local workspace. Next.js build output files could not be renamed reliably during the build step.

## Planned Testing Areas
- Sign-up and verification
- Login and session persistence
- Subject and book management
- Book page count add, edit, and delete flows
- Delete-account reset flow for local saved data
- Task creation with subject, book, page, and save
- Task status updates
- Current-day deletion rules
- Previous-day edit and delete restrictions
- Daily carry-over behavior
- History browsing
- Offline viewing and offline task changes
- Sync after reconnect

## Testing Notes
- Browser-based testing should be used for critical user-facing flows when available
- Carry-over logic needs direct edge-case testing to prevent duplicates
- Mobile layout should be checked during implementation, not only at the end

## Tests Run
- `npm.cmd run lint` in `homeschool-daily-tracker` passed after source updates
- `next build` was attempted multiple times but blocked by local filesystem permission and locking errors

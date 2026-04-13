# Decisions and Assumptions

## Confirmed
- Version 1 should be simple, mobile-first, and reliable
- The first version is for one main student user
- Books and subjects should be user-managed in Settings
- Previous-day tasks remain in history and cannot be deleted

## Working Assumptions Pending Confirmation
- Use Next.js for the web app
- Use Supabase for authentication, database, and email-based verification flows
- Use a PWA setup for installability and basic offline support
- Offline use applies to returning signed-in users, not first-time sign-up while disconnected
- Login verification requirement may be implemented as a verification code or one-time password flow if needed to match the brief in a practical way
- The active app code currently lives in the `homeschool-daily-tracker` subfolder while project memory files remain in the main project folder

## Open Product Questions
1. Must login require a fresh email code every single time, or is password plus remembered device acceptable after a verified account has already been created?
2. When editing a previous-day task, should that update only that historical record, or should related carry-over copies on newer days stay unchanged?
3. Should the first version include only one account at a time per student, or do you expect more than one independent student account later with separate data?
4. Do you want the initial version hosted publicly on the web after build, or should we first focus only on a working local/development version?

## Technical Decisions to Keep Simple
- No parental mode in version 1
- No push notifications in version 1
- No advanced analytics in version 1
- No over-custom offline sync engine in version 1
- Start by proving the planner workflow locally before wiring in cloud authentication and sync

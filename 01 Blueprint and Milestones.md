# Blueprint and Milestones

## Product Shape
The safest version 1 is a mobile-first web app that can also behave like an installable phone app. It should focus on fast daily task entry, simple navigation, reliable carry-over logic, and clear history.

## Recommended Technical Stack
### Frontend
- Next.js
- TypeScript
- Tailwind CSS
- Progressive Web App setup for phone-friendly install and offline caching

### Backend and Database
- Supabase Authentication for account sign-up and login
- Supabase Postgres database for subjects, books, tasks, and daily records
- Row Level Security so each user only sees their own data

### Offline Approach
- Local caching plus queued offline edits in the browser
- Sync to Supabase when the connection returns
- No custom real-time sync engine in version 1

### Why this is the safest option
- Standard tools with strong documentation
- One main backend service instead of many moving parts
- Easy to host
- Works well for a single-user-first product
- Good path for future growth without overbuilding now

## Architecture Summary
### Core data areas
- Users
- Subjects
- Books
- Daily task entries
- Optional queued offline changes

### Main rules
- Opening a new date should ensure a daily list exists
- Carry over previous-day unfinished work only once per day
- Previous-day tasks remain editable but not deletable
- Arabic tasks show an extra exercise field

## Important Risks and Open Decisions
1. Login with a verification code every single time is stricter than most apps and may feel heavier for daily use. We should confirm whether this is truly required for every login in version 1.
2. Offline use can work well only after the user has already signed in before. Full offline sign-up or first-time login is not realistic.
3. Carry-over must be idempotent so tasks are not duplicated if the app is opened multiple times on the same day.
4. Editing previous-day tasks may affect history expectations. We need to keep this rule explicit and consistent.
5. Calendar and History should stay simple in version 1 and avoid becoming separate planning systems.

## Milestone Plan
### Milestone 1: Foundation and Product Frame
- Confirm the remaining product decisions
- Scaffold the app
- Set up project structure, styling, linting, and core documentation
- Prepare database schema and auth plan

### Milestone 2: Authentication and Core Data
- Set up sign-up, login, logout, and verification flows
- Create database tables and security rules
- Add starter layout and protected app shell

### Milestone 3: Today Screen and Settings
- Build subject and book management in Settings
- Build new task flow on Today
- Add task editing, deletion, and status updates
- Add Arabic exercise logic

### Milestone 4: Carry-Over, History, and Calendar
- Implement day creation and carry-over logic
- Build History browsing
- Build Calendar date navigation and day view
- Enforce past-day deletion restrictions

### Milestone 5: Offline Support, QA, and Handover
- Add simple offline caching and queued write sync
- Test phone-friendly flows and core edge cases
- Prepare deployment notes, environment notes, and plain-English handover

## Provisional Recommendation
Proceed with Next.js plus Supabase plus PWA unless a later user answer changes the direction.

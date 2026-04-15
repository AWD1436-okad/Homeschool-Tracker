# Current Status

## What this project is
Homeschool Daily Tracker is a mobile-first homeschool daily planner for one student user. It focuses on daily tasks, carry-over of unfinished work, history, calendar browsing, and simple settings for subjects and books.

## What has been completed
- Reviewed the initial project brief
- Identified the main product risks and open questions
- Chosen a provisional safest-stack recommendation
- Created project memory files
- Scaffolded a Next.js app in the `homeschool-daily-tracker` subfolder
- Built the first mobile-first planner shell using local browser storage
- Implemented simplified Today, History, and Settings screens
- Implemented task creation, editing, status updates, carry-over, and deletion rules
- Removed the exercise step from version 1 task creation
- Added book page counts and book deletion in Settings
- Added a Settings action to delete the local account and reset saved app data
- Verified source-code linting for the current app code

## What still needs to be done
- Confirm remaining product decisions
- Implement authentication
- Connect local planner data to a backend
- Add true PWA/offline install behavior
- Test critical flows
- Prepare deployment and handover notes

## Risks and Watchouts
- Strict verification during every login may add friction
- Offline support must stay simple
- Carry-over must not duplicate tasks
- Past-day editing must remain predictable
- Windows/OneDrive is currently locking Next.js build output files, which blocked full production build verification in this environment

## Current Working Assumption
We will build a Next.js PWA using Supabase unless the next discovery answers suggest a better fit.

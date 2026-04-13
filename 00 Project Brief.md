# Homeschool Daily Tracker

## Project Summary
Homeschool Daily Tracker is a phone-friendly homeschool planning app for one main student user. It helps the user create and manage a daily homeschooling task list. Each day has its own daily list. Unfinished tasks carry over into the next day while completed tasks remain in history.

The first version should be simple, clean, reliable, easy to use on a phone, and suitable for a non-technical user.

## Primary User
- Main user: student
- Future optional user type: parent via parental mode, not included in version 1

## Main Screens
- Today
- History
- Calendar
- Settings
- Sign up / login / verification

## Main Daily Workflow
1. Tap New Task
2. Select Subject
3. Select Book
4. Enter Page
5. If Subject is Arabic, enter Exercise
6. Save task to today's list

## Task Data
- Subject
- Book
- Page
- Arabic Exercise only when subject is Arabic
- Status

## Task Status Options
- Not done
- In progress
- Done

## Daily Carry-Over Logic
When a new day begins:
- Create a fresh daily list for the new day
- Carry over tasks from the previous day with status Not done or In progress
- Do not carry over tasks with status Done

## Editing and Deletion Rules
- No day can be deleted
- Current-day tasks can be edited
- Current-day tasks can be deleted
- Previous-day tasks can be edited
- Previous-day tasks cannot be deleted
- Previous-day records remain in history

## History and Calendar
- App opens to Today
- User can navigate to History
- User can navigate to Calendar
- Past daily records stay stored and visible

## Settings
User can:
- Add subjects
- Add books under subjects
- Edit subjects
- Edit books
- Store subject and book options for future task creation

Starter subject examples:
- Islamic Studies
- Arabic
- Math
- English

## Authentication
Sign up requires:
- Full name
- Email
- Password
- Email verification code

Login requires:
- Email
- Password
- Email verification code

Email verification is also required for other security-related actions such as password reset and sensitive account changes.

## Offline and Online Requirement
- Important screens should remain viewable during weak or temporary internet loss
- User should be able to add and edit tasks offline where reasonably possible
- Data should sync safely when connection returns
- The first version should use the simplest standard offline-capable setup, not a custom sync engine

## Non-Goals for Version 1
- Parental mode
- Notifications or reminders
- Complex analytics
- Multi-user family dashboards
- Advanced permissions
- App store publishing complexity before the core planner works well
- Overly custom infrastructure

## Success Criteria
- User can create an account with email verification
- User can log in with email verification
- User stays logged in until manual logout
- User can add books in settings
- User can create daily tasks using subject, book, page, and optional Arabic exercise
- User can update task status
- Unfinished tasks carry into the next day
- History is preserved
- Calendar navigation works
- Current-day tasks can be edited and deleted
- Previous-day tasks can be edited but not deleted
- No day can be deleted
- App works well on a phone
- App has a simple handover and documentation path for future growth

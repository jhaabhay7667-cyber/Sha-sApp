
# Sha'sapp — Development Tasks and Project Roadmap

**Project:** Sha'sapp  
**Document:** TASK.md  
**Project Type:** Full-Stack Messaging Application  
**Development Status:** In Progress  
**Frontend:** HTML, CSS, JavaScript  
**Backend:** Python FastAPI  
**Database:** PostgreSQL  
**Storage:** Supabase Storage  
**Hosting:** Netlify + Render  
**Android:** Capacitor

---

# 1. Purpose of This File

This document is the central development task tracker for Sha'sapp.

It defines:
- Existing functionality that needs verification.
- Bugs that must be investigated.
- Features that need implementation.
- Security improvements.
- UI/UX improvements.
- Testing requirements.
- Deployment requirements.
- Future product enhancements.

Every developer and AI coding assistant must consult this file before starting new development work.

## Important instructions

1. Inspect the existing code before starting a task.
2. Never rebuild a feature that already works.
3. Fix root causes instead of adding temporary workarounds.
4. Update this file when tasks are completed.
5. Test every important change.
6. Never mark a task complete without verification.
7. Preserve existing user data and working functionality.
8. Ask for approval before destructive production database changes.

---

# 2. Task Status System

Use these status labels:

| Status | Meaning |
|---|---|
| NOT STARTED | Work has not started |
| IN PROGRESS | Currently being developed |
| NEEDS TESTING | Implementation exists but requires verification |
| BLOCKED | Waiting for a dependency or decision |
| COMPLETED | Implemented and successfully verified |
| DEFERRED | Intentionally postponed |

### Task priority

| Priority | Meaning |
|---|---|
| P0 | Critical bug, security, or application blocker |
| P1 | Essential functionality |
| P2 | Important improvement |
| P3 | Future enhancement |

**Important:** A feature appearing in the source code does not automatically mean it is fully functional in production.

---

# 3. Existing Project Functionality

The following functionality is already represented in the uploaded repository.

Do not automatically rebuild these features. Inspect them and verify their complete workflows first.

| Feature | Repository implementation | Verification |
|---|---|---|
| User registration | Present | Needs end-to-end testing |
| User login | Present | Needs end-to-end testing |
| JWT authentication | Present | Needs security testing |
| People search | Present | Needs end-to-end testing |
| Contact requests | Present | Needs end-to-end testing |
| Accept/reject requests | Present | Needs end-to-end testing |
| Accepted contacts | Present | Needs end-to-end testing |
| Direct conversations | Present | Needs end-to-end testing |
| Conversation list | Present | Needs end-to-end testing |
| Message history | Present | Needs end-to-end testing |
| Text messages | Present | Needs end-to-end testing |
| WebSocket connection | Present | Needs reliability testing |
| Typing indicators | Present | Needs two-user testing |
| Presence events | Present | Needs reliability testing |
| Message delivery receipts | Present | Needs verification |
| Message read receipts | Present | Needs verification |
| Media upload backend | Present | Needs end-to-end testing |
| Voice message frontend flow | Present | Needs end-to-end testing |
| Phone contact matching API | Present | Needs end-to-end testing |
| Capacitor Android setup | Present | Needs device testing |

Do not interpret this table as a production-readiness certificate.

---

# 4. Phase 1 — Critical Stability and Bug Fixes

**Priority: P0**

Goal: Make sure the existing application starts, connects to the database, authenticates users, and communicates correctly between frontend and backend.

## TASK-001: Verify backend startup

- [ ] Inspect backend dependencies.
- [ ] Verify Python environment.
- [ ] Verify FastAPI application imports.
- [ ] Verify Uvicorn starts successfully.
- [ ] Verify port 8000 availability.
- [ ] Verify root health endpoint.
- [ ] Verify database health endpoint.
- [ ] Check startup errors and logs.

Acceptance criteria:

- Backend starts without import errors.
- API root returns a successful response.
- Database connectivity is confirmed separately.

## TASK-002: Fix frontend-to-backend connectivity

- [ ] Verify frontend API base URL.
- [ ] Verify backend URL.
- [ ] Verify local development origins.
- [ ] Verify production frontend origin.
- [ ] Inspect browser network errors.
- [ ] Test preflight OPTIONS requests.
- [ ] Test authenticated API requests.

Investigate the previously reported CORS issue involving Live Server ports 5501 and 5502 if it still exists.

Acceptance criteria:

- Frontend successfully communicates with the local backend.
- Production frontend can communicate with Render.
- CORS does not reject legitimate configured origins.

## TASK-003: Verify PostgreSQL schema

- [ ] Connect to the intended Render/Supabase PostgreSQL database.
- [ ] Inspect existing tables.
- [ ] Compare SQLAlchemy models with the live schema.
- [ ] Check missing columns.
- [ ] Check foreign keys.
- [ ] Check indexes.
- [ ] Check unique constraints.
- [ ] Verify contact and messaging relationships.

Previously reported issue:

`column users.phone_number does not exist`

Recheck this issue against the current database before deciding whether a migration is required.

Acceptance criteria:

- Application models and production database schema are compatible.
- Existing account records remain intact.
- Required columns and constraints are verified.

## TASK-004: Verify authentication

- [ ] Test registration.
- [ ] Test login.
- [ ] Test incorrect password.
- [ ] Test invalid email.
- [ ] Test duplicate account registration.
- [ ] Test token expiration.
- [ ] Test protected endpoints.
- [ ] Test logout.
- [ ] Test unauthorized requests.

Acceptance criteria:

- Valid users can register and log in.
- Invalid credentials are rejected.
- Protected resources cannot be accessed without valid authentication.

## TASK-005: Fix application errors

- [ ] Inspect frontend console errors.
- [ ] Inspect backend exceptions.
- [ ] Fix broken API requests.
- [ ] Fix incorrect response handling.
- [ ] Fix duplicate event listeners.
- [ ] Fix loading-state problems.
- [ ] Fix failed network request handling.

---

# 5. Phase 2 — Contact Registration and Phone Contacts

**Priority: P1**

Goal: Allow users to connect through phone contacts and find registered Sha'sapp users.

This is an important part of the product.

## TASK-006: Phone number registration

- [ ] Verify phone number field in registration UI.
- [ ] Verify phone number validation.
- [ ] Verify country code handling.
- [ ] Verify backend registration schema.
- [ ] Verify SQLAlchemy user model.
- [ ] Verify production PostgreSQL migration.
- [ ] Verify phone number uniqueness.
- [ ] Verify existing accounts without phone numbers remain usable.

Acceptance criteria:

- New accounts can register with a valid phone number.
- Duplicate phone numbers are rejected.
- Existing accounts are not damaged by the schema update.

## TASK-007: Phone contact permission

- [ ] Verify Capacitor Contacts plugin.
- [ ] Request permission only when the user chooses to connect contacts.
- [ ] Explain why contact permission is needed.
- [ ] Handle permission denied.
- [ ] Handle permission permanently denied.
- [ ] Handle empty address books.
- [ ] Handle unavailable native contact functionality.
- [ ] Provide a useful web fallback.

Acceptance criteria:

- Contact access is permission-based.
- The application does not silently upload the entire address book.

## TASK-008: Select contacts manually

- [ ] Display available device contacts.
- [ ] Display contact names.
- [ ] Display phone numbers.
- [ ] Add contact selection checkboxes.
- [ ] Add select/deselect functionality.
- [ ] Allow users to select individual contacts.
- [ ] Allow users to cancel.
- [ ] Show selected contact count.
- [ ] Avoid duplicate selections.

Acceptance criteria:

- Users control exactly which contacts they want to match.
- Unselected contacts are not sent to the backend.

## TASK-009: Match phone contacts with Sha'sapp accounts

- [ ] Verify `/contacts/match-phone`.
- [ ] Verify phone number normalization.
- [ ] Handle country codes.
- [ ] Handle duplicate phone numbers.
- [ ] Handle numbers with spaces and punctuation.
- [ ] Handle unmatched contacts.
- [ ] Display matching registered users.
- [ ] Display relationship status.
- [ ] Prevent users from matching themselves.

Acceptance criteria:

- Selected phone contacts can be matched against registered Sha'sapp accounts.
- Matching results are accurate.
- Private phone contact data is not exposed to unrelated users.

## TASK-010: Add selected contacts

- [ ] Allow users to select matching Sha'sapp users.
- [ ] Add contact request action.
- [ ] Show pending request state.
- [ ] Show already-connected state.
- [ ] Prevent duplicate requests.
- [ ] Refresh contact information after success.

Acceptance criteria:

- Users can initiate contact requests from matched phone contacts.
- Backend relationship rules remain enforced.

---

# 6. Phase 3 — Contact Management

**Priority: P1**

## TASK-011: Find People

- [ ] Verify user search by full name.
- [ ] Verify user search by email.
- [ ] Add appropriate loading state.
- [ ] Add empty search state.
- [ ] Add no-results state.
- [ ] Add network error handling.
- [ ] Prevent searching the current user.

## TASK-012: Incoming contact requests

- [ ] Display incoming requests.
- [ ] Display sender information.
- [ ] Add accept button.
- [ ] Add decline button.
- [ ] Show request status.
- [ ] Refresh requests after an action.
- [ ] Prevent processing the same request twice.

## TASK-013: Outgoing contact requests

- [ ] Display outgoing requests.
- [ ] Display recipient information.
- [ ] Display pending state.
- [ ] Handle rejected or processed requests.
- [ ] Add cancellation functionality only if the backend supports it.

## TASK-014: Contact list

- [ ] Retrieve accepted contacts.
- [ ] Display profile information.
- [ ] Add contact search.
- [ ] Open direct conversation.
- [ ] Handle empty contact list.
- [ ] Handle removed or inactive accounts.

Acceptance criteria:

Users can discover registered users, manage contact requests, and access their accepted contacts reliably.

---

# 7. Phase 4 — Core Messaging

**Priority: P1**

Goal: Make direct conversations reliable for real users.

## TASK-015: Direct conversation creation

- [ ] Verify direct conversation creation.
- [ ] Prevent self-chat.
- [ ] Verify accepted contact requirement.
- [ ] Prevent duplicate direct conversations.
- [ ] Verify conversation membership.
- [ ] Refresh conversation list after creation.

## TASK-016: Conversation list

- [ ] Display all authorized conversations.
- [ ] Display participant information.
- [ ] Display last message preview.
- [ ] Display message timestamps.
- [ ] Display unread counts using real data.
- [ ] Verify conversation ordering.
- [ ] Add empty state.
- [ ] Handle unavailable conversations.

## TASK-017: Message history

- [ ] Load messages for the selected conversation.
- [ ] Verify message ownership.
- [ ] Display incoming messages.
- [ ] Display outgoing messages.
- [ ] Display timestamps.
- [ ] Preserve message ordering.
- [ ] Handle empty history.
- [ ] Handle pagination for larger conversations.

## TASK-018: Text messaging

- [ ] Send text messages.
- [ ] Receive text messages.
- [ ] Prevent empty messages.
- [ ] Prevent duplicate submissions.
- [ ] Display sending state.
- [ ] Display failed message state.
- [ ] Preserve unsent text after failure where practical.
- [ ] Verify message persistence.
- [ ] Test communication between two accounts.

Acceptance criteria:

Two registered and connected users can exchange text messages and retrieve their messages after refreshing or logging in again.

---

# 8. Phase 5 — Real-Time Messaging

**Priority: P1**

## TASK-019: WebSocket reliability

- [ ] Verify WebSocket authentication.
- [ ] Verify conversation membership.
- [ ] Verify connection lifecycle.
- [ ] Verify disconnect handling.
- [ ] Verify reconnection.
- [ ] Handle expired tokens.
- [ ] Handle network interruption.
- [ ] Prevent duplicate connections.
- [ ] Prevent duplicate message rendering.
- [ ] Clean up old connections when changing conversations.

## TASK-020: Real-time message delivery

- [ ] Send a message over the supported real-time flow.
- [ ] Receive messages without manual refresh.
- [ ] Verify database persistence.
- [ ] Verify events are limited to conversation members.
- [ ] Handle duplicate events.
- [ ] Handle delayed events.
- [ ] Reconcile real-time messages with message history.

## TASK-021: Typing indicators

- [ ] Display when another user is typing.
- [ ] Hide indicator when typing stops.
- [ ] Handle disconnected users.
- [ ] Prevent stale typing indicators.
- [ ] Clear typing state when changing conversations.

## TASK-022: Online and offline presence

- [ ] Verify presence events.
- [ ] Handle multiple connections for one user.
- [ ] Handle disconnects correctly.
- [ ] Avoid showing users as online when all connections are closed.
- [ ] Verify presence across multiple devices.

Do not claim permanent or background presence without a reliable implementation.

## TASK-023: Message delivery receipts

- [ ] Verify sent status.
- [ ] Verify delivered status.
- [ ] Verify read status.
- [ ] Verify receipt persistence.
- [ ] Prevent duplicate receipts.
- [ ] Prevent status downgrade.
- [ ] Synchronize receipt updates across connected clients.

Acceptance criteria:

Message status accurately reflects persisted server-side information.

---

# 9. Phase 6 — Media and Voice Messaging

**Priority: P1**

Goal: Support reliable sharing of photos, videos, files, and voice messages.

## TASK-024: Image messaging

- [ ] Verify image selection.
- [ ] Validate image MIME types.
- [ ] Validate file size.
- [ ] Preview selected image.
- [ ] Upload image to Supabase Storage.
- [ ] Save message metadata.
- [ ] Retrieve image securely.
- [ ] Display image in conversation.
- [ ] Handle upload failure.

## TASK-025: Video messaging

- [ ] Verify video selection.
- [ ] Validate video MIME types.
- [ ] Enforce upload size limits.
- [ ] Display video preview.
- [ ] Upload video securely.
- [ ] Store message metadata.
- [ ] Display video player.
- [ ] Handle unsupported formats.
- [ ] Handle upload failure.

## TASK-026: Voice messages

- [ ] Verify microphone permission.
- [ ] Verify browser recording support.
- [ ] Verify Android recording support.
- [ ] Start recording.
- [ ] Stop recording.
- [ ] Cancel recording.
- [ ] Preview recorded audio.
- [ ] Upload audio.
- [ ] Display audio message.
- [ ] Play and pause audio.
- [ ] Handle microphone permission denial.
- [ ] Handle recording/upload failure.

## TASK-027: Media security

- [ ] Verify private storage bucket.
- [ ] Verify upload authorization.
- [ ] Verify conversation membership.
- [ ] Validate file extensions and MIME types.
- [ ] Validate file size on the backend.
- [ ] Prevent unauthorized media retrieval.
- [ ] Avoid exposing Supabase service-role credentials.
- [ ] Clean up orphaned uploads when safe.

Acceptance criteria:

Authorized conversation members can exchange and view supported media without exposing private storage credentials or files to unauthorized users.

---

# 10. Phase 7 — User Interface and Experience

**Priority: P2**

Follow DESIGN.md for all visual changes.

## TASK-028: Authentication UI

- [ ] Improve registration experience.
- [ ] Improve login experience.
- [ ] Add clear validation feedback.
- [ ] Improve loading states.
- [ ] Verify responsive behavior.
- [ ] Verify dark and light themes.

## TASK-029: Messaging workspace

- [ ] Improve conversation list usability.
- [ ] Improve selected conversation state.
- [ ] Improve empty state.
- [ ] Improve message spacing.
- [ ] Improve message composer.
- [ ] Improve profile section.
- [ ] Improve mobile navigation.

## TASK-030: Profile management

- [ ] Display logged-in user information.
- [ ] Add profile editing if supported by backend.
- [ ] Add profile image support.
- [ ] Validate profile updates.
- [ ] Handle missing profile information.

## TASK-031: Notifications and feedback

- [ ] Add consistent success notifications.
- [ ] Add consistent error notifications.
- [ ] Add loading indicators.
- [ ] Add upload progress.
- [ ] Add confirmation dialogs for destructive actions.
- [ ] Ensure notifications do not cover important controls.

## TASK-032: Theme system

- [ ] Verify dark theme.
- [ ] Verify light theme.
- [ ] Verify theme persistence.
- [ ] Verify all components use design tokens.
- [ ] Verify dialogs and menus in both themes.

---

# 11. Phase 8 — Android Application

**Priority: P2**

Goal: Make Sha'sapp usable as an Android application.

## TASK-033: Capacitor configuration

- [ ] Verify Capacitor configuration.
- [ ] Verify Android application ID.
- [ ] Verify application name.
- [ ] Verify web asset synchronization.
- [ ] Verify Android project build.
- [ ] Verify app launch.

## TASK-034: Android permissions

- [ ] Contacts permission.
- [ ] Microphone permission.
- [ ] Camera permission if required.
- [ ] Media/file selection permission.
- [ ] Verify permission denial handling.
- [ ] Avoid unnecessary permissions.

## TASK-035: Android UI

- [ ] Verify status bar appearance.
- [ ] Verify safe areas.
- [ ] Verify keyboard resizing.
- [ ] Verify mobile navigation.
- [ ] Verify back button behavior.
- [ ] Verify scrolling.
- [ ] Verify image and video previews.
- [ ] Verify voice recording.

## TASK-036: Android testing

- [ ] Build debug APK.
- [ ] Install on a real Android device.
- [ ] Test registration and login.
- [ ] Test contact selection.
- [ ] Test messaging.
- [ ] Test media sharing.
- [ ] Test network interruption.
- [ ] Test logout.
- [ ] Test reopening the application.

Do not mark Android support complete based only on a successful build.

---

# 12. Phase 9 — Security and Privacy

**Priority: P0 / P1**

Security tasks must be addressed before production release.

## TASK-037: Authentication security

- [ ] Verify password hashing.
- [ ] Verify JWT signing.
- [ ] Verify token expiration.
- [ ] Verify protected API endpoints.
- [ ] Verify authorization on WebSockets.
- [ ] Avoid exposing tokens in logs.
- [ ] Review token storage and session behavior.

## TASK-038: API security

- [ ] Verify authorization for every protected route.
- [ ] Verify conversation membership.
- [ ] Verify message ownership.
- [ ] Verify contact relationship rules.
- [ ] Validate all incoming payloads.
- [ ] Add reasonable rate limits.
- [ ] Handle abusive requests.
- [ ] Avoid leaking internal exceptions.

## TASK-039: Database security

- [ ] Protect database credentials.
- [ ] Review production database permissions.
- [ ] Verify safe migrations.
- [ ] Verify foreign keys.
- [ ] Verify data ownership.
- [ ] Back up important data before destructive operations.

## TASK-040: Privacy

- [ ] Request contacts permission only when necessary.
- [ ] Process only user-selected contacts.
- [ ] Protect phone numbers.
- [ ] Protect uploaded media.
- [ ] Avoid unnecessary personal data collection.
- [ ] Provide clear logout behavior.
- [ ] Review account deletion requirements and data-retention behavior.

---

# 13. Phase 10 — Testing and Quality Assurance

**Priority: P1**

## TASK-041: Backend tests

- [ ] Authentication tests.
- [ ] Contact tests.
- [ ] Conversation tests.
- [ ] Message tests.
- [ ] Receipt tests.
- [ ] Media tests.
- [ ] WebSocket tests.
- [ ] Authorization tests.
- [ ] Database migration tests.

## TASK-042: Frontend tests

- [ ] Registration UI.
- [ ] Login UI.
- [ ] Contact search.
- [ ] Contact request actions.
- [ ] Conversation navigation.
- [ ] Message sending.
- [ ] Real-time message rendering.
- [ ] Media uploads.
- [ ] Theme switching.
- [ ] Responsive behavior.

## TASK-043: Two-user integration testing

Use two separate registered accounts.

- [ ] Account A logs in.
- [ ] Account B logs in.
- [ ] Account A discovers Account B.
- [ ] Account A sends a contact request.
- [ ] Account B receives the request.
- [ ] Account B accepts the request.
- [ ] Account A opens a direct conversation.
- [ ] Account B opens the same conversation.
- [ ] Both exchange messages.
- [ ] Verify delivery and read receipts.
- [ ] Verify media sharing.
- [ ] Verify reconnect behavior.

## TASK-044: Production verification

- [ ] Verify Netlify deployment.
- [ ] Verify Render API.
- [ ] Verify production database connection.
- [ ] Verify CORS.
- [ ] Verify authentication.
- [ ] Verify contact operations.
- [ ] Verify messaging.
- [ ] Verify storage.
- [ ] Review production logs.
- [ ] Verify no secrets are exposed.

---

# 14. Phase 11 — Future Features

**Priority: P3**

These features are future development goals. They must not be treated as completed simply because related database models or UI placeholders exist.

## TASK-045: Message editing

- [ ] Add edit-message API.
- [ ] Verify sender ownership.
- [ ] Add edited indicator.
- [ ] Synchronize edited content across clients.

## TASK-046: Message deletion

- [ ] Define delete-for-me behavior.
- [ ] Define delete-for-everyone behavior.
- [ ] Add authorization checks.
- [ ] Synchronize deletion events.
- [ ] Preserve required audit/data-retention rules.

## TASK-047: Message forwarding

- [ ] Add forwarding workflow.
- [ ] Select destination conversation.
- [ ] Verify destination membership.
- [ ] Preserve appropriate original-message metadata.

## TASK-048: Message search

- [ ] Search messages by text.
- [ ] Restrict results to authorized conversations.
- [ ] Display matching messages.
- [ ] Navigate to matching message.

## TASK-049: Group conversations

- [ ] Create group conversations.
- [ ] Add group participants.
- [ ] Remove participants.
- [ ] Add group name and image.
- [ ] Define group permissions.
- [ ] Display group members.
- [ ] Test group messaging.
- [ ] Test group WebSocket delivery.

## TASK-050: Push notifications

- [ ] Select a push notification provider.
- [ ] Register device tokens securely.
- [ ] Send notifications for new messages.
- [ ] Send notifications for contact requests.
- [ ] Handle notification permissions.
- [ ] Handle logout and token removal.
- [ ] Test background notifications.
- [ ] Test notification navigation.

## TASK-051: Voice and video calling

- [ ] Define call architecture.
- [ ] Select WebRTC implementation.
- [ ] Configure signaling.
- [ ] Configure STUN/TURN infrastructure.
- [ ] Implement outgoing calls.
- [ ] Implement incoming calls.
- [ ] Implement accept/reject.
- [ ] Implement call termination.
- [ ] Implement microphone controls.
- [ ] Implement camera controls.
- [ ] Handle network interruption.
- [ ] Test on real devices.

The existing `call_sessions` database model is not proof that calling is implemented.

---

# 15. Phase 12 — Deployment and Release

**Priority: P1**

## TASK-052: Netlify

- [ ] Verify production frontend.
- [ ] Verify build configuration.
- [ ] Verify API base URL.
- [ ] Verify environment configuration.
- [ ] Verify static assets.
- [ ] Verify mobile layout.
- [ ] Verify production authentication.

## TASK-053: Render

- [ ] Verify backend deployment.
- [ ] Verify Python dependencies.
- [ ] Verify environment variables.
- [ ] Verify database connection.
- [ ] Verify CORS.
- [ ] Verify logs.
- [ ] Verify health endpoint.
- [ ] Verify API routes.

## TASK-054: Database release

- [ ] Review pending migrations.
- [ ] Back up production database.
- [ ] Test migrations on a non-production database.
- [ ] Apply approved production migrations.
- [ ] Verify resulting schema.
- [ ] Verify existing records.
- [ ] Verify backend compatibility.

## TASK-055: Release checklist

- [ ] Authentication verified.
- [ ] Contacts verified.
- [ ] Conversations verified.
- [ ] Text messages verified.
- [ ] WebSocket verified.
- [ ] Message receipts verified.
- [ ] Media workflows verified.
- [ ] Security checks completed.
- [ ] Android build verified if included in release.
- [ ] Production deployment verified.

---

# 16. Development Order

Follow this recommended development order.

| Order | Phase | Priority |
|---|---|---|
| 1 | Stability and bug fixes | P0 |
| 2 | Authentication and database verification | P0 |
| 3 | Phone registration and contact matching | P1 |
| 4 | Contact management | P1 |
| 5 | Core messaging | P1 |
| 6 | Real-time communication | P1 |
| 7 | Media and voice messages | P1 |
| 8 | Security and privacy | P0/P1 |
| 9 | UI/UX improvements | P2 |
| 10 | Android application | P2 |
| 11 | Testing and quality assurance | P1 |
| 12 | Future messaging features | P3 |
| 13 | Production release | P1 |

Critical security and data-integrity tasks must never be postponed merely to complete visual improvements.

---

# 17. Definition of Done

A task can only be marked COMPLETED when all relevant requirements are satisfied:

1. Code changes are implemented.
2. Existing functionality is preserved.
3. Frontend and backend integration works where applicable.
4. Database changes are verified where applicable.
5. Authorization and validation are tested.
6. Error handling is implemented.
7. Relevant tests pass.
8. Mobile and desktop behavior is checked where applicable.
9. No known critical regression remains.
10. Documentation is updated.

If production testing has not been performed, do not claim production readiness.

---

# 18. Rules for AI Coding Assistants

Every AI assistant working on Sha'sapp must:

1. Read `RULES.md`.
2. Read `DESIGN.md`.
3. Read `TASK.md`.
4. Inspect the relevant source files.
5. Identify the existing implementation.
6. Select the appropriate task.
7. Explain the planned changes.
8. Implement only the required changes.
9. Test the changes.
10. Update task status accurately.

## When completing a task

Update its checkbox/status and add a short completion note where useful.

For example:

Before:

`- [ ] TASK-018: Text messaging`

After successful verification:

`- [x] TASK-018: Text messaging — verified with two registered accounts.`

Do not mark a task complete merely because code was generated.

## When encountering a blocker

- Record the blocker.
- Explain its root cause.
- Identify the affected files.
- Avoid unrelated code changes.
- Ask for approval when a risky decision is required.

---

# 19. Current Development Focus

The recommended immediate focus is:

**First: Stabilize the existing application.**

1. Confirm local backend startup.
2. Resolve any remaining CORS issue.
3. Verify the production PostgreSQL schema.
4. Resolve the phone-number migration if still pending.
5. Verify registration and login.
6. Test phone contact matching.
7. Test contact requests between two accounts.
8. Verify direct messaging.
9. Verify WebSocket communication.
10. Verify media and voice-message workflows.

Do not start implementing advanced features until the existing core messaging workflow is reliable.

---

# 20. Final Project Goal

The long-term goal is to develop Sha'sapp into a complete, reliable, modern messaging platform.

The application should provide:

- Secure user registration and login.
- Phone contact discovery.
- Contact requests and management.
- Reliable one-to-one conversations.
- Real-time messaging.
- Message delivery and read receipts.
- Image sharing.
- Video sharing.
- Voice messages.
- Typing indicators.
- Online presence.
- Group conversations.
- Push notifications.
- Voice and video calling.
- Responsive web experience.
- Native Android experience.

All features must be implemented with proper backend validation, database integrity, security, and user privacy.

**Final principle: Build incrementally, verify everything, protect existing data, and never sacrifice reliability for speed.**

---

**End of TASK.md**

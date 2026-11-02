
# Sha'sapp — Project Rules for AI Assistants and Developers

> **Purpose:** This file is the working agreement for anyone reading, debugging, modifying, testing, or extending Sha'sapp. Read it before making changes. The existing implementation is the source of truth; do not assume that every planned feature is already complete.

## 1. Project identity and product direction

- Product name: **Sha'sapp**.
- Sha'sapp is a full-stack messaging application.
- Core user journey: register or log in → discover another registered user → send/accept a contact request → open a direct conversation → exchange messages.
- The project also contains foundations for media messages, message receipts, real-time communication, and Android packaging.
- Keep the existing product identity, working flows, visual design, and deployment configuration unless the task explicitly asks to change them.
- Do not replace the application with a new template or rewrite the stack just to solve a localized problem.

## 2. Read the project before editing

Before changing code:

1. Inspect the relevant frontend, backend, database model, schema, router, and configuration files.
2. Trace the complete request flow from the UI to the API and database (and back) rather than patching only the visible symptom.
3. Check the existing API paths, request/response schemas, authentication dependencies, and database constraints.
4. Search for all usages of a function, field, route, CSS class, DOM ID, or configuration key before renaming or removing it.
5. Check whether the same feature exists in a backup or older file, but do not treat backup files as the active implementation.
6. Keep changes focused and explain which files were changed and why.

Do not invent files, routes, columns, environment variables, or functionality. If something cannot be verified from the repository, say so.

## 3. Existing technology and architecture

### Frontend
- HTML5, CSS3, and vanilla JavaScript.
- Main UI: `frontend/index.html`.
- Main styles: `frontend/css/style.css`.
- Main application logic: `frontend/js/app.js`.
- Capacitor contacts bridge: `frontend/contacts-bridge.js`.
- Capacitor configuration: `frontend/capacitor.config.json`.
- Android project: `frontend/android/`.
- Capacitor app ID: `com.shasapp.app`; app name: `Sha'sapp`; web build directory: `www`.

### Backend
- Python and FastAPI.
- SQLAlchemy ORM and Pydantic schemas.
- JWT bearer-token authentication.
- Password hashing through `pwdlib` (recommended Argon2 configuration).
- PostgreSQL through the configured SQLAlchemy database URL.
- Supabase Storage for chat media; the configured bucket is `chat-media`.
- Backend application entry point: `backend/app/main.py`.
- Routers: `auth.py`, `contacts.py`, `messages.py`, `media.py`, and `realtime.py` under `backend/app/routers/`.

### Hosting and external services
- Frontend deployment: Netlify.
- Backend deployment: Render.
- Production database: Supabase PostgreSQL.
- Media storage: Supabase Storage.
- Source control: GitHub.
- Android packaging: Capacitor.

Keep the frontend and backend responsibilities separate. The browser/mobile client must call the backend for protected application and database operations.

## 4. Important project paths

```text
PulseChat/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── security.py
│   │   ├── storage.py
│   │   └── routers/
│   │       ├── auth.py
│   │       ├── contacts.py
│   │       ├── messages.py
│   │       ├── media.py
│   │       └── realtime.py
│   ├── migrations/
│   ├── requirements.txt
│   └── test_realtime.py
├── frontend/
│   ├── index.html
│   ├── css/style.css
│   ├── js/app.js
│   ├── contacts-bridge.js
│   ├── capacitor.config.json
│   └── android/
├── docs/
│   ├── ARCHITECTURE.md
│   ├── PRD.md
│   └── RULES.md
└── .gitignore
```

The repository may contain generated Android files, dependencies, backups, and uploaded test media. Do not edit generated or backup copies when the active source file is clear.

## 5. Coding rules

### General
- Make the smallest safe change that solves the requested problem.
- Preserve existing naming conventions, structure, and working behavior.
- Do not introduce a new framework, database, hosting provider, or major dependency without a clear need and explicit approval.
- Avoid duplicate functions, duplicate event listeners, duplicate API calls, and conflicting CSS rules.
- Do not leave debug code, temporary test credentials, placeholder success messages, or dead code in production paths.
- Add comments for non-obvious logic, not for every line.
- Keep code readable and maintainable; handle empty, invalid, loading, and failure states.

### Frontend
- Keep UI markup in `frontend/index.html`, styles in `frontend/css/style.css`, and application behavior in `frontend/js/app.js`, unless the current structure clearly requires otherwise.
- Use the existing DOM IDs, CSS classes, and API helper patterns. Check every reference before changing an identifier.
- Do not add inline secrets or privileged credentials to HTML, CSS, JavaScript, Android resources, or public build output.
- Do not trust client-side checks for authorization, identity, contact membership, or message ownership. The backend must enforce them.
- Validate user input and show useful errors. Do not silently swallow failed requests.
- Avoid unsafe HTML insertion. Prefer `textContent` for user-provided text; sanitize any content that must be rendered as HTML.
- Prevent duplicate form submissions and clean up event listeners, timers, and WebSocket connections when appropriate.
- Keep responsive behavior usable on desktop and mobile.
- Do not request or upload a user's entire address book without clear permission and an understandable explanation. Only sync the contacts the user has explicitly chosen, and send only the fields required for matching.

### Backend
- Keep route handlers, schemas, ORM models, authentication, database access, and storage responsibilities in their existing layers.
- Use Pydantic schemas to validate incoming data and shape API responses.
- Use SQLAlchemy sessions through the existing database dependency; close sessions reliably.
- Use parameterized ORM/query operations. Never build SQL by concatenating user input.
- Return appropriate HTTP status codes and clear, non-sensitive error messages.
- Do not expose stack traces, password hashes, JWT secrets, service-role keys, database URLs, or internal storage credentials in API responses or logs.
- Avoid blocking work in async handlers. Preserve FastAPI's sync/async conventions.
- Keep CORS origins explicit and environment-configured. Do not use wildcard origins with credentials.
- Add authorization checks to every protected route, including WebSocket and media operations.

## 6. Authentication and account security

- Registration and login are handled by the authentication router.
- Protected API requests must use the bearer token returned by the backend.
- Passwords must be hashed using the existing password-hashing helper; never store or log plaintext passwords.
- Never weaken password validation or token verification to make a test pass.
- `backend/app/security.py` requires a `SECRET_KEY` of at least 64 characters and uses HS256. Preserve strong key requirements.
- Tokens have a configured expiry (`ACCESS_TOKEN_EXPIRE_MINUTES`, default 30 minutes in the current code). Handle expired/invalid tokens cleanly.
- Do not accept a user ID from the client as proof of identity. Derive the authenticated user from the validated token.
- Prevent users from accessing another user's profile, contacts, conversations, messages, or media unless the feature explicitly authorizes it.
- Do not log authorization headers or complete tokens.

## 7. Database and migration safety

- PostgreSQL is the persistent relational database. ORM definitions are in `backend/app/models.py`; request/response schemas are in `backend/app/schemas.py`.
- Before adding, renaming, or removing a model field, inspect all dependent schemas, routers, queries, migrations, and frontend consumers.
- A Python model change does **not** automatically update an existing production database.
- Do not rely on `Base.metadata.create_all()` to migrate existing tables. It can create missing tables but does not safely alter existing table structures.
- Use an explicit, reviewed SQL migration for production schema changes. Make migrations idempotent where practical (`IF NOT EXISTS`, guarded constraints), and use transactions where supported.
- Back up important production data before destructive schema changes.
- Never drop tables, truncate production data, remove columns, or rewrite existing records without explicit user approval and a verified recovery plan.
- Do not run a production migration against a local database by accident. Confirm the target database before executing SQL.
- After a migration, verify the column, constraint, index, and application query against the intended database.
- Keep SQL migration files under `backend/migrations/` and document execution order and rollback considerations.
- Treat `backend/migrations/phase1_messaging_features.sql` as an existing migration artifact; inspect its contents and the live schema before deciding whether it has already been applied.

## 8. Contacts and conversation rules

- User discovery is for registered Sha'sapp users; current documented search supports name/email.
- A contact request is not the same as an accepted contact.
- Preserve pending, accepted, rejected, incoming, and outgoing relationship states.
- A direct conversation must not be created for the current user chatting with themselves.
- The backend must verify that the authenticated user and target user are allowed to start the conversation (the current documented workflow requires an accepted contact relationship).
- Reuse an existing direct conversation instead of creating duplicate direct conversations for the same pair.
- Verify conversation membership on every conversation/message read, send, status, and media operation.
- Never trust a conversation ID supplied by the browser without checking membership on the server.

## 9. Messages, media, and real-time behavior

- The current message model supports message types `text`, `image`, `video`, `audio`, and `file`; preserve the database constraints and schema consistency.
- Message statuses in the current model are `sent`, `delivered`, and `read`.
- A media-only message may have empty/null text content; do not force a text body where the media workflow does not require one.
- Validate file type, size, ownership, and conversation membership on the backend before accepting or serving media.
- Use the existing Supabase Storage integration and `chat-media` bucket unless a deliberate, approved storage migration is planned.
- Keep Supabase service-role credentials exclusively on the backend. Do not make the bucket public merely to bypass an authorization or display problem.
- Do not trust a client-provided storage path or media URL. Ensure the requesting user is authorized to access the associated message and object.
- WebSocket events must be scoped to authenticated conversation members. Do not broadcast private messages or typing/presence information to unrelated users.
- Handle disconnects, reconnects, duplicate events, and stale connections safely.
- Do not claim that a message is delivered/read merely because the sender's UI displayed it. Persist and verify the relevant receipt.
- Test the full upload → database record → authorized retrieval → frontend display flow for media changes.
- Voice/video calling, push notifications, background delivery, and complete group-chat behavior must be treated as unverified unless the specific end-to-end workflow has been tested.

## 10. Environment variables and secrets

- Local secrets belong in `backend/.env`; production secrets belong in the hosting provider's private environment configuration.
- The root `.gitignore` excludes `.env` files, virtual environments, generated builds, and uploaded media. Preserve these protections.
- Never commit real `.env` files, database URLs, JWT secrets, Supabase service-role keys, access tokens, private keys, or user uploads.
- Keep a sanitized `.env.example` with variable names and safe placeholder values if setup documentation needs one. Never copy real values into it.
- Relevant configuration currently used by the code includes:
  - `DATABASE_URL`
  - `SECRET_KEY`
  - `ACCESS_TOKEN_EXPIRE_MINUTES`
  - `FRONTEND_ORIGINS`
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
- Do not invent fallback secrets or silently disable required configuration checks.
- The uploaded project archive contained a `backend/.env` file. Treat its contents as sensitive. If it contained real credentials and the archive was shared or exposed, rotate the affected credentials (especially the database password, JWT secret, and Supabase service-role key) and remove the file from future shared archives. Never reproduce those values in documentation or chat.

## 11. API and deployment rules

- Keep API route paths and payload shapes compatible with the existing frontend unless the task includes coordinated frontend/backend changes.
- When changing an endpoint, update its schemas, frontend caller, error handling, and documentation together.
- Use HTTPS for deployed API traffic.
- Keep local CORS origins and deployed frontend origins in `FRONTEND_ORIGINS`; update both Render environment configuration and local `.env` when needed.
- Do not assume the local frontend is always served on port 5500. Check the actual Live Server port and configure CORS to match it.
- Do not hardcode a developer's local filesystem path, localhost URL, or personal machine configuration into production code.
- Do not report a deployment as successful until the deployed service has been checked.
- Health checks should distinguish API availability from database connectivity.
- Do not claim that a feature works in production based only on a local test.

## 12. Local development and commands

Run commands from the appropriate project directory. On Windows PowerShell, a typical backend setup is:

```powershell
cd .\backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

If the virtual environment already exists, activate it rather than recreating it. Do not delete the environment or reinstall all packages unless there is a reason.

Serve the frontend using VS Code Live Server or another local static server. Confirm the actual URL/port shown by the server and include that origin in `FRONTEND_ORIGINS`.

Useful checks:

```powershell
# From backend/
python -c "import app.main; print('Backend imports successfully')"
```

```powershell
# Check whether port 8000 is already occupied
netstat -ano | findstr :8000
```

```powershell
# From the project root, inspect working-tree changes
git status --short
```

Do not kill an unknown process solely because it owns port 8000. Identify the process first. Do not run multiple backend servers on the same port.

## 13. Testing expectations

For every change, choose tests that cover the affected layer and at least one realistic user workflow.

- Authentication: valid registration/login, invalid credentials, expired token, protected-route rejection.
- Contacts: search, send request, incoming/outgoing lists, accept/reject, accepted contact list.
- Conversations: authorized creation/open, existing conversation reuse, self-chat rejection, non-member rejection.
- Messages: history, send, invalid payload, non-member rejection, status/receipt persistence.
- Media: allowed and disallowed MIME types, size limits, upload failure, authorized download, non-member rejection.
- WebSockets: authenticated connection, membership enforcement, event delivery, disconnect, reconnect, and unauthorized access.
- Frontend: loading state, empty state, success state, API error state, mobile layout, and no duplicate handlers.
- Database: migration against a disposable/test database first; verify constraints and indexes.
- Deployment: verify the actual Netlify frontend and Render API after deployment.

Run existing tests where practical. `backend/test_realtime.py` is an integration-style WebSocket test script; inspect its configuration and test data requirements before running it. Do not run destructive tests against production.

If a test cannot be run, state that clearly. Never fabricate test results.

## 14. Feature status: distinguish implemented from planned

The PRD and architecture notes describe the current core flow as registration/login, user search, contact requests, accepted contacts, direct conversations, message history, and message-send API.

The following require explicit end-to-end verification before being called complete:
- reliable real-time message delivery and reconnection;
- full media upload, retrieval, and display;
- delivery/read receipts across real users and devices;
- typing and online/last-seen indicators;
- background push notifications;
- voice/video calls;
- complete group-chat workflows;
- production-ready Android behavior.

A model, schema, route, UI control, or configuration entry alone does not prove a feature works end to end. Label unfinished work honestly as planned, partial, or unverified.

## 15. Git and project hygiene

- Make changes on the intended branch and inspect `git status` before committing.
- Do not overwrite unrelated user changes.
- Do not commit `.env`, `.venv`, `node_modules`, generated Android build output, uploaded media, logs, database dumps, or private test data.
- Avoid committing backup files as active source.
- Keep documentation aligned with actual behavior.
- Use clear commit messages that describe the change.
- Do not force-push, reset, or rewrite Git history unless explicitly requested.

## 16. Required response format when working on this project

When an AI assistant makes a change to Sha'sapp, it should report:

1. **What was inspected** — relevant files and flow.
2. **What changed** — exact files and behavior.
3. **Why it changed** — root cause or requirement.
4. **How to test** — exact commands and steps, preferably PowerShell-ready for this project.
5. **What remains unverified** — deployment, migration, device, or integration checks not actually performed.

When giving code to the project owner:
- Provide complete copy-paste-ready code when a file replacement is requested.
- State the exact filename and folder path.
- Give commands from the correct working directory.
- Do not assume the user can download generated code; include the code directly when asked.
- Explain production database changes carefully and never ask the user to expose passwords or secret keys.

## 17. Final rule

**Preserve working Sha'sapp functionality, protect user data and credentials, verify authorization on the server, and test before claiming success. When uncertain, inspect first and ask before making a risky or irreversible change.**

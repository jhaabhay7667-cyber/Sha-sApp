Sha'sapp --- Product Requirements Document (PRD)
Project: Sha'sapp
Product: Full-Stack Messaging Application
Status: Development in Progress
- Live website: https://sha-sapp.netlify.app/
- Backend API: https://sha-sapp.onrender.com
- GitHub repository:
  https://github.com/jhaabhay7667-cyber/Sha-sApp
1. Product Overview
Sha'sapp is a full-stack messaging application designed to help
registered users discover one another, establish contact connections,
and communicate through direct conversations.

The application combines a web frontend, a Python FastAPI backend, a
PostgreSQL database, and cloud media storage. The frontend is deployed
on Netlify, the backend is hosted on Render, and Supabase provides
production database infrastructure and media storage. Capacitor is
configured for Android packaging.
2. Problem Statement
Users need a straightforward way to find other registered users,
establish a connection, and start a conversation within one application.

Sha'sapp addresses this workflow through authentication, people search,
contact requests, contact management, direct conversation creation, and
message-related functionality.
3. Product Goals
1. Provide user registration and login.
2. Allow users to search for registered users by name or email.
3. Support sending and receiving contact requests.
4. Allow users to accept or reject incoming requests.
5. Maintain accepted contact relationships.
6. Allow connected users to create or open direct conversations.
7. Display the user's conversation list.
8. Retrieve message history for a selected conversation.
9. Provide an API for sending messages.
10. Store application records in PostgreSQL.
11. Use cloud storage for chat media.
12. Support web deployment and an Android packaging path.
4. Target Users
The current product is intended for people with registered Sha'sapp
accounts who want to find and communicate with other registered users.

The available project information does not define specific age groups,
geographic segments, or business customer categories.
5. Product Scope
5.1 In Scope
- User registration and authentication.
- Authenticated application access.
- Search by full name or email.
- Display relationship status.
- Send contact requests.
- Retrieve incoming and outgoing requests.
- Accept or reject requests.
- Retrieve accepted contacts.
- Create or retrieve direct conversations.
- Retrieve the conversation list.
- Retrieve message history.
- Send messages through the backend API.
- Initiate a WebSocket connection for a selected conversation.
- Store application data in PostgreSQL.
- Store chat media in Supabase Storage.
- Deploy frontend and backend separately.
- Maintain Android packaging configuration through Capacitor.
5.2 Not Yet Confirmed as Complete
The following are future possibilities or require further implementation
and testing before being described as completed features:
- Push notifications when the app is closed.
- Guaranteed background notifications.
- Voice and video calling.
- Fully verified group-chat workflows.
- Typing indicators.
- Online and last-seen status.
- Message editing, forwarding, and deletion.
- Message search.
- Fully verified end-to-end media sharing.
- Guaranteed real-time delivery and reconnection under all network
  conditions.
6. Functional Requirements
FR-01: User Authentication
The system shall provide registration and login for users.
- The frontend shall communicate with the backend authentication API.
- The frontend shall retain the authentication token for the active
  browser session.
- Protected API requests shall include the user's bearer token.
- The application shall distinguish authenticated and unauthenticated
  screens.
FR-02: Find People
The system shall allow authenticated users to search for registered
users by name or email.

Existing API:
GET /contacts/search?q={search_term}
Known result fields include user ID, full name, email, and relationship
status.
FR-03: Contact Requests
Users shall be able to send a contact request to another registered user
when no connection exists.

Existing API:
POST /contacts/{user_id}/request
The interface shall distinguish users who are not connected, users with
a pending request, and existing contacts.
FR-04: Incoming and Outgoing Requests
The system shall provide access to incoming and outgoing contact
requests.

Existing APIs:
GET /contacts/requests/incoming
GET /contacts/requests/outgoing
FR-05: Accept or Reject Requests
The receiving user shall be able to accept or reject an incoming
request.

Existing APIs:
POST /contacts/requests/{request_id}/accept
POST /contacts/requests/{request_id}/reject
On acceptance, the backend creates the contact relationship.
FR-06: Contact List
The system shall retrieve the authenticated user's contacts.

Existing API:
GET /contacts/
The frontend uses contact information to identify participants in direct
conversations.
FR-07: Direct Conversations
Connected users shall be able to open an existing direct conversation or
create one when it does not exist.

Existing API:
POST /messages/conversations/direct/{contact_user_id}
The backend checks that the target user is active, prevents self-chat,
verifies the accepted contact relationship, and returns an existing
matching conversation or creates one.

The frontend shall refresh the conversation list and open the selected
conversation.
FR-08: Conversation List
The system shall retrieve conversations belonging to the authenticated
user.

Existing API:
GET /messages/conversations
The known conversation response includes conversation ID, title,
group/direct indicator, creator ID, member IDs, and creation timestamp.
FR-09: Message History
The system shall retrieve messages for a selected conversation.

Existing API:
GET /messages/conversations/{conversation_id}/messages
FR-10: Sending Messages
The backend shall provide an endpoint for sending a message to a
conversation.

Existing API:
POST /messages/conversations/{conversation_id}/messages
End-to-end message delivery should be validated through testing.
FR-11: WebSocket Connection
The frontend contains functionality to initiate a WebSocket connection
when a conversation is selected. Real-time delivery, reconnection, and
failure handling must be verified through testing.
FR-12: Friend Request Polling
The current frontend periodically checks incoming requests while the
authenticated application is open.
- Current polling interval: 10 seconds.
- Incoming requests are retrieved through the existing
  incoming-requests API.
- A popup provides Accept and Decline actions.
Limitation: Polling does not guarantee notifications when the
application is closed or not running.
FR-13: Media Storage
The backend is configured to use Supabase Storage for chat media.
- Provider: Supabase Storage.
- Bucket: chat-media.
- Private credentials are configured through backend environment
  variables.
The complete upload, retrieval, and display workflow should be tested
before being treated as fully verified.
7. User Workflows
7.1 Registration and Login
1. The user opens the Sha'sapp website.
2. The user registers or enters login credentials.
3. The frontend sends the authentication request to the backend.
4. The backend processes the request and returns authentication
   information.
5. The frontend opens the authenticated application.
6. The application loads conversations and relevant contact data.
7.2 Find and Connect with a User
1. The user opens Find People.
2. The user searches by name or email.
3. The frontend requests matching users from the backend.
4. The application displays matching users and relationship status.
5. If no connection exists, the user can send a contact request.
6. The receiving user retrieves incoming requests.
7. The receiving user accepts or rejects the request.
8. After acceptance, the users become contacts.
7.3 Open a Direct Chat
1. The user selects an existing contact.
2. The user chooses Open Chat.
3. The frontend requests a direct conversation.
4. The backend returns an existing conversation or creates one.
5. The frontend reloads the conversation list.
6. The frontend selects the matching conversation.
7. The application retrieves message history.
8. The frontend initiates the conversation's WebSocket connection.
8. System Architecture
Sha'sapp uses a client-server architecture.

Frontend: HTML5, CSS3, JavaScript, API integration, and WebSocket
client functionality.

Backend: Python, FastAPI, SQLAlchemy, REST API endpoints,
authentication, and application business logic.

Data layer: PostgreSQL and Supabase production infrastructure.

Media storage: Supabase Storage.

Deployment: GitHub, Netlify, and Render.

Android packaging: Capacitor.
Request Flow
1. The user interacts with the frontend.
2. The frontend sends an HTTPS API request or opens a WebSocket
   connection.
3. The backend authenticates and processes the request.
4. The backend accesses the database or storage service when required.
5. The backend returns a response.
6. The frontend updates the interface.
9. Database Requirements
The production database was previously verified to contain these nine
tables:

  Table                    Responsibility
  users                  User account records
conversations          Conversation records
conversation_members   User membership in conversations
contact_requests       Contact request records
contacts               Accepted contact relationships
messages               Message records
message_reads          Message read records
message_deliveries     Message delivery records
call_sessions          Call-session records

A previous migration verification reported 29 records across these
tables. These historical counts are not current live database totals.
10. Non-Functional Requirements
Security
- Private credentials shall remain in backend environment variables.
- The Supabase service-role key shall not be exposed in frontend code.
- Protected API endpoints shall require authentication.
- Database operations shall be performed through the backend.
Reliability
- API failures should be handled without crashing the application.
- The frontend should provide useful feedback when an operation fails.
- Conversation selection and message loading should handle unavailable
  data.
- WebSocket failure and reconnection behavior should be tested.
Usability
- The interface should make user search, contact requests, and chat
  navigation understandable.
- Users should be able to distinguish pending requests from accepted
  contacts.
- Important actions should provide clear feedback.
Maintainability
- Frontend and backend responsibilities should remain separated.
- API endpoints should be used consistently.
- Changes should be committed through version control.
- Backup files and environment secrets should not be committed
  accidentally.
Compatibility
- The web application should be tested in supported desktop and mobile
  browsers.
- The Capacitor Android build should be tested separately on Android
  devices.
11. Deployment Requirements
  Component             Platform
  Frontend              Netlify
Backend               Render
Production database   Supabase PostgreSQL
Media storage         Supabase Storage
Source repository     GitHub
Android packaging     Capacitor
- Frontend: https://sha-sapp.netlify.app/
- Backend: https://sha-sapp.onrender.com
- Repository: https://github.com/jhaabhay7667-cyber/Sha-sApp
The frontend is configured to communicate with the deployed backend API.
12. Acceptance Criteria
  ID                                  Acceptance criterion
  AC-01                               A registered user can log in
successfully.

  AC-02                               An authenticated user can search by
name.

  AC-03                               An authenticated user can search by
email.

  AC-04                               Search results display the correct
relationship state.

  AC-05                               A user can send a contact request.

  AC-06                               The receiving user can retrieve
incoming requests.

  AC-07                               The receiving user can accept or
reject a request.

  AC-08                               Accepted users appear as contacts.

  AC-09                               An accepted contact can be selected
for Open Chat.

  AC-10                               The direct conversation API returns
or creates a conversation.

  AC-11                               The selected conversation appears
in the conversation list.

  AC-12                               The application can request message
history.

  AC-13                               The message-sending API accepts a
valid conversation message.
AC-14                               The frontend can initiate a
WebSocket connection for the
selected conversation.
Acceptance criteria should be marked complete only after the relevant
workflow has been tested in the deployed application.
13. Future Enhancements
1. Push notifications for messages and contact requests.
2. Online and last-seen indicators.
3. Typing indicators.
4. Message sent, delivered, and read indicators.
5. Image, video, audio, and document sharing.
6. Voice messages.
7. Group conversations.
8. Voice and video calls.
9. Message reply, edit, forward, and delete functionality.
10. Message search.
11. Improved profile management.
12. Improved Android application experience.
14. Risks and Dependencies
- The frontend depends on the availability of the Render backend.
- Messaging depends on correct authentication and conversation
  membership.
- Direct chat creation depends on an accepted contact relationship.
- Media operations depend on correct Supabase configuration and
  permissions.
- Polling-based request checks depend on the application remaining
  open and connected.
- WebSocket behavior depends on network availability and server-side
  support.
- Deployment changes must be tested after Netlify and Render updates.
15. Success Measures
The core product journey should work reliably:
1. Register or log in.
2. Find another registered user.
3. Send a contact request.
4. Receive and accept the request using the other account.
5. See the accepted contact.
6. Open a direct conversation.
7. Load conversation history.
8. Send and receive messages reliably.
16. Conclusion
Sha'sapp is a full-stack messaging application combining authentication,
user discovery, contact management, direct conversations, and
message-related APIs.

This PRD documents the known product scope, functional requirements,
architecture, database responsibilities, deployment setup, acceptance
criteria, and possible future enhancements. It is intended as a
reference for ongoing development, testing, maintenance, and future
feature planning.
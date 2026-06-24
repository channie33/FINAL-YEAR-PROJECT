

## Problem Statement

Students often struggle to access trusted and affordable mental health care. Better Space solves this by:
- centralizing discovery and booking
- enforcing professional verification before public listing
- enabling safe communication between students, professionals, and admin


## Tech Stack

- Backend: Python (http.server + custom router)
- Database: MySQL
- Frontend: HTML, CSS, Vanilla JavaScript
- Auth: JWT (PyJWT)
- Password hashing: bcrypt
- Email OTP: SMTP (Gmail) via smtplib
- HTTPS: Python ssl module with local certs


### Entry point

- Backend/app.py
- Uses ThreadingHTTPServer
- Wraps socket with TLS context and certificates in Backend/certs/


## Project Structure

- Backend/app.py: HTTPS server bootstrap
- Backend/config.py: DB and security config from environment variables
- Backend/routes/request_handler.py: central routing and static serving
- Backend/routes/auth.py: register/login/OTP/forgot-password/reset-password
- Backend/routes/admin.py: admin login, verification, reports, user management
- Backend/routes/messages.py: student-professional and admin messaging
- Backend/routes/student.py: student profile/messages/sessions/reviews
- Backend/routes/professionals.py: professional profile/messages/sessions/verification upload
- Backend/routes/sessions.py: slot lookup and booking
- Backend/utils/security.py: JWT, validation, rate limiting
- Backend/utils/email.py: OTP email sending
- Backend/utils/file_upload.py: file validation and sanitization
- Database/schema.sql: schema and constraints
- Frontend/assets/pages/: role-based page templates
- Frontend/assets/js/: role-based client scripts
- run.ps1: start helper script


## Database Design (Core Tables)

Main tables:
- Students
- MentalHealthProfessionals
- VerificationDocuments
- ProfessionalSchedule
- SessionAppointments
- FeedbackRatings
- Messages
- Admins
- AdminMessages

### Key relationship intent

- Professionals must be Verified before they are bookable/listed.
- SessionAppointments link student + professional + schedule slot.
- Messages holds student-professional chat; AdminMessages handles admin support chats.


## Security Model (Current)

### Authentication and authorization

- JWT issued after OTP verification.
- Role checks enforced in backend for protected endpoints.
- Ownership checks enforce that users can only access their own records.
- Admin-only page and API controls enforced server-side.

### Data protection

- Passwords hashed with bcrypt.
- All chat messages (student–professional and admin) are encrypted at rest with AES-GCM before database write and decrypted transparently on read. Existing plaintext rows are returned as-is for backward compatibility.
- Encryption key is configured via `MESSAGE_ENCRYPTION_KEY_B64` environment variable; falls back to a key derived from `SECRET_KEY` if not set.
- TLS enabled for all traffic.
- Security headers set globally (HSTS, CSP, X-Frame-Options, nosniff, Referrer-Policy).

### Abuse controls

- Rate limiting on login and password reset attempts.
- OTP expiration and attempt limits.
- Input and file upload validation.

### Important hardening outcomes

- No more client-side-only admin auth bypass.
- Admin APIs enforce JWT on every request; unauthenticated calls receive 401/403.
- No sender impersonation in messaging.
- Reduced risk of IDOR on student/professional data routes.
- Messages encrypted at rest; plaintext never stored for new rows.
- Participant names in conversation lists rendered as `textContent` (not innerHTML), preventing HTML injection.
- Unread-dot logic hardened with safe numeric parsers so corrupt or missing localStorage values cannot produce `NaN` and break indicator state.


## Performance Optimizations Delivered

1. Switched to ThreadingHTTPServer for concurrent requests.
2. Optimized TLS configuration and enabled practical session behavior.
3. Added cache-control for static assets.
4. Made OTP email sending asynchronous so login/register responses are not blocked by SMTP latency.
5. Added token verification caching in security utilities to reduce repetitive JWT decode overhead.


## API Overview (Selected)

### Auth
- POST /api/register
- POST /api/login
- POST /api/verify-otp
- POST /api/forgot-password
- POST /api/reset-password

### Admin
- POST /api/admin/login
- GET /api/admin/users
- GET /api/admin/verifications
- POST /api/admin/verify-professional
- GET /api/admin/reports/registrations
- GET /api/admin/reports/sessions
- GET /api/admin/reports/verification
- GET /api/admin/reports/feedback
- GET /api/admin/reports/messaging

### Messaging and sessions
- GET /api/messages
- POST /api/messages
- GET /api/sessions/slots
- POST /api/sessions

### Student/professional profile data
- GET /api/student/profile
- GET /api/student/messages
- GET /api/student/sessions
- POST /api/student/reviews
- GET /api/professional/profile
- GET /api/professional/messages
- GET /api/professional/sessions


## Authentication Flows

### Student/professional login flow

1. User submits email + password.
2. Backend validates credentials.
3. OTP generated and sent by email (async).
4. User submits OTP.
5. Backend verifies OTP and issues JWT.
6. Frontend stores JWT and attaches Authorization header for protected requests.

### Admin login flow

1. Admin submits username + password.
2. Backend validates against Admins table.
3. Legacy plaintext values are migrated to bcrypt hash on successful login.
4. JWT issued with admin role.
5. Admin pages and APIs require valid admin JWT.

## Better Space Backend Documentation

This project uses a lightweight Python backend built on top of `http.server` and MySQL.

Database name: `Better_Space`  
Schema file: `Database/schema.sql`  
Initialization script: `Database/init_db.py`

## Backend Architecture Overview

The backend is organized by responsibility:

- `Backend/app.py`: HTTP server bootstrap.
- `Backend/config.py`: MySQL connection factory.
- `Backend/routes/`: request routing and endpoint handlers.
- `Backend/utils/`: helper utilities (email OTP currently implemented).
- `Backend/models/`: currently placeholder files for future model/domain abstraction.
- `Backend/middleware/`: currently placeholder files for future auth/role middleware.

### Request Flow

1. `Backend/app.py` starts `HTTPServer` with `RequestHandler`.
2. `Backend/routes/request_handler.py` inspects URL path and HTTP method.
3. It dispatches to functions in `Backend/routes/*.py`.
4. Route functions read/write MySQL through `get_db_connection()` from `Backend/config.py`.
5. Responses are returned as JSON for API routes or static file content for frontend assets/pages.

## File-by-File Backend Explanation

### `Backend/app.py`

Purpose: starts the HTTP server.

- Defines `run_server(port=None)`.
- Port resolution order:
  - explicit `port` argument,
  - `PORT` environment variable,
  - fallback default `8080`.
- Instantiates `HTTPServer(('', port), RequestHandler)` and serves forever.

This is the backend entrypoint used by `run.ps1`.

### `Backend/config.py`

Purpose: central database connector.

- Loads environment variables with `dotenv`.
- `get_db_connection()` returns a MySQL connection using:
  - `DB_HOST` (default `localhost`)
  - `DB_USER` (default `root`)
  - `DB_PASSWORD` (default `ROOT`)
  - `DB_PORT` (default `3306`)
  - fixed database `Better_Space`
- Returns `None` and logs the exception if connection fails.

All route modules depend on this function.

### `Backend/routes/request_handler.py`

Purpose: central HTTP router and static-file server.

Key parts:

- `_set_headers(status, content_type)`: standardizes response headers and CORS headers.
- `do_OPTIONS()`: responds to preflight requests.
- `do_GET()`:
  - serves `/` as `Frontend/assets/pages/shared/index.html`
  - serves `/pages/...` and `/assets/...`
  - routes API endpoints to appropriate route handlers
- `do_POST()`:
  - supports multipart upload for professional verification docs
  - parses JSON body for all other endpoints
  - dispatches to endpoint-specific handlers
- `serve_file(file_path)`:
  - normalizes absolute path
  - enforces path stays within `Frontend` directory (prevents traversal)
  - sets correct mime type and writes file bytes

This module is effectively the API gateway of the app.

### `Backend/routes/api.py`

Purpose: health-check style API.

- `test_database(request_handler)`:
  - attempts DB connection
  - returns success JSON on connection success
  - returns HTTP 500 with error JSON when DB connection fails

Mapped at `GET /api/test-db`.

### `Backend/routes/auth.py`

Purpose: registration, login, OTP verification, and user lookup.

Key functions:

- `generate_otp()`: generates a 6-digit code.
- `otp_storage`: in-memory OTP map keyed as `"{user_type}_{user_id}"`.
- `handle_register(request_handler, data)`:
  - validates required fields
  - validates password policy:
    - minimum 8 chars
    - uppercase
    - lowercase
    - digit
    - special character
  - hashes password using `bcrypt`
  - inserts student or professional row
  - for professionals, default verification is `Pending`
  - generates and emails OTP via `send_otp_email`
- `handle_verify_otp(request_handler, data)`:
  - checks OTP against in-memory storage
  - removes OTP on success
- `handle_login(request_handler, data)`:
  - looks up email in `Students`, then `MentalHealthProfessionals`, then `Admins`
  - blocks professional login unless `VerificationStatus == 'Verified'`
  - validates password with `bcrypt.checkpw`
  - sends OTP for login flow
- `handle_resend_otp(request_handler, data)`:
  - fetches user email by type and re-issues OTP
- `handle_get_user(request_handler, user_id, user_type)`:
  - returns normalized user object for frontend after verification

Important behavior note:

- OTPs are stored in process memory (`otp_storage`), so server restart clears pending OTPs.

### `Backend/routes/student.py`

Purpose: student profile data, conversations, sessions, and feedback submission.

Key functions:

- `get_student_profile(request_handler, user_id)`:
  - fetches student basic profile
  - fetches verified professionals the student has interacted with via messages or sessions
  - fetches reviews created by that student
- `get_student_messages(request_handler, user_id)`:
  - returns professionals student has messaged and latest message timestamp
- `get_student_sessions(request_handler, user_id)`:
  - returns booked sessions with professional details
- `add_student_review(request_handler, data)`:
  - validates required fields and rating range (1-5)
  - verifies student has at least one session with target professional
  - inserts into `FeedbackRatings`

Business rule enforced: students can only review professionals they have had sessions with.

### `Backend/routes/professionals.py`

Purpose: professional-facing data, search/listing data, verification upload handling.

Key functions:

- `get_all_professionals(request_handler)`:
  - returns verified professionals for student search/listing
  - enriches each professional with:
    - `reviews` (anonymous review text + rating)
    - `review_count`
    - `average_rating`
  - reviewer identity is intentionally anonymized (`Anonymous Student`)
- `get_professional_profile(request_handler, user_id)`:
  - returns professional profile
  - returns assigned/interacting students
  - returns reviews and average rating for professional dashboard
  - review payload is anonymized
- `get_professional_messages(request_handler, user_id)`:
  - returns student conversation list with latest message timestamp
- `get_professional_sessions(request_handler, user_id)`:
  - returns session history with student and timeslot details
- `save_verification_documents(user_id, category, document_data, filename)`:
  - validates file size/type/path
  - writes document into `uploads/verification_documents`
  - creates/updates `VerificationDocuments` table and indexes if needed
  - updates professional category and status (`Pending`)
  - keeps latest document and cleans up older ones/files
- `get_professional_verification_status(request_handler, user_id)`:
  - returns current verification status and category
- `handle_submit_verification(request_handler, post_data, content_type)`:
  - parses multipart form data manually
  - extracts file + fields (`user_id`, `specialization`)
  - delegates persistence to `save_verification_documents`

### `Backend/routes/messages.py`

Purpose: student-professional chat and admin direct messaging.

Schema helpers:

- `_ensure_admin_schema(cursor)`: ensures `Admins` table exists.
- `_ensure_admin_messages_table(cursor)`: ensures `AdminMessages` table exists.
- `_get_or_create_admin_id(cursor, admin_username)`: finds admin or auto-creates one.

Chat/message functions:

- `get_student_admin_messages(request_handler, student_id, admin_username)`
- `get_professional_admin_messages(request_handler, professional_id, admin_username)`
- `get_admin_messages(request_handler, admin_username, limit=50)`
- `send_admin_message(request_handler, data)`
- `send_student_admin_message(request_handler, data)`
- `send_professional_admin_message(request_handler, data)`
- `get_conversation(request_handler, student_id, professional_id)`
- `send_message(request_handler, data)`

Core behavior:

- Supports three sender types in admin messages: `Student`, `Professional`, `Admin`.
- Conversation retrieval is ordered chronologically (`SentAt ASC`) for chat rendering.

### `Backend/routes/sessions.py`

Purpose: appointment slot listing and booking.

Key functions:

- `get_slots(request_handler, professional_id, date_str)`:
  - checks `ProfessionalSchedule` for date
  - maps fixed times (`09:00`, `13:00`, `16:00`) into `{time, booked}` objects
- `book_session(request_handler, data)`:
  - validates required fields
  - confirms professional exists and is verified
  - marks/creates schedule row as booked
  - inserts `SessionAppointments` record
  - uses transaction semantics (`commit`/`rollback`) via try/except

### `Backend/routes/admin.py`

Purpose: admin dashboard data, verification workflow, user listing.

Key functions:

- `get_pending_verifications(request_handler)`:
  - ensures `VerificationDocuments` table/columns exist
  - returns professionals in `Pending` status with latest document metadata
- `get_verification_document(request_handler, professional_id)`:
  - fetches latest verification file path from DB
  - validates file path is inside uploads root
  - serves file with proper mime type and inline disposition
- `verify_professional(request_handler, data)`:
  - sets `VerificationStatus` to `Verified` or `Rejected`
- `get_all_users(request_handler)`:
  - returns combined student list + verified professional list

### `Backend/test_db.py`

Purpose: command-line quick DB sanity check.

- Calls `get_db_connection()`
- Executes `SELECT 1`
- Prints success/failure to terminal

Useful for confirming environment and DB credentials before running full server.

### `Backend/utils/email.py`

Purpose: SMTP utility for OTP delivery.

- `send_otp_email(email, otp_code)`:
  - builds HTML email
  - reads SMTP credentials/settings from env vars:
    - `EMAIL_USER`
    - `EMAIL_PASSWORD`
    - `SMTP_SERVER`
    - `SMTP_PORT`
  - sends with `smtplib` + STARTTLS
  - returns `True` on success, `False` on exception

### `Backend/utils/otp.py`

Current status: file exists but is empty (placeholder).

### `Backend/utils/validators.py`

Current status: file exists but is empty (placeholder).

### `Backend/utils/permissions.py`

Current status: file exists but is empty (placeholder).

### `Backend/models/user.py`

Current status: file exists but is empty (placeholder).

### `Backend/models/student.py`

Current status: file exists but is empty (placeholder).

### `Backend/models/professional.py`

Current status: file exists but is empty (placeholder).

### `Backend/models/sessions.py`

Current status: file exists but is empty (placeholder).

### `Backend/models/messages.py`

Current status: file exists but is empty (placeholder).

### `Backend/middleware/auth_middleware.py`

Current status: file exists but is empty (placeholder).

### `Backend/middleware/role_middleware.py`

Current status: file exists but is empty (placeholder).

### Package Marker Files

- `Backend/routes/__init__.py`: empty
- `Backend/models/__init__.py`: empty
- `Backend/utils/__init__.py`: empty
- `Backend/middleware/__init__.py`: empty

These files mark directories as Python packages and can later be used for exports/shared initialization.

## API Endpoint Map (Current Router)

Defined in `Backend/routes/request_handler.py`.

GET endpoints:

- `/api/test-db`
- `/api/student/profile`
- `/api/student/messages`
- `/api/student/admin-messages`
- `/api/student/sessions`
- `/api/professional/profile`
- `/api/professional/messages`
- `/api/professional/admin-messages`
- `/api/professional/sessions`
- `/api/professionals`
- `/api/messages` (conversation read)
- `/api/admin/users`
- `/api/admin/verifications`
- `/api/admin/messages`
- `/api/admin/verification-document`
- `/api/sessions/slots`
- `/api/user`

POST endpoints:

- `/api/register`
- `/api/login`
- `/api/verify-otp`
- `/api/student/admin-messages`
- `/api/student/reviews`
- `/api/professional/admin-messages`
- `/api/admin/messages`
- `/api/messages` (send)
- `/api/admin/verify-professional`
- `/api/sessions`
- `/api/professional/submit-verification` (multipart upload)

## Notes and Known Characteristics

- The backend does not currently use a framework like Flask/FastAPI; routing and parsing are manual.
- OTP persistence is in-memory, not database-backed.
- Several tables are created/altered lazily inside route handlers if missing.
- The `models`, `middleware`, and some `utils` modules are present but not implemented yet.

## Running the Backend

- Use `run.ps1` from workspace root, or run `Backend/app.py` directly.
- Ensure MySQL is running and the `Better_Space` schema is initialized.
- Ensure `.env` has DB and email settings for OTP flow.






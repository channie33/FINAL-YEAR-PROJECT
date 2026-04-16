# Better Space — Final Year Project

**Better Space** is a web-based mental health support platform that connects university students with verified mental health professionals. Students can search for professionals, book sessions, exchange messages, and leave feedback. Professionals submit credentials for admin review before being listed. Admins manage verifications, users, and view platform analytics.

---

## Panel Presentation — Q&A Preparation

### Q1: What problem does this project solve?

**Answer:** University students often struggle to access affordable and trusted mental health support. Better Space addresses this by creating a dedicated platform that connects students directly to qualified mental health professionals. It adds a verification layer — professionals must submit credentials and be approved by an admin — to ensure students are never exposed to unqualified practitioners.

---

### Q2: What technology stack did you use and why?

**Answer:** The backend is built with **Python's built-in `http.server`** module — no external web framework like Flask or Django was used. This was a deliberate design choice to demonstrate understanding of how HTTP servers work at a lower level, including request parsing, routing, and response serialization. The database is **MySQL**, chosen for its reliability with relational data and support for foreign key constraints. The frontend is plain **HTML, CSS, and vanilla JavaScript** to keep the project self-contained and avoid build toolchain complexity.

**Key file:** `Backend/app.py` — lines 1–21
```python
from http.server import HTTPServer
from routes.request_handler import RequestHandler

def run_server(port=None):
    port = int(os.getenv('PORT')) if os.getenv('PORT') else 8080
    httpd = HTTPServer(('', port), RequestHandler)
    httpd.serve_forever()
```
This manually bootstraps the HTTP server, binding a custom `RequestHandler` class that handles all routing logic.

---

### Q3: How does user registration and authentication work?

**Answer:** Registration is handled in `Backend/routes/auth.py`. When a user submits the registration form:
1. Password complexity is validated server-side (minimum 8 characters, uppercase, lowercase, number, special character).
2. The password is hashed using **bcrypt** before storage — plain-text passwords are never saved to the database.
3. A 6-digit OTP is generated and emailed to the user via Gmail SMTP.
4. The user must verify the OTP before the account is activated.

**OTP generation** (`Backend/routes/auth.py`, line 11):
```python
def generate_otp():
    return ''.join(random.choices(string.digits, k=6))
```
OTPs are stored temporarily in a server-side dictionary (`otp_storage`) keyed by email, not in the database, so they are never persisted to disk.

**Password hashing** (`Backend/routes/auth.py`, line 64):
```python
password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
```
`bcrypt.gensalt()` automatically generates a random salt, making each hash unique even for identical passwords.

---

### Q4: How does the routing system work without a framework?

**Answer:** All HTTP requests go through a single class — `RequestHandler` in `Backend/routes/request_handler.py`. It extends Python's `BaseHTTPRequestHandler` and overrides `do_GET`, `do_POST`, and `do_OPTIONS`. Inside each method, the URL path is parsed using `urlparse`, and a chain of `if/elif` conditions dispatches the request to the correct handler function.

**Key file:** `Backend/routes/request_handler.py` — lines 27–60
```python
class RequestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        if path == '/':
            self.serve_file(index_path)
        elif path.startswith('/pages/'):
            self.serve_file(...)  # serves HTML pages
        elif path.startswith('/assets/'):
            self.serve_file(...)  # serves CSS/JS/images
        elif path == '/api/student/profile':
            get_student_profile(self, student_id)
        # ... and so on
```
This manually implements what a framework's router does automatically — it was built this way to demonstrate the fundamentals.

---

### Q5: How does the professional verification workflow work?

**Answer:** This is a three-step admin workflow:
1. A professional registers and is given `VerificationStatus = 'Pending'` in the `MentalHealthProfessionals` table.
2. They upload their credentials (PDF/PNG/JPG, max 5 MB) via the verification page. The file is saved to the `uploads/verification_documents/` directory.
3. The admin dashboard (`Frontend/assets/pages/admin/verification.html`) calls `GET /api/admin/verifications` which runs a SQL JOIN to fetch pending professionals alongside their latest uploaded document.
4. The admin clicks Approve or Reject, which calls `POST /api/admin/verify` and updates `VerificationStatus` to `'Verified'` or `'Rejected'`.

**Key file:** `Backend/routes/professionals.py` — file upload security:
```python
MAX_VERIFICATION_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
ALLOWED_VERIFICATION_EXTENSIONS = {'.pdf', '.png', '.jpg', '.jpeg'}
```
File type and size are validated before saving. A SHA-256 hash of the file is also stored to detect duplicates.

**Key SQL query** (`Backend/routes/admin.py` — `get_pending_verifications`):
```sql
SELECT p.ProfessionalID, p.FullName, p.Email, p.Category,
       vd.FilePath, vd.OriginalFileName
FROM MentalHealthProfessionals p
LEFT JOIN (
    SELECT vd1.ProfessionalID, vd1.FilePath, vd1.OriginalFileName, vd1.UploadedAt
    FROM VerificationDocuments vd1
    JOIN (SELECT ProfessionalID, MAX(UploadedAt) as LatestUpload
          FROM VerificationDocuments GROUP BY ProfessionalID) latest
    ON vd1.ProfessionalID = latest.ProfessionalID
    AND vd1.UploadedAt = latest.LatestUpload
) vd ON p.ProfessionalID = vd.ProfessionalID
WHERE p.VerificationStatus = 'Pending'
```
The subquery ensures only the most recently uploaded document is shown per professional.

---

### Q6: How does session booking work?

**Answer:** Professionals set their available dates and time slots (09:00, 13:00, 16:00) via their dashboard. These are stored in the `ProfessionalSchedule` table with a `Status` of `'Available'`. When a student books:
1. The frontend calls `GET /api/sessions/slots` to load a professional's availability for a chosen date.
2. The student selects a slot and submits — `POST /api/sessions/book` is called.
3. The backend verifies the professional is `Verified`, checks the slot is still `'Available'`, inserts a row into `SessionAppointments`, and updates the slot to `'Booked'` — all in a single database transaction.

**Key file:** `Backend/routes/sessions.py` — `book_session` function (lines 45–end):
```python
if professional['VerificationStatus'] != 'Verified':
    # 403 Forbidden — cannot book unverified professional
```
This is a critical business rule enforced server-side, not just in the UI.

---

### Q7: How is the messaging system implemented?

**Answer:** The platform has two message contexts:
- **Student ↔ Professional** direct messaging (stored in the `Messages` table).
- **Student/Professional ↔ Admin** support messaging (stored in the `AdminMessages` table).

Both routes live in `Backend/routes/messages.py`. Messages are fetched via GET endpoints and sent via POST. The frontend polls for new messages using `setInterval` in the JS files (`Frontend/assets/js/student/student-messaging.js`, `professional-messaging.js`).

**Database schema** (`Database/schema.sql`):
```sql
CREATE TABLE Messages (
    -- stores direct messages between students and professionals
);
CREATE TABLE AdminMessages (
    -- stores support messages with the admin
);
```

---

### Q8: What security measures did you implement?

**Answer:**
| Threat | Mitigation |
|---|---|
| Password storage | bcrypt hashing with random salt (`Backend/routes/auth.py` line 64) |
| Account takeover | OTP email verification required on registration (`Backend/routes/auth.py` — `handle_verify_otp`) |
| Malicious file uploads | Extension whitelist + 5 MB size cap (`Backend/routes/professionals.py` lines 9–10) |
| SQL injection | Parameterised queries used throughout — `cursor.execute(query, (param,))` never string formatting |
| Booking unverified professionals | Server-side `VerificationStatus` check before any booking is accepted (`Backend/routes/sessions.py`) |
| CORS | `Access-Control-Allow-Origin` header set in `_set_headers` (`Backend/routes/request_handler.py` line 34) |

---

### Q9: How is the database structured?

**Answer:** The schema (`Database/schema.sql`) defines 7 tables with normalised relationships:

```
Students  ──────┐
                ├──► SessionAppointments ◄── ProfessionalSchedule
MentalHealth    │
Professionals ──┘
    │
    └──► VerificationDocuments
    │
    └──► FeedbackRatings ◄── Students
    │
    └──► Messages ◄── Students
    │
    └──► AdminMessages
```

Foreign key constraints enforce referential integrity — e.g., you cannot book a session for a student or professional that does not exist.

---

### Q10: How do you start and run the project?

**Answer:** A PowerShell launch script `run.ps1` handles everything:
```powershell
.\run.ps1 -Port 8080
```
This starts the Python backend. The frontend is served by the same backend — navigating to `http://localhost:8080` loads the landing page (`Frontend/assets/pages/shared/index.html`). No separate frontend server is needed because `request_handler.py` serves all static files directly.

---

## Project Structure Quick Reference

| Path | Purpose |
|---|---|
| `Backend/app.py` | HTTP server entry point |
| `Backend/config.py` | MySQL connection factory using environment variables |
| `Backend/routes/request_handler.py` | Central router — all GET/POST routing logic |
| `Backend/routes/auth.py` | Registration, login, OTP verification |
| `Backend/routes/professionals.py` | Professional profile, verification upload, search listing |
| `Backend/routes/admin.py` | Admin: pending verifications, approve/reject, user management, reports |
| `Backend/routes/sessions.py` | Slot availability and session booking |
| `Backend/routes/messages.py` | All messaging endpoints |
| `Backend/utils/email.py` | Gmail SMTP OTP email sender |
| `Database/schema.sql` | Full database schema — all 7 tables |
| `Database/init_db.py` | Database initialisation script |
| `Frontend/assets/pages/` | All HTML pages (student/, professional/, admin/, shared/) |
| `Frontend/assets/js/` | All JavaScript (mirrors pages structure) |
| `Frontend/assets/css/` | All stylesheets (mirrors pages structure) |
| `uploads/verification_documents/` | Uploaded professional credential files |

---

## Original Backend Architecture Notes

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






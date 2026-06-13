# API Utility Reference

This document describes the shared frontend API utility used by student and professional pages.

Source file:
- Frontend/assets/js/utils/api.js

## Purpose

The utility centralizes:
- JWT token and user info storage
- fetch request wrappers (GET/POST/PUT/DELETE/FormData)
- automatic Authorization header injection
- standard error handling for network and HTTP failures

## Storage Keys

- auth_token: JWT for student/professional authentication
- user_info: JSON string with user_id and user_type

Note:
- Admin pages currently use a separate token flow in sessionStorage with key betterspace_admin_token.
- Admin scripts generally call fetch directly instead of this utility.

## Core Functions

### Token and user helpers

- setAuthToken(token)
- getAuthToken()
- setUserInfo(userInfo)
- getUserInfo()
- isAuthenticated()
- clearAuth()
- logout()

Current logout redirect target in utility:
- /shared/login.html

### Request helpers

- apiRequest(endpoint, options)
- apiGet(endpoint, options)
- apiPost(endpoint, body, options)
- apiPut(endpoint, body, options)
- apiDelete(endpoint, options)
- apiPostFormData(endpoint, formData, options)

Options supported by apiRequest:
- method: default GET
- body: object or FormData
- headers: custom headers object
- includeAuth: default true
- isFormData: default false

Behavior:
- Adds Content-Type: application/json by default
- Adds Authorization: Bearer <token> when includeAuth is true and token exists
- Removes Content-Type when isFormData is true
- On HTTP 401: clears auth and redirects to /shared/login.html
- On non-OK response: returns error object with status and message
- On network error: returns error object with network message

## Auth Flow Helpers in Utility

- login(email, password)
  - Calls POST /api/login with includeAuth false
  - Stores returned user object into user_info

- verifyOTP(userId, userType, otpCode)
  - Calls POST /api/verify-otp with includeAuth false
  - On success stores token into auth_token and user summary in user_info

- register(email, password, userType, firstName, lastName)
  - Calls POST /api/register with includeAuth false

## Common Backend Endpoints (Current)

The backend router is in Backend/routes/request_handler.py.

Public or pre-auth endpoints:
- POST /api/register
- POST /api/login
- POST /api/admin/login
- POST /api/verify-otp
- POST /api/forgot-password
- POST /api/reset-password
- GET /api/professionals
- GET /api/sessions/slots?professional=<id>&date=<YYYY-MM-DD>

Protected student/professional endpoints (Authorization required):
- GET /api/student/profile
- GET /api/student/messages
- GET /api/student/admin-messages
- GET /api/student/sessions
- POST /api/student/admin-messages
- POST /api/student/reviews
- GET /api/professional/profile
- GET /api/professional/messages
- GET /api/professional/admin-messages
- GET /api/professional/sessions
- POST /api/professional/admin-messages
- GET /api/messages
- POST /api/messages
- POST /api/sessions
- POST /api/professional/submit-verification (multipart/form-data)
- GET /api/user

Protected admin endpoints (Authorization required):
- GET /api/admin/users
- GET /api/admin/verifications
- GET /api/admin/messages
- POST /api/admin/messages
- POST /api/admin/verify-professional
- GET /api/admin/verification-document
- GET /api/admin/reports/registrations
- GET /api/admin/reports/sessions
- GET /api/admin/reports/verification
- GET /api/admin/reports/feedback
- GET /api/admin/reports/messaging

## Usage Examples

### Include utility

```html
<script src="/assets/js/utils/api.js"></script>
```

### Login and OTP

```javascript
const loginRes = await login(email, password);

if (loginRes.status === 'success') {
  const otpRes = await verifyOTP(loginRes.user.user_id, loginRes.user.user_type, otpCode);
}
```

### Authenticated GET

```javascript
const me = getUserInfo();
const res = await apiGet(`/api/student/profile?student_id=${me.user_id}`);
```

### Authenticated POST

```javascript
await apiPost('/api/messages', {
  student_id: 1,
  professional_id: 2,
  message: 'Hello'
});
```

### FormData upload

```javascript
const form = new FormData();
form.append('file', fileInput.files[0]);
form.append('user_id', getUserInfo().user_id);
form.append('specialization', 'Clinical Psychology');

const uploadRes = await apiPostFormData('/api/professional/submit-verification', form);
```

## Important Notes

1. This utility is intended for student/professional token flow.
2. Admin token handling is separate in admin scripts.
3. Do not trust local user_info for authorization decisions; backend JWT checks are the source of truth.
4. When endpoint does not require auth, pass includeAuth: false.
5. Keep endpoint paths synchronized with Backend/routes/request_handler.py after route changes.

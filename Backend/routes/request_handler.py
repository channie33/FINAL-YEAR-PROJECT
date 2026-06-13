from http.server import BaseHTTPRequestHandler #base class for handling http requests 
import json #for json parsing and responses
from urllib.parse import urlparse, parse_qs
import mimetypes #used for serving correct content types
import os #filepath handling
from .auth import handle_register, handle_login, handle_verify_otp, handle_get_user, handle_forgot_password, handle_reset_password
from .professionals import handle_submit_verification, get_professional_profile, get_professional_messages, get_professional_sessions, get_all_professionals
from .student import get_student_profile, get_student_messages, get_student_sessions, add_student_review
from .admin import (get_pending_verifications, verify_professional, get_all_users, get_verification_document,
    get_report_user_registrations, get_report_sessions, get_report_verification,
    get_report_feedback, get_report_messaging, admin_login)
from .messages import (
    get_student_admin_messages,
    send_student_admin_message,
    get_professional_admin_messages,
    send_professional_admin_message,
    get_admin_messages,
    send_admin_message,
    get_conversation,
    send_message
)
from .sessions import get_slots, book_session
from .api import test_database
from config import ALLOWED_ORIGIN
from utils.security import verify_jwt_token

# Frontend directory
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))#to get project root directory
FRONTEND_DIR = os.path.join(BASE_DIR, 'Frontend')#path to the frontend folder 

class RequestHandler(BaseHTTPRequestHandler):
    
    def _set_headers(self, status=200, content_type='text/html', extra_headers=None):
        self.send_response(status)
        self.send_header('Content-type', content_type)
        self.send_header('Access-Control-Allow-Origin', ALLOWED_ORIGIN)
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Access-Control-Allow-Credentials', 'true')
        self.send_header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-Frame-Options', 'SAMEORIGIN')
        self.send_header('X-XSS-Protection', '1; mode=block')
        self.send_header('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'")
        self.send_header('Referrer-Policy', 'strict-origin-when-cross-origin')
        if extra_headers:
            for header_name, header_value in extra_headers.items():
                self.send_header(header_name, header_value)
        self.end_headers()

    def _require_auth(self, allowed_user_types=None):
        auth_header = self.headers.get('Authorization', '')
        if not auth_header or not auth_header.startswith('Bearer '):
            self._set_headers(401, 'application/json')
            self.wfile.write(json.dumps({"status": "error", "message": "Missing or invalid Authorization header"}).encode())
            return None

        token = auth_header.split(' ', 1)[1]
        payload = verify_jwt_token(token)
        if 'error' in payload:
            self._set_headers(401, 'application/json')
            self.wfile.write(json.dumps({"status": "error", "message": payload['error']}).encode())
            return None

        if allowed_user_types and payload.get('user_type') not in allowed_user_types:
            self._set_headers(403, 'application/json')
            self.wfile.write(json.dumps({"status": "error", "message": "Insufficient permissions"}).encode())
            return None

        return payload
    
    def do_OPTIONS(self):
        self._set_headers(204)
    
    def do_GET(self):
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        query_params = parse_qs(parsed_path.query)
        
        # to load homepage
        if path == '/' or path == '':
            index_path = os.path.join(FRONTEND_DIR, 'assets', 'pages', 'shared', 'index.html')
            self.serve_file(index_path)
            
        #to serve html pages 
        elif path.startswith('/pages/'):
            # frontend pages are stored under assets/pages
            rel_path = path.lstrip('/')
            file_path = os.path.join(FRONTEND_DIR, 'assets', *rel_path.split('/'))
            self.serve_file(file_path)
            
        #to serve static assets like css, js, images  
        elif path.startswith('/assets/'):
            # Protect admin page routes from direct URL access.
            if path.startswith('/assets/pages/admin/') and path != '/assets/pages/admin/login.html':
                payload = self._require_auth(['admin'])
                if not payload:
                    return

            # remove leading slash and join to FRONTEND_DIR
            rel_path = path.lstrip('/')
            file_path = os.path.join(FRONTEND_DIR, *rel_path.split('/'))
            self.serve_file(file_path)
            
        #api endpoint to test database connection
        elif path == '/api/test-db':
            test_database(self)
            
        # Student API endpoints
        elif path == '/api/student/profile':
            # Accept both student_id and user_id for compatibility
            student_id = query_params.get('student_id', [None])[0] or query_params.get('user_id', [None])[0]
            if student_id:
                payload = self._require_auth(['student'])
                if not payload:
                    return
                if str(payload.get('user_id')) != str(student_id):
                    self._set_headers(403, 'application/json')
                    self.wfile.write(json.dumps({"status": "error", "message": "Forbidden"}).encode())
                    return
                get_student_profile(self, student_id)
            else:
                self._set_headers(400, 'application/json')
                self.wfile.write(json.dumps({"error": "Missing student_id parameter"}).encode())
                
        elif path == '/api/student/messages':
            student_id = query_params.get('student_id', [None])[0] or query_params.get('user_id', [None])[0]
            if student_id:
                payload = self._require_auth(['student'])
                if not payload:
                    return
                if str(payload.get('user_id')) != str(student_id):
                    self._set_headers(403, 'application/json')
                    self.wfile.write(json.dumps({"status": "error", "message": "Forbidden"}).encode())
                    return
                get_student_messages(self, student_id)
            else:
                self._set_headers(400, 'application/json')
                self.wfile.write(json.dumps({"error": "Missing student_id parameter"}).encode())

        elif path == '/api/student/admin-messages':
            student_id = query_params.get('student_id', [None])[0] or query_params.get('user_id', [None])[0]
            admin_username = query_params.get('admin_username', ['admin'])[0]
            if student_id:
                payload = self._require_auth(['student'])
                if not payload:
                    return
                if str(payload.get('user_id')) != str(student_id):
                    self._set_headers(403, 'application/json')
                    self.wfile.write(json.dumps({"status": "error", "message": "Forbidden"}).encode())
                    return
                get_student_admin_messages(self, student_id, admin_username)
            else:
                self._set_headers(400, 'application/json')
                self.wfile.write(json.dumps({"error": "Missing student_id parameter"}).encode())
                
        elif path == '/api/student/sessions':
            student_id = query_params.get('student_id', [None])[0] or query_params.get('user_id', [None])[0]
            if student_id:
                payload = self._require_auth(['student'])
                if not payload:
                    return
                if str(payload.get('user_id')) != str(student_id):
                    self._set_headers(403, 'application/json')
                    self.wfile.write(json.dumps({"status": "error", "message": "Forbidden"}).encode())
                    return
                get_student_sessions(self, student_id)
            else:
                self._set_headers(400, 'application/json')
                self.wfile.write(json.dumps({"error": "Missing student_id parameter"}).encode())
            
        # Professional API endpoints
        elif path == '/api/professional/profile':
            user_id = query_params.get('user_id', [None])[0]
            if user_id:
                payload = self._require_auth(['professional'])
                if not payload:
                    return
                if str(payload.get('user_id')) != str(user_id):
                    self._set_headers(403, 'application/json')
                    self.wfile.write(json.dumps({"status": "error", "message": "Forbidden"}).encode())
                    return
                get_professional_profile(self, user_id)
            else:
                self._set_headers(400, 'application/json')
                self.wfile.write(json.dumps({"error": "Missing user_id parameter"}).encode())
                
        elif path == '/api/professional/messages':
            user_id = query_params.get('user_id', [None])[0]
            if user_id:
                payload = self._require_auth(['professional'])
                if not payload:
                    return
                if str(payload.get('user_id')) != str(user_id):
                    self._set_headers(403, 'application/json')
                    self.wfile.write(json.dumps({"status": "error", "message": "Forbidden"}).encode())
                    return
                get_professional_messages(self, user_id)
            else:
                self._set_headers(400, 'application/json')
                self.wfile.write(json.dumps({"error": "Missing user_id parameter"}).encode())

        elif path == '/api/professional/admin-messages':
            user_id = query_params.get('user_id', [None])[0]
            admin_username = query_params.get('admin_username', ['admin'])[0]
            if user_id:
                payload = self._require_auth(['professional'])
                if not payload:
                    return
                if str(payload.get('user_id')) != str(user_id):
                    self._set_headers(403, 'application/json')
                    self.wfile.write(json.dumps({"status": "error", "message": "Forbidden"}).encode())
                    return
                get_professional_admin_messages(self, user_id, admin_username)
            else:
                self._set_headers(400, 'application/json')
                self.wfile.write(json.dumps({"error": "Missing user_id parameter"}).encode())
                
        elif path == '/api/professional/sessions':
            user_id = query_params.get('user_id', [None])[0]
            if user_id:
                payload = self._require_auth(['professional'])
                if not payload:
                    return
                if str(payload.get('user_id')) != str(user_id):
                    self._set_headers(403, 'application/json')
                    self.wfile.write(json.dumps({"status": "error", "message": "Forbidden"}).encode())
                    return
                get_professional_sessions(self, user_id)
            else:
                self._set_headers(400, 'application/json')
                self.wfile.write(json.dumps({"error": "Missing user_id parameter"}).encode())
        
        elif path == '/api/professionals':
            get_all_professionals(self)

        elif path == '/api/messages':
            student_id = query_params.get('student_id', [None])[0]
            professional_id = query_params.get('professional_id', [None])[0]
            if student_id and professional_id:
                payload = self._require_auth(['student', 'professional'])
                if not payload:
                    return
                if payload.get('user_type') == 'student' and str(payload.get('user_id')) != str(student_id):
                    self._set_headers(403, 'application/json')
                    self.wfile.write(json.dumps({"status": "error", "message": "Forbidden"}).encode())
                    return
                if payload.get('user_type') == 'professional' and str(payload.get('user_id')) != str(professional_id):
                    self._set_headers(403, 'application/json')
                    self.wfile.write(json.dumps({"status": "error", "message": "Forbidden"}).encode())
                    return
                get_conversation(self, student_id, professional_id)
            else:
                self._set_headers(400, 'application/json')
                self.wfile.write(json.dumps({"error": "Missing student_id or professional_id"}).encode())
            
        # Admin API endpoints
        elif path == '/api/admin/users':
            get_all_users(self)
            
        elif path == '/api/admin/verifications':
            get_pending_verifications(self)

        elif path == '/api/admin/messages':
            admin_username = query_params.get('admin_username', ['admin'])[0]
            limit_param = query_params.get('limit', ['50'])[0]
            try:
                limit_value = int(limit_param)
            except ValueError:
                limit_value = 50
            get_admin_messages(self, admin_username, limit_value)

        elif path == '/api/admin/verification-document':
            professional_id = query_params.get('professional_id', [None])[0]
            get_verification_document(self, professional_id)

        # Admin report endpoints
        elif path == '/api/admin/reports/registrations':
            get_report_user_registrations(self)

        elif path == '/api/admin/reports/sessions':
            get_report_sessions(self)

        elif path == '/api/admin/reports/verification':
            get_report_verification(self)

        elif path == '/api/admin/reports/feedback':
            get_report_feedback(self)

        elif path == '/api/admin/reports/messaging':
            get_report_messaging(self)

        elif path == '/api/sessions/slots':
            professional_id = query_params.get('professional', [None])[0]
            date_str = query_params.get('date', [None])[0]
            if professional_id and date_str:
                get_slots(self, professional_id, date_str)
            else:
                self._set_headers(400, 'application/json')
                self.wfile.write(json.dumps({"error": "Missing professional or date"}).encode())
            
        elif path == '/api/user':
            user_id = query_params.get('user_id', [None])[0]
            user_type = query_params.get('user_type', [None])[0]
            payload = self._require_auth(['student', 'professional', 'admin'])
            if not payload:
                return
            if payload.get('user_type') != 'admin':
                if str(payload.get('user_id')) != str(user_id) or payload.get('user_type') != user_type:
                    self._set_headers(403, 'application/json')
                    self.wfile.write(json.dumps({"status": "error", "message": "Forbidden"}).encode())
                    return
            handle_get_user(self, user_id, user_type)

        else:#unknown path
            self._set_headers(404)
            self.wfile.write(b'404 - Not Found')
    
    def do_POST(self):
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        # Read request body
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        
        # Check if this is a file upload (multipart/form-data)
        content_type = self.headers.get('Content-Type', '')
        print(f"POST {path}, Content-Type: {content_type}")
        
        #file upload handling
        if 'multipart/form-data' in content_type or 'multipart' in content_type:
            print(f"Detected multipart upload for {path}")
            if path == '/api/professional/submit-verification':
                handle_submit_verification(self, post_data, content_type)
            else:
                self._set_headers(404, 'application/json')
                response = json.dumps({"status": "error", "message": "Endpoint not found"})
                self.wfile.write(response.encode())
                
        #JSON request handling
        else:
            try:
                data = json.loads(post_data.decode('utf-8'))#convert request body from JSON to python dict
            except Exception as e:
                print(f"Failed to parse JSON: {str(e)}")
                self._set_headers(400, 'application/json')
                response = json.dumps({"status": "error", "message": "Invalid JSON"})
                self.wfile.write(response.encode())
                return
            
            # Route JSON requests
            if path == '/api/register':
                handle_register(self, data)
            elif path == '/api/login':
                handle_login(self, data)
            elif path == '/api/admin/login':
                admin_login(self, data)
            elif path == '/api/verify-otp':
                handle_verify_otp(self, data)
            elif path == '/api/forgot-password':
                handle_forgot_password(self, data)
            elif path == '/api/reset-password':
                handle_reset_password(self, data)
            elif path == '/api/student/admin-messages':
                payload = self._require_auth(['student'])
                if not payload:
                    return
                data['student_id'] = payload.get('user_id')
                send_student_admin_message(self, data)
            elif path == '/api/student/reviews':
                payload = self._require_auth(['student'])
                if not payload:
                    return
                data['student_id'] = payload.get('user_id')
                add_student_review(self, data)
            elif path == '/api/professional/admin-messages':
                payload = self._require_auth(['professional'])
                if not payload:
                    return
                data['professional_id'] = payload.get('user_id')
                send_professional_admin_message(self, data)
            elif path == '/api/admin/messages':
                send_admin_message(self, data)
            elif path == '/api/messages':
                payload = self._require_auth(['student', 'professional'])
                if not payload:
                    return
                if payload.get('user_type') == 'student':
                    data['student_id'] = payload.get('user_id')
                    data['sender'] = 'Student'
                elif payload.get('user_type') == 'professional':
                    data['professional_id'] = payload.get('user_id')
                    data['sender'] = 'Professional'
                send_message(self, data)
            elif path == '/api/admin/verify-professional':
                verify_professional(self, data)
            elif path == '/api/sessions':
                payload = self._require_auth(['student'])
                if not payload:
                    return
                data['student_id'] = payload.get('user_id')
                book_session(self, data)
            else:
                self._set_headers(404, 'application/json')
                response = json.dumps({"status": "error", "message": "Endpoint not found"})
                self.wfile.write(response.encode())
    
    def serve_file(self, file_path):
        try:
            # Normalize and secure the file path
            file_path = os.path.abspath(file_path)
            if not file_path.startswith(os.path.abspath(FRONTEND_DIR)):
                raise FileNotFoundError()
             #read file 
            with open(file_path, 'rb') as f:
                content = f.read()
            
            #detect content type
            content_type, _ = mimetypes.guess_type(file_path)
            if content_type is None:
                content_type = 'application/octet-stream'

            ext = os.path.splitext(file_path)[1].lower()
            if ext in ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico']:
                cache_control = 'public, max-age=3600'
            else:
                cache_control = 'no-store, no-cache, must-revalidate'

            self._set_headers(200, content_type, {
                'Cache-Control': cache_control,
                'Content-Length': str(len(content))
            })
            self.wfile.write(content)
        except FileNotFoundError:
            self._set_headers(404)
            self.wfile.write(b'404 - File Not Found')
        except Exception as e:
            self._set_headers(500)
            self.wfile.write(f'500 - Server Error: {str(e)}'.encode())
    
    def log_message(self, format, *args):
        print(f"{self.address_string()} - {format % args}")

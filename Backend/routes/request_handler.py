from http.server import BaseHTTPRequestHandler #base class for handling http requests 
import json #for json parsing and responses
from urllib.parse import urlparse, parse_qs
import mimetypes #used for serving correct content types
import os #filepath handling
from .auth import handle_register, handle_login, handle_verify_otp, handle_get_user
from .professionals import handle_submit_verification, get_professional_profile, get_professional_messages, get_professional_sessions, get_all_professionals
from .student import get_student_profile, get_student_messages, get_student_sessions
from .admin import get_pending_verifications, verify_professional, get_all_users
from .api import test_database

# Frontend directory
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))#to get project root directory
FRONTEND_DIR = os.path.join(BASE_DIR, 'Frontend')#path to the frontend folder 

class RequestHandler(BaseHTTPRequestHandler):
    
    def _set_headers(self, status=200, content_type='text/html'):
        self.send_response(status)
        self.send_header('Content-type', content_type)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
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
            # remove leading slash and join to FRONTEND_DIR
            rel_path = path.lstrip('/')
            file_path = os.path.join(FRONTEND_DIR, *rel_path.split('/'))
            self.serve_file(file_path)
            
        #api endpoint to test database connection
        elif path == '/api/test-db':
            test_database(self)
            
        # Student API endpoints
        elif path == '/api/student/profile':
            user_id = query_params.get('user_id', [None])[0]
            if user_id:
                get_student_profile(self, user_id)
            else:
                self._set_headers(400, 'application/json')
                self.wfile.write(json.dumps({"error": "Missing user_id parameter"}).encode())
                
        elif path == '/api/student/messages':
            user_id = query_params.get('user_id', [None])[0]
            if user_id:
                get_student_messages(self, user_id)
            else:
                self._set_headers(400, 'application/json')
                self.wfile.write(json.dumps({"error": "Missing user_id parameter"}).encode())
                
        elif path == '/api/student/sessions':
            user_id = query_params.get('user_id', [None])[0]
            if user_id:
                get_student_sessions(self, user_id)
            else:
                self._set_headers(400, 'application/json')
                self.wfile.write(json.dumps({"error": "Missing user_id parameter"}).encode())
            
        # Professional API endpoints
        elif path == '/api/professional/profile':
            user_id = query_params.get('user_id', [None])[0]
            if user_id:
                get_professional_profile(self, user_id)
            else:
                self._set_headers(400, 'application/json')
                self.wfile.write(json.dumps({"error": "Missing user_id parameter"}).encode())
                
        elif path == '/api/professional/messages':
            user_id = query_params.get('user_id', [None])[0]
            if user_id:
                get_professional_messages(self, user_id)
            else:
                self._set_headers(400, 'application/json')
                self.wfile.write(json.dumps({"error": "Missing user_id parameter"}).encode())
                
        elif path == '/api/professional/sessions':
            user_id = query_params.get('user_id', [None])[0]
            if user_id:
                get_professional_sessions(self, user_id)
            else:
                self._set_headers(400, 'application/json')
                self.wfile.write(json.dumps({"error": "Missing user_id parameter"}).encode())
        
        elif path == '/api/professionals':
            get_all_professionals(self)
            
        # Admin API endpoints
        elif path == '/api/admin/users':
            get_all_users(self)
            
        elif path == '/api/admin/verifications':
            get_pending_verifications(self)
            
        elif path == '/api/user':
            user_id = query_params.get('user_id', [None])[0]
            user_type = query_params.get('user_type', [None])[0]
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
            elif path == '/api/verify-otp':
                handle_verify_otp(self, data)
            elif path == '/api/admin/verify-professional':
                verify_professional(self, data)
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

            self._set_headers(200, content_type)
            self.wfile.write(content)
        except FileNotFoundError:
            self._set_headers(404)
            self.wfile.write(b'404 - File Not Found')
        except Exception as e:
            self._set_headers(500)
            self.wfile.write(f'500 - Server Error: {str(e)}'.encode())
    
    def log_message(self, format, *args):
        print(f"{self.address_string()} - {format % args}")

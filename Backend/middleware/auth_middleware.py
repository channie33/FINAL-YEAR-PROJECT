"""JWT Authentication Middleware"""
import json
from utils.security import verify_jwt_token

def require_auth(f):
    """Decorator to require JWT authentication for an endpoint"""
    def wrapper(request_handler, *args, **kwargs):
        # Get Authorization header
        auth_header = request_handler.headers.get('Authorization', '')
        
        if not auth_header:
            request_handler._set_headers(401, 'application/json')
            response = json.dumps({"status": "error", "message": "Missing Authorization header"})
            request_handler.wfile.write(response.encode())
            return
        
        # Check for Bearer token format
        if not auth_header.startswith('Bearer '):
            request_handler._set_headers(401, 'application/json')
            response = json.dumps({"status": "error", "message": "Invalid Authorization header format"})
            request_handler.wfile.write(response.encode())
            return
        
        # Extract token
        token = auth_header[7:]  # Remove 'Bearer ' prefix
        
        # Verify token
        payload = verify_jwt_token(token)
        
        if 'error' in payload:
            request_handler._set_headers(401, 'application/json')
            response = json.dumps({"status": "error", "message": payload['error']})
            request_handler.wfile.write(response.encode())
            return
        
        # Add user info to request handler
        request_handler.user_id = payload.get('user_id')
        request_handler.user_type = payload.get('user_type')
        
        # Call the wrapped function
        return f(request_handler, *args, **kwargs)
    
    return wrapper

def get_auth_header(request_handler):
    """Get Authorization header from request"""
    auth_header = request_handler.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        return auth_header[7:]
    return None

def verify_auth(request_handler):
    """Verify authorization and return user info or None"""
    token = get_auth_header(request_handler)
    
    if not token:
        return None
    
    payload = verify_jwt_token(token)
    
    if 'error' in payload:
        return None
    
    return payload

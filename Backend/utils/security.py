"""Security utilities for JWT, rate limiting, and input validation"""
import jwt
import json
import time
from datetime import datetime, timedelta
from collections import defaultdict
from config import SECRET_KEY
import re

# In-memory storage for rate limiting (use Redis in production)
login_attempts = defaultdict(list)
csrf_tokens = set()

# Token cache with TTL to reduce verification overhead
token_cache = {}
token_cache_ttl = {}

def create_jwt_token(user_id, user_type, expires_in_hours=24):
    """Create a JWT token for a user"""
    try:
        payload = {
            'user_id': user_id,
            'user_type': user_type,
            'iat': datetime.utcnow(),
            'exp': datetime.utcnow() + timedelta(hours=expires_in_hours)
        }
        token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')
        return token
    except Exception as e:
        print(f"Error creating JWT token: {e}")
        return None

def verify_jwt_token(token):
    """Verify and decode a JWT token with caching"""
    
    # Check cache first
    if token in token_cache:
        cached_time = token_cache_ttl.get(token, 0)
        if time.time() < cached_time:
            return token_cache[token]
        else:
            # Expired cache entry, remove it
            del token_cache[token]
            if token in token_cache_ttl:
                del token_cache_ttl[token]
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        
        # Cache the result for 60 seconds
        token_cache[token] = payload
        token_cache_ttl[token] = time.time() + 60
        
        return payload
    except jwt.ExpiredSignatureError:
        return {'error': 'Token expired'}
    except jwt.InvalidTokenError:
        return {'error': 'Invalid token'}
    except Exception as e:
        print(f"Error verifying JWT token: {e}")
        return {'error': 'Token verification failed'}

def is_rate_limited(ip_address, max_attempts=5, window_seconds=300):
    """Check if an IP is rate limited (for login attempts)"""
    now = time.time()
    # Clean old attempts
    login_attempts[ip_address] = [t for t in login_attempts[ip_address] if now - t < window_seconds]
    
    if len(login_attempts[ip_address]) >= max_attempts:
        return True
    
    login_attempts[ip_address].append(now)
    return False

def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    """Validate password strength"""
    errors = []
    
    if len(password) < 8:
        errors.append("Password must be at least 8 characters long")
    if not any(c.isupper() for c in password):
        errors.append("Password must contain at least one uppercase letter")
    if not any(c.islower() for c in password):
        errors.append("Password must contain at least one lowercase letter")
    if not any(c.isdigit() for c in password):
        errors.append("Password must contain at least one number")
    if not re.search(r'[!@#$%^&*()_+\-=\[\]{};:\'\"\\|,.<>/?]', password):
        errors.append("Password must contain at least one special character")
    
    return errors

def sanitize_input(input_string, max_length=255):
    """Sanitize user input to prevent XSS"""
    if not isinstance(input_string, str):
        return ""
    
    # Limit length
    input_string = input_string[:max_length]
    
    # Remove potentially dangerous characters
    dangerous_chars = ['<', '>', '"', "'", '&', '%', ';']
    for char in dangerous_chars:
        input_string = input_string.replace(char, '')
    
    return input_string.strip()

def validate_file_upload(filename, file_size, allowed_extensions, max_file_size):
    """Validate file upload"""
    errors = []
    
    if not filename:
        errors.append("No filename provided")
        return errors
    
    # Check file size
    if file_size > max_file_size:
        errors.append(f"File size exceeds maximum of {max_file_size} bytes")
    
    # Check file extension
    file_ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
    if file_ext not in allowed_extensions:
        errors.append(f"File type not allowed. Allowed types: {', '.join(allowed_extensions)}")
    
    # Check for double extensions
    if filename.count('.') > 1:
        errors.append("Double extensions are not allowed")
    
    return errors

def generate_csrf_token():
    """Generate a CSRF token"""
    import secrets
    token = secrets.token_urlsafe(32)
    csrf_tokens.add(token)
    return token

def verify_csrf_token(token):
    """Verify a CSRF token"""
    if token in csrf_tokens:
        csrf_tokens.discard(token)
        return True
    return False

import json
import bcrypt
import mysql.connector
import random
import string
import threading
import time
from config import get_db_connection
from utils.email import send_otp_email
from utils.security import is_rate_limited, validate_email, validate_password, create_jwt_token

def generate_otp():
    """Generate a 6-digit OTP"""
    return ''.join(random.choices(string.digits, k=6))

# To store OTPs temporarily 
otp_storage = {}
OTP_EXPIRY_SECONDS = 600
OTP_MAX_ATTEMPTS = 5

def send_otp_async(email, otp_code):
    """Send OTP email in background thread (non-blocking)"""
    thread = threading.Thread(target=send_otp_email, args=(email, otp_code), daemon=True)
    thread.start()

def _store_otp(otp_key, otp_code, email, user_id, user_type, purpose='auth'):
    otp_storage[otp_key] = {
        'otp': otp_code,
        'email': email,
        'user_id': user_id,
        'user_type': user_type,
        'type': purpose,
        'created_at': time.time(),
        'attempts': 0
    }

def _verify_stored_otp(otp_key, otp_code):
    stored_otp = otp_storage.get(otp_key)
    if not stored_otp:
        return False, "Invalid OTP"

    created_at = stored_otp.get('created_at', 0)
    if time.time() - created_at > OTP_EXPIRY_SECONDS:
        del otp_storage[otp_key]
        return False, "OTP expired"

    attempts = stored_otp.get('attempts', 0)
    if attempts >= OTP_MAX_ATTEMPTS:
        del otp_storage[otp_key]
        return False, "Too many invalid attempts. Request a new OTP"

    if stored_otp.get('otp') != otp_code:
        stored_otp['attempts'] = attempts + 1
        return False, "Invalid OTP"

    return True, stored_otp

def handle_register(request_handler, data):
    """Handle user registration"""
    email = data.get('email')
    password = data.get('password')
    user_type = data.get('user_type')  # either student or professional
    full_name = data.get('first_name', '') + ' ' + data.get('last_name', '')
    
    if not all([email, password, user_type, full_name.strip()]):
        request_handler._set_headers(400, 'application/json')
        response = json.dumps({"status": "error", "message": "Missing required fields"})
        request_handler.wfile.write(response.encode())
        return
    
    # Validate email
    if not validate_email(email):
        request_handler._set_headers(400, 'application/json')
        response = json.dumps({"status": "error", "message": "Invalid email format"})
        request_handler.wfile.write(response.encode())
        return
    
    # Validate password complexity
    password_errors = validate_password(password)
    if password_errors:
        request_handler._set_headers(400, 'application/json')
        response = json.dumps({"status": "error", "message": password_errors[0]})
        request_handler.wfile.write(response.encode())
        return
    
    # To hash passwords using bcrypt
    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    connection = get_db_connection()
    if not connection:
        request_handler._set_headers(500, 'application/json')
        response = json.dumps({"status": "error", "message": "Database connection failed"})
        request_handler.wfile.write(response.encode())
        return
    
    cursor = connection.cursor() #to execute SQL queries
    
    try:
        if user_type == 'student':
            # Insert into Students table
            query = """
            INSERT INTO Students (FullName, Email, Password)
            VALUES (%s, %s, %s)
            """
            cursor.execute(query, (full_name.strip(), email, password_hash))
            user_id = cursor.lastrowid
            
        elif user_type == 'professional':
            # Insert into MentalHealthProfessionals table with pending verification
            query = """
            INSERT INTO MentalHealthProfessionals (FullName, Email, Password, Category, VerificationStatus)
            VALUES (%s, %s, %s, 'General Mental Health', 'Pending')
            """
            cursor.execute(query, (full_name.strip(), email, password_hash))
            user_id = cursor.lastrowid
        else:
            request_handler._set_headers(400, 'application/json')
            response = json.dumps({"status": "error", "message": "Invalid user type"})
            request_handler.wfile.write(response.encode())
            return
        
        connection.commit() #to save changes
        
        # To generate and store OTPs
        otp_code = generate_otp()
        _store_otp(f"{user_type}_{user_id}", otp_code, email, user_id, user_type)
        
        # Send OTP via email (async, non-blocking)
        send_otp_async(email, otp_code)
        print(f"OTP for {email}: {otp_code}")  # For debugging
        
        request_handler._set_headers(201, 'application/json')
        response = json.dumps({
            "status": "success",
            "message": "User registered successfully. OTP sent to email.",
            "user_id": user_id,
            "user_type": user_type
        })
        request_handler.wfile.write(response.encode()) #to send response back to client
        
    except mysql.connector.IntegrityError as e:
        request_handler._set_headers(409, 'application/json')
        response = json.dumps({"status": "error", "message": "Email already exists"})
        request_handler.wfile.write(response.encode())
    except Exception as e:
        connection.rollback()
        request_handler._set_headers(500, 'application/json')
        response = json.dumps({"status": "error", "message": "Registration failed. Please try again."})
        request_handler.wfile.write(response.encode())
    finally:
        cursor.close()
        connection.close()

def handle_verify_otp(request_handler, data):
    """Handle OTP verification"""
    user_id = data.get('user_id')
    user_type = data.get('user_type')
    otp_code = data.get('otp_code')
    
    if not all([user_id, user_type, otp_code]):
        request_handler._set_headers(400, 'application/json')
        response = json.dumps({"status": "error", "message": "Missing required fields"})
        request_handler.wfile.write(response.encode())
        return
    
    # To check OTP
    otp_key = f"{user_type}_{user_id}"
    otp_is_valid, otp_result = _verify_stored_otp(otp_key, otp_code)
    if not otp_is_valid:
        request_handler._set_headers(401, 'application/json')
        response = json.dumps({"status": "error", "message": otp_result})
        request_handler.wfile.write(response.encode())
        return
    
    # To remove used OTP
    del otp_storage[otp_key]
    
    # Generate JWT token upon successful OTP verification
    jwt_token = create_jwt_token(user_id, user_type, expires_in_hours=24)
    
    request_handler._set_headers(200, 'application/json')
    response = json.dumps({
        "status": "success",
        "message": "Email verified successfully",
        "token": jwt_token,
        "user_id": user_id,
        "user_type": user_type
    })
    request_handler.wfile.write(response.encode())

def handle_login(request_handler, data):
    """Handle user login"""
    email = data.get('email')
    password = data.get('password')
    
    # Get client IP for rate limiting
    client_ip = request_handler.client_address[0]
    
    # Check rate limiting
    if is_rate_limited(client_ip, max_attempts=5, window_seconds=300):
        request_handler._set_headers(429, 'application/json')
        response = json.dumps({"status": "error", "message": "Too many login attempts. Please try again later."})
        request_handler.wfile.write(response.encode())
        return
    
    if not email or not password:
        request_handler._set_headers(400, 'application/json')
        response = json.dumps({"status": "error", "message": "Email and password required"})
        request_handler.wfile.write(response.encode())
        return
    
    connection = get_db_connection()
    if not connection:
        request_handler._set_headers(500, 'application/json')
        response = json.dumps({"status": "error", "message": "Database connection failed"})
        request_handler.wfile.write(response.encode())
        return
    
    cursor = connection.cursor(dictionary=True)
    
    try:
        # Try to find user in Students table
        query = "SELECT StudentID as id, FullName, Email, Password, 'student' as user_type FROM Students WHERE Email = %s"
        cursor.execute(query, (email,))
        user = cursor.fetchone()
        
        # If not found, try MentalHealthProfessionals table
        if not user:
            query = """
            SELECT ProfessionalID as id, FullName, Email, Password, 'professional' as user_type, 
                   VerificationStatus 
            FROM MentalHealthProfessionals WHERE Email = %s
            """
            cursor.execute(query, (email,))
            user = cursor.fetchone()
        
        # If still not found, try Admins table
        if not user:
            query = "SELECT AdminID as id, Email, Password, 'admin' as user_type FROM Admins WHERE Email = %s"
            cursor.execute(query, (email,))
            user = cursor.fetchone()
        
        if not user:
            request_handler._set_headers(401, 'application/json')
            response = json.dumps({"status": "error", "message": "Invalid credentials"})
            request_handler.wfile.write(response.encode())
            return
        
        # To check if a professional is verified
        if user['user_type'] == 'professional' and user.get('VerificationStatus') != 'Verified':
            request_handler._set_headers(403, 'application/json')
            response = json.dumps({
                "status": "error", 
                "message": f"Account verification is {user.get('VerificationStatus', 'pending').lower()}. Please wait for admin approval."
            })
            request_handler.wfile.write(response.encode())
            return
        
        # To check the password
        if bcrypt.checkpw(password.encode('utf-8'), user['Password'].encode('utf-8')):
            # Prepare user data
            user_data = {
                "user_id": user['id'],
                "email": user['Email'],
                "user_type": user['user_type']
            }
            
            # Add name if available
            if 'FullName' in user:
                name_parts = user['FullName'].split(' ', 1)
                user_data['first_name'] = name_parts[0]
                user_data['last_name'] = name_parts[1] if len(name_parts) > 1 else ''
            
            # Generate OTP for login
            otp_code = generate_otp()
            otp_key = f"{user['user_type']}_{user['id']}"
            _store_otp(otp_key, otp_code, user['Email'], user['id'], user['user_type'])
            
            # Send OTP via email (async, non-blocking)
            send_otp_async(user['Email'], otp_code)
            print(f"Login OTP for {user['Email']}: {otp_code}")  # For debugging
            
            request_handler._set_headers(200, 'application/json')
            response = json.dumps({
                "status": "success",
                "message": "Login successful. OTP sent to your email.",
                "user": user_data
            })
            request_handler.wfile.write(response.encode())
        else:
            request_handler._set_headers(401, 'application/json')
            response = json.dumps({"status": "error", "message": "Invalid credentials"})
            request_handler.wfile.write(response.encode())
            
    except Exception as e:
        request_handler._set_headers(500, 'application/json')
        response = json.dumps({"status": "error", "message": "Login failed. Please try again."})
        request_handler.wfile.write(response.encode())
    finally:
        cursor.close()
        connection.close()

def handle_resend_otp(request_handler, data):
    """Resend OTP to user"""
    user_id = data.get('user_id')
    user_type = data.get('user_type')
    
    if not user_id or not user_type:
        request_handler._set_headers(400, 'application/json')
        response = json.dumps({"status": "error", "message": "User ID and type required"})
        request_handler.wfile.write(response.encode())
        return
    
    connection = get_db_connection()
    if not connection:
        request_handler._set_headers(500, 'application/json')
        response = json.dumps({"status": "error", "message": "Database connection failed"})
        request_handler.wfile.write(response.encode())
        return
    
    cursor = connection.cursor(dictionary=True)
    
    try:
        # To get user email
        if user_type == 'student':
            cursor.execute("SELECT Email FROM Students WHERE StudentID = %s", (user_id,))
        else:
            cursor.execute("SELECT Email FROM MentalHealthProfessionals WHERE ProfessionalID = %s", (user_id,))
        
        user = cursor.fetchone()
        
        if not user:
            request_handler._set_headers(404, 'application/json')
            response = json.dumps({"status": "error", "message": "User not found"})
            request_handler.wfile.write(response.encode())
            return
        
        # To generate a new OTP
        otp_code = generate_otp()
        otp_key = f"{user_type}_{user_id}"
        _store_otp(otp_key, otp_code, user['Email'], user_id, user_type)
        
        # Send OTP via email
        send_otp_email(user['Email'], otp_code)
        print(f"New OTP for {user['Email']}: {otp_code}")  # For debugging
        
        request_handler._set_headers(200, 'application/json')
        response = json.dumps({
            "status": "success",
            "message": "New OTP sent to your email"
        })
        request_handler.wfile.write(response.encode())
        
    except Exception as e:
        request_handler._set_headers(500, 'application/json')
        response = json.dumps({"status": "error", "message": "Failed to resend OTP. Please try again."})
        request_handler.wfile.write(response.encode())
    finally:
        cursor.close()
        connection.close()

def handle_get_user(request_handler, user_id, user_type):
    """Fetch user details after OTP verification"""
    if not user_id or not user_type:
        request_handler._set_headers(400, 'application/json')
        response = json.dumps({"status": "error", "message": "User ID and type required"})
        request_handler.wfile.write(response.encode())
        return

    connection = get_db_connection()
    if not connection:
        request_handler._set_headers(500, 'application/json')
        response = json.dumps({"status": "error", "message": "Database connection failed"})
        request_handler.wfile.write(response.encode())
        return

    cursor = connection.cursor(dictionary=True)

    try:
        if user_type == 'student':
            cursor.execute("""
                SELECT StudentID as id, FullName, Email, 'student' as user_type
                FROM Students
                WHERE StudentID = %s
            """, (user_id,))
        elif user_type == 'professional':
            cursor.execute("""
                SELECT ProfessionalID as id, FullName, Email, 'professional' as user_type, VerificationStatus
                FROM MentalHealthProfessionals
                WHERE ProfessionalID = %s
            """, (user_id,))
        elif user_type == 'admin':
            cursor.execute("""
                SELECT AdminID as id, Email, 'admin' as user_type
                FROM Admins
                WHERE AdminID = %s
            """, (user_id,))
        else:
            request_handler._set_headers(400, 'application/json')
            response = json.dumps({"status": "error", "message": "Invalid user type"})
            request_handler.wfile.write(response.encode())
            return

        user = cursor.fetchone()

        if not user:
            request_handler._set_headers(404, 'application/json')
            response = json.dumps({"status": "error", "message": "User not found"})
            request_handler.wfile.write(response.encode())
            return

        user_data = {
            "user_id": user['id'],
            "email": user['Email'],
            "user_type": user['user_type']
        }

        if 'FullName' in user and user['FullName']:
            name_parts = user['FullName'].split(' ', 1)
            user_data['first_name'] = name_parts[0]
            user_data['last_name'] = name_parts[1] if len(name_parts) > 1 else ''

        request_handler._set_headers(200, 'application/json')
        response = json.dumps({"status": "success", "user": user_data})
        request_handler.wfile.write(response.encode())
    except Exception as e:
        request_handler._set_headers(500, 'application/json')
        response = json.dumps({"status": "error", "message": "Failed to fetch user details."})
        request_handler.wfile.write(response.encode())
    finally:
        cursor.close()
        connection.close()

def handle_forgot_password(request_handler, data):
    """Handle forgot password request - send OTP to email"""
    email = data.get('email')
    
    if not email:
        request_handler._set_headers(400, 'application/json')
        response = json.dumps({"status": "error", "message": "Email required"})
        request_handler.wfile.write(response.encode())
        return
    
    # Get client IP for rate limiting
    client_ip = request_handler.client_address[0]
    
    # Check rate limiting
    if is_rate_limited(client_ip, max_attempts=3, window_seconds=600):
        request_handler._set_headers(429, 'application/json')
        response = json.dumps({"status": "error", "message": "Too many password reset attempts. Please try again later."})
        request_handler.wfile.write(response.encode())
        return
    
    connection = get_db_connection()
    if not connection:
        request_handler._set_headers(500, 'application/json')
        response = json.dumps({"status": "error", "message": "Database connection failed"})
        request_handler.wfile.write(response.encode())
        return
    
    cursor = connection.cursor(dictionary=True)
    
    try:
        # Try to find user in Students table
        query = "SELECT StudentID as id, Email, 'student' as user_type FROM Students WHERE Email = %s"
        cursor.execute(query, (email,))
        user = cursor.fetchone()
        
        # If not found, try MentalHealthProfessionals table
        if not user:
            query = "SELECT ProfessionalID as id, Email, 'professional' as user_type FROM MentalHealthProfessionals WHERE Email = %s"
            cursor.execute(query, (email,))
            user = cursor.fetchone()
        
        # If still not found, try Admins table
        if not user:
            query = "SELECT AdminID as id, Email, 'admin' as user_type FROM Admins WHERE Email = %s"
            cursor.execute(query, (email,))
            user = cursor.fetchone()
        
        if not user:
            # Return success anyway for security (don't leak email existence)
            request_handler._set_headers(200, 'application/json')
            response = json.dumps({"status": "success", "message": "If email exists, OTP has been sent"})
            request_handler.wfile.write(response.encode())
            return
        
        # Generate OTP for password reset
        otp_code = generate_otp()
        otp_key = f"reset_{user['user_type']}_{user['id']}"
        _store_otp(otp_key, otp_code, email, user['id'], user['user_type'], purpose='password_reset')
        
        # Send OTP via email (async, non-blocking)
        send_otp_async(email, otp_code)
        print(f"Password Reset OTP for {email}: {otp_code}")  # For debugging
        
        request_handler._set_headers(200, 'application/json')
        response = json.dumps({
            "status": "success",
            "message": "OTP sent to your email",
            "user_id": user['id'],
            "user_type": user['user_type']
        })
        request_handler.wfile.write(response.encode())
        
    except Exception as e:
        request_handler._set_headers(500, 'application/json')
        response = json.dumps({"status": "error", "message": "Failed to process request. Please try again."})
        request_handler.wfile.write(response.encode())
    finally:
        cursor.close()
        connection.close()

def handle_reset_password(request_handler, data):
    """Handle password reset - verify OTP and update password"""
    email = data.get('email')
    otp_code = data.get('otp_code')
    new_password = data.get('new_password')
    user_type = data.get('user_type')
    
    if not all([email, otp_code, new_password, user_type]):
        request_handler._set_headers(400, 'application/json')
        response = json.dumps({"status": "error", "message": "Missing required fields"})
        request_handler.wfile.write(response.encode())
        return

    # Rate limit password reset attempts
    client_ip = request_handler.client_address[0]
    if is_rate_limited(client_ip, max_attempts=5, window_seconds=600):
        request_handler._set_headers(429, 'application/json')
        response = json.dumps({"status": "error", "message": "Too many reset attempts. Please try again later."})
        request_handler.wfile.write(response.encode())
        return
    
    # Validate password complexity
    password_errors = validate_password(new_password)
    if password_errors:
        request_handler._set_headers(400, 'application/json')
        response = json.dumps({"status": "error", "message": password_errors[0]})
        request_handler.wfile.write(response.encode())
        return
    
    connection = get_db_connection()
    if not connection:
        request_handler._set_headers(500, 'application/json')
        response = json.dumps({"status": "error", "message": "Database connection failed"})
        request_handler.wfile.write(response.encode())
        return
    
    cursor = connection.cursor(dictionary=True)
    
    try:
        # Get user by email and type to verify identity
        if user_type == 'student':
            query = "SELECT StudentID as id FROM Students WHERE Email = %s"
        elif user_type == 'professional':
            query = "SELECT ProfessionalID as id FROM MentalHealthProfessionals WHERE Email = %s"
        elif user_type == 'admin':
            query = "SELECT AdminID as id FROM Admins WHERE Email = %s"
        else:
            request_handler._set_headers(400, 'application/json')
            response = json.dumps({"status": "error", "message": "Invalid user type"})
            request_handler.wfile.write(response.encode())
            return
        
        cursor.execute(query, (email,))
        user = cursor.fetchone()
        
        if not user:
            request_handler._set_headers(404, 'application/json')
            response = json.dumps({"status": "error", "message": "User not found"})
            request_handler.wfile.write(response.encode())
            return
        
        # Verify OTP
        otp_key = f"reset_{user_type}_{user['id']}"
        otp_is_valid, otp_result = _verify_stored_otp(otp_key, otp_code)
        if not otp_is_valid:
            request_handler._set_headers(401, 'application/json')
            response = json.dumps({"status": "error", "message": otp_result})
            request_handler.wfile.write(response.encode())
            return
        
        # Hash new password
        password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Update password in database
        if user_type == 'student':
            update_query = "UPDATE Students SET Password = %s WHERE StudentID = %s"
        elif user_type == 'professional':
            update_query = "UPDATE MentalHealthProfessionals SET Password = %s WHERE ProfessionalID = %s"
        else:  # admin
            update_query = "UPDATE Admins SET Password = %s WHERE AdminID = %s"
        
        cursor.execute(update_query, (password_hash, user['id']))
        connection.commit()
        
        # Remove used OTP
        del otp_storage[otp_key]
        
        request_handler._set_headers(200, 'application/json')
        response = json.dumps({
            "status": "success",
            "message": "Password reset successfully. You can now login with your new password."
        })
        request_handler.wfile.write(response.encode())
        
    except Exception as e:
        connection.rollback()
        request_handler._set_headers(500, 'application/json')
        response = json.dumps({"status": "error", "message": "Failed to reset password. Please try again."})
        request_handler.wfile.write(response.encode())
    finally:
        cursor.close()
        connection.close()

import json
import bcrypt
import mysql.connector
import random
import string
from config import get_db_connection
from utils.email import send_otp_email

def generate_otp():
    """Generate a 6-digit OTP"""
    return ''.join(random.choices(string.digits, k=6))

# To store OTPs temporarily 
otp_storage = {}

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
    
    # Validate password complexity
    if len(password) < 8:
        request_handler._set_headers(400, 'application/json')
        response = json.dumps({"status": "error", "message": "Password must be at least 8 characters long"})
        request_handler.wfile.write(response.encode())
        return
    
    # Check for uppercase letter
    if not any(c.isupper() for c in password):
        request_handler._set_headers(400, 'application/json')
        response = json.dumps({"status": "error", "message": "Password must contain at least one uppercase letter"})
        request_handler.wfile.write(response.encode())
        return
    
    # Check for lowercase letter
    if not any(c.islower() for c in password):
        request_handler._set_headers(400, 'application/json')
        response = json.dumps({"status": "error", "message": "Password must contain at least one lowercase letter"})
        request_handler.wfile.write(response.encode())
        return
    
    # Check for number
    if not any(c.isdigit() for c in password):
        request_handler._set_headers(400, 'application/json')
        response = json.dumps({"status": "error", "message": "Password must contain at least one number"})
        request_handler.wfile.write(response.encode())
        return
    
    # Check for special character
    import re
    if not re.search(r'[!@#$%^&*()_+\-=\[\]{};:\'\"\\|,.<>/?]', password):
        request_handler._set_headers(400, 'application/json')
        response = json.dumps({"status": "error", "message": "Password must contain at least one special character"})
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
        otp_storage[f"{user_type}_{user_id}"] = {
            'otp': otp_code,
            'email': email,
            'user_id': user_id,
            'user_type': user_type
        }
        
        # Send OTP via email
        send_otp_email(email, otp_code)
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
        response = json.dumps({"status": "error", "message": str(e)})
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
    stored_otp = otp_storage.get(otp_key)
    
    if not stored_otp or stored_otp['otp'] != otp_code:
        request_handler._set_headers(401, 'application/json')
        response = json.dumps({"status": "error", "message": "Invalid OTP"})
        request_handler.wfile.write(response.encode())
        return
    
    # To remove used OTP
    del otp_storage[otp_key]
    
    request_handler._set_headers(200, 'application/json')
    response = json.dumps({
        "status": "success",
        "message": "Email verified successfully"
    })
    request_handler.wfile.write(response.encode())

def handle_login(request_handler, data):
    """Handle user login"""
    email = data.get('email')
    password = data.get('password')
    
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
            otp_storage[otp_key] = {
                'otp': otp_code,
                'email': user['Email'],
                'user_id': user['id'],
                'user_type': user['user_type']
            }
            
            # Send OTP via email
            send_otp_email(user['Email'], otp_code)
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
        response = json.dumps({"status": "error", "message": str(e)})
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
        otp_storage[otp_key] = {
            'otp': otp_code,
            'email': user['Email'],
            'user_id': user_id,
            'user_type': user_type
        }
        
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
        response = json.dumps({"status": "error", "message": str(e)})
        request_handler.wfile.write(response.encode())
    finally:
        cursor.close()
        connection.close()
import json
import os
from config import get_db_connection
from datetime import datetime

def save_verification_documents(user_id, category, document_data, filename):
    """Save verification documents and update professional record"""
    
    connection = get_db_connection()
    if not connection:
        return {"status": "error", "message": "Database connection failed"}
    
    cursor = connection.cursor(dictionary=True)
    
    try:
        # To create uploads directory if it doesn't exist
        upload_dir = "uploads/verification_documents"
        os.makedirs(upload_dir, exist_ok=True)
        
        # To generate a unique filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        file_extension = os.path.splitext(filename)[1]
        new_filename = f"professional_{user_id}_{timestamp}{file_extension}"
        file_path = os.path.join(upload_dir, new_filename)
        
        # To save file
        with open(file_path, 'wb') as f:
            f.write(document_data)
        
        # To update professional record with category
        query = """
        UPDATE MentalHealthProfessionals 
        SET Category = %s
        WHERE ProfessionalID = %s
        """
        cursor.execute(query, (category, user_id))
        connection.commit()
        
        return {
            "status": "success",
            "message": "Documents submitted successfully. Awaiting verification."
        }
        
    except Exception as e:
        connection.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        cursor.close()
        connection.close()

def get_professional_verification_status(request_handler, user_id):
    """Get verification status for a professional"""
    
    connection = get_db_connection()
    if not connection:
        request_handler._set_headers(500, 'application/json')
        response = json.dumps({"status": "error", "message": "Database connection failed"})
        request_handler.wfile.write(response.encode())
        return
    
    cursor = connection.cursor(dictionary=True)
    
    try:
        query = """
        SELECT VerificationStatus, Category
        FROM MentalHealthProfessionals
        WHERE ProfessionalID = %s
        """
        cursor.execute(query, (user_id,))
        professional = cursor.fetchone()
        
        if not professional:
            request_handler._set_headers(404, 'application/json')
            response = json.dumps({"status": "error", "message": "Professional not found"})
            request_handler.wfile.write(response.encode())
            return
        
        request_handler._set_headers(200, 'application/json')
        response = json.dumps({
            "status": "success",
            "data": {
                "verification_status": professional['VerificationStatus'],
                "category": professional['Category']
            }
        })
        request_handler.wfile.write(response.encode())
        
    except Exception as e:
        request_handler._set_headers(500, 'application/json')
        response = json.dumps({"status": "error", "message": str(e)})
        request_handler.wfile.write(response.encode())
    finally:
        cursor.close()
        connection.close()

def handle_submit_verification(request_handler, post_data, content_type):
    """Handle professional verification document submission"""
    import re
    
    try:
        print(f"handle_submit_verification called, content_type: {content_type}")
        
        # Parse multipart form data
        boundary_match = re.search(r'boundary=([^\r\n;]+)', content_type)
        if not boundary_match:
            print("No boundary found in content-type")
            request_handler._set_headers(400, 'application/json')
            response = json.dumps({"status": "error", "message": "Invalid multipart data - no boundary"})
            request_handler.wfile.write(response.encode())
            return
        
        boundary = boundary_match.group(1).strip('"').strip()
        print(f"Boundary: {boundary}")
        
        # Split by boundary
        parts = post_data.split(('--' + boundary).encode())
        print(f"Found {len(parts)} parts")
        
        form_data = {}
        file_data = None
        filename = None
        
        for i, part in enumerate(parts):
            if not part or part == b'--\r\n' or part == b'--':
                continue
                
            print(f"Processing part {i}, size: {len(part)}")
            
            if b'Content-Disposition' not in part:
                continue
            
            # Split headers from body
            try:
                if b'\r\n\r\n' in part:
                    header_section, body = part.split(b'\r\n\r\n', 1)
                elif b'\n\n' in part:
                    header_section, body = part.split(b'\n\n', 1)
                else:
                    continue
            except:
                continue
            
            headers = header_section.decode('utf-8', errors='ignore')
            print(f"Headers: {headers[:100]}")
            
            # Clean up body - remove trailing boundary markers
            body = body.rstrip(b'\r\n--').rstrip(b'\n--').rstrip(b'\r\n').rstrip(b'\n')
            
            if 'filename=' in headers:
                # This is a file field
                filename_match = re.search(r'filename="([^"]+)"', headers)
                if filename_match:
                    filename = filename_match.group(1)
                    file_data = body
                    print(f"File: {filename}, size: {len(file_data)}")
            else:
                # Regular form field
                name_match = re.search(r'name="([^"]+)"', headers)
                if name_match:
                    field_name = name_match.group(1)
                    field_value = body.decode('utf-8', errors='ignore').strip()
                    form_data[field_name] = field_value
                    print(f"Field: {field_name} = {field_value}")
        
        print(f"Parsed form_data: {form_data}")
        print(f"File: {filename}, File data present: {file_data is not None and len(file_data) > 0}")
        
        if not file_data:
            print("No file data found")
            request_handler._set_headers(400, 'application/json')
            response = json.dumps({"status": "error", "message": "No file uploaded"})
            request_handler.wfile.write(response.encode())
            return
        
        if not filename:
            print("No filename found")
            request_handler._set_headers(400, 'application/json')
            response = json.dumps({"status": "error", "message": "No filename provided"})
            request_handler.wfile.write(response.encode())
            return
        
        user_id = form_data.get('user_id')
        category = form_data.get('specialization', 'General Mental Health')
        
        if not user_id:
            print("No user_id in form data")
            request_handler._set_headers(400, 'application/json')
            response = json.dumps({"status": "error", "message": "User ID required"})
            request_handler.wfile.write(response.encode())
            return
        
        print(f"Processing verification for user {user_id}, category {category}")
        
        # Save the document and update database
        result = save_verification_documents(user_id, category, file_data, filename)
        print(f"Save result: {result}")
        
        if result['status'] == 'success':
            request_handler._set_headers(200, 'application/json')
        else:
            request_handler._set_headers(400, 'application/json')
        
        request_handler.wfile.write(json.dumps(result).encode())
        
    except Exception as e:
        print(f"Exception in handle_submit_verification: {str(e)}")
        import traceback
        traceback.print_exc()
        request_handler._set_headers(500, 'application/json')
        response = json.dumps({"status": "error", "message": str(e)})
        request_handler.wfile.write(response.encode())
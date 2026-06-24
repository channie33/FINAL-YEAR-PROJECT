import json
import os
import mimetypes
import hashlib
import secrets
from config import get_db_connection, MAX_FILE_SIZE, ALLOWED_EXTENSIONS
from utils.file_upload import validate_file_upload, calculate_file_hash, sanitize_filename, get_safe_file_path
from datetime import datetime
from .messages import _ensure_messages_table

# File upload settings use values from config.py
# MAX_FILE_SIZE and ALLOWED_EXTENSIONS are imported from config
ALLOWED_VERIFICATION_EXTENSIONS = ALLOWED_EXTENSIONS
MAX_VERIFICATION_FILE_SIZE = MAX_FILE_SIZE


def _json_default(value):
    """Fallback serializer for non-JSON types (e.g., datetime)."""
    return str(value)

def get_all_professionals(request_handler):
    """Get all verified professionals for search/listing"""
    connection = get_db_connection()
    if not connection:
        request_handler._set_headers(500, 'application/json')
        request_handler.wfile.write(json.dumps({"status": "error", "message": "Database connection failed"}, default=_json_default).encode())
        return

    try:
        cursor = connection.cursor(dictionary=True)
        cursor.execute("""
            SELECT 
                ProfessionalID,
                FullName,
                Email,
                Category
            FROM MentalHealthProfessionals
            WHERE VerificationStatus = 'Verified'
            ORDER BY FullName
        """)
        professionals = cursor.fetchall()

        # Attach anonymous review details for student-side search cards.
        for professional in professionals:
            professional_id = professional['ProfessionalID']
            cursor.execute("""
                SELECT
                    Rating,
                    FeedbackText
                FROM FeedbackRatings
                WHERE ProfessionalID = %s
                ORDER BY FeedbackID DESC
            """, (professional_id,))
            review_rows = cursor.fetchall()

            professional['reviews'] = [
                {
                    "rating": row.get('Rating'),
                    "feedback_text": row.get('FeedbackText') or "",
                    "reviewer": "Anonymous Student"
                }
                for row in review_rows
            ]
            professional['review_count'] = len(review_rows)
            professional['average_rating'] = round(
                sum(row['Rating'] for row in review_rows) / len(review_rows),
                2
            ) if review_rows else 0

        request_handler._set_headers(200, 'application/json')
        response = json.dumps({
            "status": "success",
            "data": professionals
        }, default=_json_default)
        request_handler.wfile.write(response.encode())
    except Exception as e:
        request_handler._set_headers(500, 'application/json')
        request_handler.wfile.write(json.dumps({"status": "error", "message": str(e)}, default=_json_default).encode())
    finally:
        cursor.close()
        connection.close()

def get_professional_profile(request_handler, user_id):
    """Get professional profile data"""
    connection = get_db_connection()
    if not connection:
        request_handler._set_headers(500, 'application/json')
        request_handler.wfile.write(json.dumps({"status": "error", "message": "Database connection failed"}, default=_json_default).encode())
        return
    
    try:
        cursor = connection.cursor(dictionary=True)
        
        # Get professional profile
        cursor.execute("""
            SELECT 
                ProfessionalID,
                FullName,
                Email,
                Category,
                VerificationStatus,
                CreatedAt
            FROM MentalHealthProfessionals
            WHERE ProfessionalID = %s
        """, (user_id,))
        
        professional = cursor.fetchone()
        
        if not professional:
            request_handler._set_headers(404, 'application/json')
            request_handler.wfile.write(json.dumps({"status": "error", "message": "Professional not found"}, default=_json_default).encode())
            return
        
        # Get students assigned to this professional
        cursor.execute("""
            SELECT DISTINCT
                s.StudentID,
                s.FullName,
                s.Email,
                COUNT(sa.AppointmentID) as session_count
            FROM Students s
            LEFT JOIN SessionAppointments sa ON s.StudentID = sa.StudentID
            WHERE sa.ProfessionalID = %s
            GROUP BY s.StudentID
            ORDER BY s.FullName
        """, (user_id,))
        
        students = cursor.fetchall()
        
        # Get ratings/reviews for this professional
        cursor.execute("""
            SELECT 
                fr.FeedbackID,
                fr.Rating,
                fr.FeedbackText
            FROM FeedbackRatings fr
            WHERE fr.ProfessionalID = %s
            ORDER BY fr.FeedbackID DESC
        """, (user_id,))
        
        reviews = cursor.fetchall()

        for review in reviews:
            review['reviewer'] = 'Anonymous Student'
        
        # Calculate average rating
        avg_rating = sum(r['Rating'] for r in reviews) / len(reviews) if reviews else 0
        
        request_handler._set_headers(200, 'application/json')
        response = json.dumps({
            "status": "success",
            "data": {
                "profile": professional,
                "students": students,
                "reviews": reviews,
                "average_rating": round(avg_rating, 2)
            }
        }, default=_json_default)
        request_handler.wfile.write(response.encode())
        
    except Exception as e:
        request_handler._set_headers(500, 'application/json')
        request_handler.wfile.write(json.dumps({"status": "error", "message": str(e)}, default=_json_default).encode())
    finally:
        cursor.close()
        connection.close()


def get_professional_messages(request_handler, user_id):
    """Get all conversations for a professional"""
    connection = get_db_connection()
    if not connection:
        request_handler._set_headers(500, 'application/json')
        request_handler.wfile.write(json.dumps({"error": "Database connection failed"}, default=_json_default).encode())
        return
    
    try:
        cursor = connection.cursor(dictionary=True)
        _ensure_messages_table(cursor)
        
        # Get unique students professional has messaged
        cursor.execute("""
            SELECT DISTINCT
                s.StudentID,
                s.FullName,
                MAX(m.SentAt) as last_message_time
            FROM Messages m
            JOIN Students s ON m.StudentID = s.StudentID
            WHERE m.ProfessionalID = %s
            GROUP BY s.StudentID
            ORDER BY last_message_time DESC
        """, (user_id,))
        
        conversations = cursor.fetchall()
        
        request_handler._set_headers(200, 'application/json')
        response = json.dumps({
            "status": "success",
            "data": conversations
        }, default=_json_default)
        request_handler.wfile.write(response.encode())
        
    except Exception as e:
        request_handler._set_headers(500, 'application/json')
        request_handler.wfile.write(json.dumps({"status": "error", "message": str(e)}, default=_json_default).encode())
    finally:
        cursor.close()
        connection.close()


def get_professional_sessions(request_handler, user_id):
    """Get all sessions for a professional"""
    connection = get_db_connection()
    if not connection:
        request_handler._set_headers(500, 'application/json')
        request_handler.wfile.write(json.dumps({"status": "error", "message": "Database connection failed"}, default=_json_default).encode())
        return
    
    try:
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT 
                sa.AppointmentID,
                sa.SessionDate,
                s.StudentID,
                s.FullName as student_name,
                ps.TimeSlot
            FROM SessionAppointments sa
            JOIN Students s ON sa.StudentID = s.StudentID
            JOIN ProfessionalSchedule ps ON sa.ScheduleID = ps.ScheduleID
            WHERE sa.ProfessionalID = %s
            ORDER BY sa.SessionDate DESC
        """, (user_id,))
        
        sessions = cursor.fetchall()
        
        request_handler._set_headers(200, 'application/json')
        response = json.dumps({
            "status": "success",
            "data": sessions
        }, default=_json_default)
        request_handler.wfile.write(response.encode())
        
    except Exception as e:
        request_handler._set_headers(500, 'application/json')
        request_handler.wfile.write(json.dumps({"status": "error", "message": str(e)}, default=_json_default).encode())
    finally:
        cursor.close()
        connection.close()


def save_verification_documents(user_id, category, document_data, filename):
    """Save verification documents and update professional record"""
    if not user_id:
        return {"status": "error", "message": "User ID is required"}

    if not filename:
        return {"status": "error", "message": "Filename is required"}

    safe_original_name = os.path.basename(filename).strip()
    if not safe_original_name:
        return {"status": "error", "message": "Invalid filename"}

    file_extension = os.path.splitext(safe_original_name)[1].lower().lstrip('.')
    if file_extension not in ALLOWED_VERIFICATION_EXTENSIONS:
        return {"status": "error", "message": "Unsupported file type. Allowed: PDF, PNG, JPG, JPEG"}

    if not document_data:
        return {"status": "error", "message": "Uploaded file is empty"}

    file_size = len(document_data)
    if file_size > MAX_VERIFICATION_FILE_SIZE:
        return {"status": "error", "message": "File exceeds maximum size of 5 MB"}

    mime_type, _ = mimetypes.guess_type(safe_original_name)
    mime_type = mime_type or 'application/octet-stream'
    file_hash = hashlib.sha256(document_data).hexdigest()

    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
    upload_dir = os.path.abspath(os.path.join(base_dir, "uploads", "verification_documents"))

    try:
        normalized_user_id = int(user_id)
    except (TypeError, ValueError):
        return {"status": "error", "message": "Invalid user ID"}

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    random_suffix = secrets.token_hex(4)
    stored_filename = f"professional_{normalized_user_id}_{timestamp}_{random_suffix}.{file_extension}"
    file_path = os.path.abspath(os.path.join(upload_dir, stored_filename))

    if not file_path.startswith(upload_dir + os.sep):
        return {"status": "error", "message": "Invalid file path"}
    
    connection = get_db_connection()
    if not connection:
        return {"status": "error", "message": "Database connection failed"}
    
    cursor = connection.cursor(dictionary=True)
    file_written = False
    new_document_id = None
    old_documents = []
    relative_path = None
    
    try:
        os.makedirs(upload_dir, exist_ok=True)

        with open(file_path, 'wb') as f:
            f.write(document_data)
        file_written = True

        relative_path = os.path.relpath(file_path, base_dir)

        connection.start_transaction()

        cursor.execute("""
            INSERT INTO VerificationDocuments (ProfessionalID, FilePath, OriginalFileName)
            VALUES (%s, %s, %s)
        """, (normalized_user_id, relative_path, safe_original_name))
        new_document_id = cursor.lastrowid

        query = """
        UPDATE MentalHealthProfessionals 
        SET Category = %s, VerificationStatus = 'Pending'
        WHERE ProfessionalID = %s
        """
        cursor.execute(query, (category, normalized_user_id))
        if cursor.rowcount == 0:
            raise Exception("Professional not found")

        cursor.execute("""
            SELECT DocumentID, FilePath
            FROM VerificationDocuments
            WHERE ProfessionalID = %s AND DocumentID <> %s
        """, (normalized_user_id, new_document_id))
        old_documents = cursor.fetchall()

        if old_documents:
            old_ids = [doc['DocumentID'] for doc in old_documents]
            placeholders = ','.join(['%s'] * len(old_ids))
            cursor.execute(
                f"DELETE FROM VerificationDocuments WHERE DocumentID IN ({placeholders})",
                tuple(old_ids)
            )

        connection.commit()

        for old_doc in old_documents:
            try:
                old_path = os.path.abspath(os.path.join(base_dir, old_doc['FilePath']))
                if old_path.startswith(upload_dir + os.sep) and os.path.isfile(old_path):
                    os.remove(old_path)
            except Exception:
                pass

        return {
            "status": "success",
            "message": "Documents submitted successfully. Awaiting verification."
        }

    except Exception as e:
        connection.rollback()
        if file_written and os.path.isfile(file_path):
            try:
                os.remove(file_path)
            except Exception:
                pass
        return {"status": "error", "message": str(e)}
    finally:
        cursor.close()
        connection.close()

def get_professional_verification_status(request_handler, user_id):
    """Get verification status for a professional"""
    
    connection = get_db_connection()
    if not connection:
        request_handler._set_headers(500, 'application/json')
        response = json.dumps({"status": "error", "message": "Database connection failed"}, default=_json_default)
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
            response = json.dumps({"status": "error", "message": "Professional not found"}, default=_json_default)
            request_handler.wfile.write(response.encode())
            return
        
        request_handler._set_headers(200, 'application/json')
        response = json.dumps({
            "status": "success",
            "data": {
                "verification_status": professional['VerificationStatus'],
                "category": professional['Category']
            }
        }, default=_json_default)
        request_handler.wfile.write(response.encode())
        
    except Exception as e:
        request_handler._set_headers(500, 'application/json')
        response = json.dumps({"status": "error", "message": str(e)}, default=_json_default)
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
            response = json.dumps({"status": "error", "message": "Invalid multipart data - no boundary"}, default=_json_default)
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
            response = json.dumps({"status": "error", "message": "No file uploaded"}, default=_json_default)
            request_handler.wfile.write(response.encode())
            return
        
        if not filename:
            print("No filename found")
            request_handler._set_headers(400, 'application/json')
            response = json.dumps({"status": "error", "message": "No filename provided"}, default=_json_default)
            request_handler.wfile.write(response.encode())
            return
        
        # Validate file upload
        is_valid, errors = validate_file_upload(filename, file_data, ALLOWED_EXTENSIONS, MAX_FILE_SIZE)
        if not is_valid:
            print(f"File validation failed: {errors}")
            request_handler._set_headers(400, 'application/json')
            response = json.dumps({"status": "error", "message": errors[0]}, default=_json_default)
            request_handler.wfile.write(response.encode())
            return
        
        # Sanitize filename
        filename = sanitize_filename(filename)
        print(f"Sanitized filename: {filename}")
        
        user_id = form_data.get('user_id')
        category = form_data.get('specialization', 'General Mental Health')
        
        if not user_id:
            print("No user_id in form data")
            request_handler._set_headers(400, 'application/json')
            response = json.dumps({"status": "error", "message": "User ID required"}, default=_json_default)
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
        
        request_handler.wfile.write(json.dumps(result, default=_json_default).encode())
        
    except Exception as e:
        print(f"Exception in handle_submit_verification: {str(e)}")
        import traceback
        traceback.print_exc()
        request_handler._set_headers(500, 'application/json')
        response = json.dumps({"status": "error", "message": str(e)}, default=_json_default)
        request_handler.wfile.write(response.encode())

import json
import mimetypes
import os
from config import get_db_connection


def _json_default(value):
    """Fallback serializer for non-JSON types (e.g., datetime)."""
    return str(value)

def get_pending_verifications(request_handler):
    """Get all professionals pending verification"""
    
    connection = get_db_connection()
    if not connection:
        request_handler._set_headers(500, 'application/json')#if it fails to connect to the database sends error message
        response = json.dumps({"status": "error", "error": "Database connection failed"}, default=_json_default)
        request_handler.wfile.write(response.encode())
        return
    
    cursor = connection.cursor(dictionary=True)#creates a cursor to interact with the database
    
    try:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS VerificationDocuments (
                DocumentID INT AUTO_INCREMENT PRIMARY KEY,
                ProfessionalID INT NOT NULL,
                FilePath VARCHAR(500) NOT NULL,
                OriginalFileName VARCHAR(255) NOT NULL,
                UploadedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (ProfessionalID)
                    REFERENCES MentalHealthProfessionals(ProfessionalID)
            )
        """)

        query = """
        SELECT 
            p.ProfessionalID,
            p.FullName,
            p.Email,
            p.Category,
            p.VerificationStatus,
            vd.FilePath,
            vd.OriginalFileName,
            vd.UploadedAt as submission_date
        FROM MentalHealthProfessionals p
        JOIN (
            SELECT vd1.ProfessionalID, vd1.FilePath, vd1.OriginalFileName, vd1.UploadedAt
            FROM VerificationDocuments vd1
            JOIN (
                SELECT ProfessionalID, MAX(UploadedAt) as LatestUpload
                FROM VerificationDocuments
                GROUP BY ProfessionalID
            ) latest
            ON vd1.ProfessionalID = latest.ProfessionalID
            AND vd1.UploadedAt = latest.LatestUpload
        ) vd
        ON p.ProfessionalID = vd.ProfessionalID
        WHERE p.VerificationStatus = 'Pending'
        ORDER BY vd.UploadedAt DESC
        """
        cursor.execute(query)
        professionals = cursor.fetchall() #fetches all professionals with pending verification
        
        request_handler._set_headers(200, 'application/json')#sends a success response
        response = json.dumps({
            "status": "success",
            "pending_verifications": professionals
        }, default=_json_default)
        request_handler.wfile.write(response.encode())
        
    except Exception as e:#error handling
        request_handler._set_headers(500, 'application/json')
        response = json.dumps({"status": "error", "error": str(e)}, default=_json_default)
        request_handler.wfile.write(response.encode())
    finally:
        cursor.close()
        connection.close()#cleanup by closing cursor and connection

def get_verification_document(request_handler, professional_id):
    """Serve the latest verification document for a professional"""
    if not professional_id:
        request_handler._set_headers(400, 'application/json')
        response = json.dumps({"status": "error", "error": "Missing professional_id"}, default=_json_default)
        request_handler.wfile.write(response.encode())
        return

    connection = get_db_connection()
    if not connection:
        request_handler._set_headers(500, 'application/json')
        response = json.dumps({"status": "error", "error": "Database connection failed"}, default=_json_default)
        request_handler.wfile.write(response.encode())
        return

    cursor = connection.cursor(dictionary=True)

    try:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS VerificationDocuments (
                DocumentID INT AUTO_INCREMENT PRIMARY KEY,
                ProfessionalID INT NOT NULL,
                FilePath VARCHAR(500) NOT NULL,
                OriginalFileName VARCHAR(255) NOT NULL,
                UploadedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (ProfessionalID)
                    REFERENCES MentalHealthProfessionals(ProfessionalID)
            )
        """)

        query = """
        SELECT FilePath, OriginalFileName
        FROM VerificationDocuments
        WHERE ProfessionalID = %s
        ORDER BY UploadedAt DESC
        LIMIT 1
        """
        cursor.execute(query, (professional_id,))
        document = cursor.fetchone()

        if not document:
            request_handler._set_headers(404, 'application/json')
            response = json.dumps({"status": "error", "error": "Document not found"}, default=_json_default)
            request_handler.wfile.write(response.encode())
            return

        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
        file_path = os.path.abspath(os.path.join(base_dir, document['FilePath']))
        uploads_root = os.path.abspath(os.path.join(base_dir, 'uploads', 'verification_documents'))

        if not file_path.startswith(uploads_root) or not os.path.isfile(file_path):
            request_handler._set_headers(404, 'application/json')
            response = json.dumps({"status": "error", "error": "Document file missing"}, default=_json_default)
            request_handler.wfile.write(response.encode())
            return

        content_type, _ = mimetypes.guess_type(file_path)
        if content_type is None:
            content_type = 'application/octet-stream'

        request_handler.send_response(200)
        request_handler.send_header('Content-type', content_type)
        request_handler.send_header('Access-Control-Allow-Origin', '*')
        request_handler.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        request_handler.send_header('Access-Control-Allow-Headers', 'Content-Type')
        request_handler.send_header('Content-Disposition', f"inline; filename=\"{document['OriginalFileName']}\"")
        request_handler.end_headers()

        with open(file_path, 'rb') as f:
            request_handler.wfile.write(f.read())

    except Exception as e:
        request_handler._set_headers(500, 'application/json')
        response = json.dumps({"status": "error", "error": str(e)}, default=_json_default)
        request_handler.wfile.write(response.encode())
    finally:
        cursor.close()
        connection.close()

def verify_professional(request_handler, data):
    """Admin approves or rejects professional verification"""
    
    #to extract data from the request
    professional_id = data.get('professional_id')
    status = data.get('status')  #expected 'approved' or 'rejected'
    
    if not all([professional_id, status]):#ensures required fields are present
        request_handler._set_headers(400, 'application/json')
        response = json.dumps({"status": "error", "error": "Missing required fields"}, default=_json_default)
        request_handler.wfile.write(response.encode())
        return
    
    connection = get_db_connection()
    if not connection:
        request_handler._set_headers(500, 'application/json')
        response = json.dumps({"status": "error", "error": "Database connection failed"}, default=_json_default)
        request_handler.wfile.write(response.encode())
        return
    
    cursor = connection.cursor()
    
    try: #to decide new verfication status based on action
        new_status = 'Verified' if status == 'approved' else 'Rejected'
        
        query = """
        UPDATE MentalHealthProfessionals 
        SET VerificationStatus = %s
        WHERE ProfessionalID = %s
        """
        cursor.execute(query, (new_status, professional_id))
        connection.commit()
        
        request_handler._set_headers(200, 'application/json')#sends success response
        response = json.dumps({
            "status": "success",
            "message": f"Professional {status} successfully"
        }, default=_json_default)
        request_handler.wfile.write(response.encode())
        
    except Exception as e:
        #to undo changes if something goes wrong
        connection.rollback()
        request_handler._set_headers(500, 'application/json')
        response = json.dumps({"status": "error", "error": str(e)}, default=_json_default)
        request_handler.wfile.write(response.encode())
    finally:
        cursor.close()
        connection.close()

def get_all_users(request_handler):
    """Get all users for admin dashboard"""
    
    connection = get_db_connection()
    if not connection:
        request_handler._set_headers(500, 'application/json')
        response = json.dumps({"status": "error", "error": "Database connection failed"}, default=_json_default)
        request_handler.wfile.write(response.encode())
        return
    
    cursor = connection.cursor(dictionary=True)#returns rows as dictionaries
    
    try:
        # To get all students
        cursor.execute("""
            SELECT StudentID as id, FullName, Email, 'Student' as user_type, CreatedAt
            FROM Students
        """)
        students = cursor.fetchall()
        
        # To get all professionals
        cursor.execute("""
            SELECT ProfessionalID as id, FullName, Email, 'Professional' as user_type,
                   VerificationStatus, CreatedAt
            FROM MentalHealthProfessionals
            WHERE VerificationStatus = 'Verified'
        """)
        professionals = cursor.fetchall()
        
        # To combine results
        all_users = students + professionals
        
        request_handler._set_headers(200, 'application/json')
        response = json.dumps({
            "status": "success",
            "users": all_users
        }, default=_json_default)
        request_handler.wfile.write(response.encode())
        
    except Exception as e:
        request_handler._set_headers(500, 'application/json')
        response = json.dumps({"status": "error", "error": str(e)}, default=_json_default)
        request_handler.wfile.write(response.encode())
    finally:
        cursor.close()
        connection.close()
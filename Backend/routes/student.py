import json
from config import get_db_connection


def _json_default(value):
    """Fallback serializer for non-JSON types (e.g., datetime)."""
    return str(value)

def get_student_profile(request_handler, user_id):
    """Get student profile data"""
    connection = get_db_connection()
    if not connection:
        request_handler._set_headers(500, 'application/json')
        request_handler.wfile.write(json.dumps({"status": "error", "message": "Database connection failed"}).encode())
        return
    
    try:
        cursor = connection.cursor(dictionary=True)
        
        # Get student profile info
        cursor.execute(
            "SELECT StudentID, FullName, Email, CreatedAt FROM Students WHERE StudentID = %s",
            (user_id,)
        )
        student = cursor.fetchone()
        
        if not student:
            request_handler._set_headers(404, 'application/json')
            request_handler.wfile.write(json.dumps({"status": "error", "message": "Student not found"}).encode())
            return
        
        # Get all verified professionals with session count
        cursor.execute("""
            SELECT 
                mhp.ProfessionalID,
                mhp.FullName,
                mhp.Category,
                COUNT(sa.AppointmentID) as session_count
            FROM MentalHealthProfessionals mhp
            LEFT JOIN SessionAppointments sa ON mhp.ProfessionalID = sa.ProfessionalID AND sa.StudentID = %s
            WHERE mhp.VerificationStatus = 'Verified'
            GROUP BY mhp.ProfessionalID
            ORDER BY mhp.FullName
        """, (user_id,))
        professionals = cursor.fetchall()
        
        # Get reviews/ratings left by student
        cursor.execute("""
            SELECT 
                fr.FeedbackID,
                fr.ProfessionalID,
                mhp.FullName,
                fr.Rating,
                fr.FeedbackText
            FROM FeedbackRatings fr
            JOIN MentalHealthProfessionals mhp ON fr.ProfessionalID = mhp.ProfessionalID
            WHERE fr.StudentID = %s
            ORDER BY fr.FeedbackID DESC
        """, (user_id,))
        reviews = cursor.fetchall()
        
        request_handler._set_headers(200, 'application/json')
        response = json.dumps({
            "status": "success",
            "data": {
                "profile": student,
                "professionals": professionals,
                "reviews": reviews
            }
        }, default=_json_default)
        request_handler.wfile.write(response.encode())
        
    except Exception as e:
        request_handler._set_headers(500, 'application/json')
        request_handler.wfile.write(json.dumps({"status": "error", "message": str(e)}, default=_json_default).encode())
    finally:
        cursor.close()
        connection.close()


def get_student_messages(request_handler, user_id):
    """Get all conversations for a student"""
    connection = get_db_connection()
    if not connection:
        request_handler._set_headers(500, 'application/json')
        request_handler.wfile.write(json.dumps({"status": "error", "message": "Database connection failed"}).encode())
        return
    
    try:
        cursor = connection.cursor(dictionary=True)
        
        # Get unique professionals student has messaged
        cursor.execute("""
            SELECT DISTINCT
                mhp.ProfessionalID,
                mhp.FullName,
                MAX(m.SentAt) as last_message_time
            FROM Messages m
            JOIN MentalHealthProfessionals mhp ON m.ProfessionalID = mhp.ProfessionalID
            WHERE m.StudentID = %s
            GROUP BY mhp.ProfessionalID
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


def get_student_sessions(request_handler, user_id):
    """Get all sessions/appointments for a student"""
    connection = get_db_connection()
    if not connection:
        request_handler._set_headers(500, 'application/json')
        request_handler.wfile.write(json.dumps({"status": "error", "message": "Database connection failed"}).encode())
        return
    
    try:
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT 
                sa.AppointmentID,
                sa.SessionDate,
                mhp.ProfessionalID,
                mhp.FullName,
                mhp.Category,
                ps.TimeSlot
            FROM SessionAppointments sa
            JOIN MentalHealthProfessionals mhp ON sa.ProfessionalID = mhp.ProfessionalID
            JOIN ProfessionalSchedule ps ON sa.ScheduleID = ps.ScheduleID
            WHERE sa.StudentID = %s
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


def add_student_review(request_handler, data):
    student_id = data.get('student_id') or data.get('user_id')
    professional_id = data.get('professional_id')
    rating = data.get('rating')
    feedback_text = data.get('feedback_text', '')

    if not student_id or not professional_id or rating is None:
        request_handler._set_headers(400, 'application/json')
        request_handler.wfile.write(json.dumps({"status": "error", "message": "Missing required fields"}).encode())
        return

    try:
        rating_value = int(rating)
    except (TypeError, ValueError):
        request_handler._set_headers(400, 'application/json')
        request_handler.wfile.write(json.dumps({"status": "error", "message": "Invalid rating"}).encode())
        return

    if rating_value < 1 or rating_value > 5:
        request_handler._set_headers(400, 'application/json')
        request_handler.wfile.write(json.dumps({"status": "error", "message": "Rating must be between 1 and 5"}).encode())
        return

    connection = get_db_connection()
    if not connection:
        request_handler._set_headers(500, 'application/json')
        request_handler.wfile.write(json.dumps({"status": "error", "message": "Database connection failed"}).encode())
        return

    try:
        cursor = connection.cursor(dictionary=True)
        
        # Verify that the student has had at least one session with this professional
        cursor.execute("""
            SELECT COUNT(AppointmentID) as session_count
            FROM SessionAppointments
            WHERE StudentID = %s AND ProfessionalID = %s
        """, (student_id, professional_id))
        
        result = cursor.fetchone()
        if not result or result['session_count'] == 0:
            request_handler._set_headers(403, 'application/json')
            request_handler.wfile.write(json.dumps({"status": "error", "message": "You can only review professionals you have had sessions with"}).encode())
            return
        
        # Proceed with insertion
        cursor.execute("""
            INSERT INTO FeedbackRatings (StudentID, ProfessionalID, Rating, FeedbackText)
            VALUES (%s, %s, %s, %s)
        """, (student_id, professional_id, rating_value, feedback_text))
        connection.commit()

        request_handler._set_headers(200, 'application/json')
        request_handler.wfile.write(json.dumps({"status": "success"}).encode())
    except Exception as e:
        connection.rollback()
        request_handler._set_headers(500, 'application/json')
        request_handler.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode())
    finally:
        cursor.close()
        connection.close()

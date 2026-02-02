import json
from config import get_db_connection

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
        
        # Get professionals the student has sessions with
        cursor.execute("""
            SELECT DISTINCT 
                mhp.ProfessionalID,
                mhp.FullName,
                mhp.Category,
                COUNT(sa.AppointmentID) as session_count
            FROM MentalHealthProfessionals mhp
            LEFT JOIN SessionAppointments sa ON mhp.ProfessionalID = sa.ProfessionalID
            WHERE sa.StudentID = %s
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
        })
        request_handler.wfile.write(response.encode())
        
    except Exception as e:
        request_handler._set_headers(500, 'application/json')
        request_handler.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode())
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
        })
        request_handler.wfile.write(response.encode())
        
    except Exception as e:
        request_handler._set_headers(500, 'application/json')
        request_handler.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode())
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
        })
        request_handler.wfile.write(response.encode())
        
    except Exception as e:
        request_handler._set_headers(500, 'application/json')
        request_handler.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode())
    finally:
        cursor.close()
        connection.close()

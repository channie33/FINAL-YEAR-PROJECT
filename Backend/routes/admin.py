import json
from config import get_db_connection

def get_pending_verifications(request_handler):
    """Get all professionals pending verification"""
    
    connection = get_db_connection()
    if not connection:
        request_handler._set_headers(500, 'application/json')#if it fails to connect to the database sends error message
        response = json.dumps({"status": "error", "message": "Database connection failed"})
        request_handler.wfile.write(response.encode())
        return
    
    cursor = connection.cursor(dictionary=True)#creates a cursor to interact with the database
    
    try:
        query = """
        SELECT 
            ProfessionalID,
            FullName,
            Email,
            Category,
            VerificationStatus,
            CreatedAt
        FROM MentalHealthProfessionals
        WHERE VerificationStatus = 'Pending'
        ORDER BY CreatedAt DESC
        """
        cursor.execute(query)
        professionals = cursor.fetchall() #fetches all professionals with pending verification
        
        request_handler._set_headers(200, 'application/json')#sends a success response
        response = json.dumps({
            "status": "success",
            "data": professionals
        })
        request_handler.wfile.write(response.encode())
        
    except Exception as e:#error handling
        request_handler._set_headers(500, 'application/json')
        response = json.dumps({"status": "error", "message": str(e)})
        request_handler.wfile.write(response.encode())
    finally:
        cursor.close()
        connection.close()#cleanup by closing cursor and connection

def verify_professional(request_handler, data):
    """Admin approves or rejects professional verification"""
    
    #to extract data from the request
    professional_id = data.get('professional_id')
    action = data.get('action')  #expected 'approve' or 'reject'
    
    if not all([professional_id, action]):#ensures required fields are present
        request_handler._set_headers(400, 'application/json')
        response = json.dumps({"status": "error", "message": "Missing required fields"})
        request_handler.wfile.write(response.encode())
        return
    
    connection = get_db_connection()
    if not connection:
        request_handler._set_headers(500, 'application/json')
        response = json.dumps({"status": "error", "message": "Database connection failed"})
        request_handler.wfile.write(response.encode())
        return
    
    cursor = connection.cursor()
    
    try: #to decide new verfication status based on action
        new_status = 'Verified' if action == 'approve' else 'Rejected'
        
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
            "message": f"Professional {action}d successfully"
        })
        request_handler.wfile.write(response.encode())
        
    except Exception as e:
        #to undo changes if something goes wrong
        connection.rollback()
        request_handler._set_headers(500, 'application/json')
        response = json.dumps({"status": "error", "message": str(e)})
        request_handler.wfile.write(response.encode())
    finally:
        cursor.close()
        connection.close()

def get_all_users(request_handler):
    """Get all users for admin dashboard"""
    
    connection = get_db_connection()
    if not connection:
        request_handler._set_headers(500, 'application/json')
        response = json.dumps({"status": "error", "message": "Database connection failed"})
        request_handler.wfile.write(response.encode())
        return
    
    cursor = connection.cursor(dictionary=True)#returns rows as dictionaries
    
    try:
        # To get all students
        cursor.execute("""
            SELECT StudentID as id, FullName, Email, 'Student' as UserType, CreatedAt
            FROM Students
        """)
        students = cursor.fetchall()
        
        # To get all professionals
        cursor.execute("""
            SELECT ProfessionalID as id, FullName, Email, 'Professional' as UserType, 
                   VerificationStatus, CreatedAt
            FROM MentalHealthProfessionals
        """)
        professionals = cursor.fetchall()
        
        # To combine results
        all_users = students + professionals
        
        request_handler._set_headers(200, 'application/json')
        response = json.dumps({
            "status": "success",
            "data": all_users
        })
        request_handler.wfile.write(response.encode())
        
    except Exception as e:
        request_handler._set_headers(500, 'application/json')
        response = json.dumps({"status": "error", "message": str(e)})
        request_handler.wfile.write(response.encode())
    finally:
        cursor.close()
        connection.close()
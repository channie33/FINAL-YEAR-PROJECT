import json
from config import get_db_connection #creates and returns a database connection

def test_database(request_handler):
    """Test database connection"""
    #attempt to get a database connection
    connection = get_db_connection()
    if connection:
        connection.close()
        request_handler._set_headers(200, 'application/json') #http status 200 means ok
        response = json.dumps({"status": "success", "message": "Database connected successfully!"})
    else:
        request_handler._set_headers(500, 'application/json')#http status 500 means internal server error
        response = json.dumps({"status": "error", "message": "Database connection failed"})
    
    #sends response back to client
    request_handler.wfile.write(response.encode())
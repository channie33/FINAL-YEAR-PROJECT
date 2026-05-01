import mysql.connector
from dotenv import load_dotenv
import os

load_dotenv()

# Database Configuration
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_USER = os.getenv('DB_USER', 'root')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'ROOT')
DB_NAME = os.getenv('DB_NAME', 'Better_Space')
DB_PORT = int(os.getenv('DB_PORT', 3306))

# Security Configuration
SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key-change-this-in-production')
ALLOWED_ORIGIN = os.getenv('ALLOWED_ORIGIN', 'https://localhost:8443')

# File Upload Configuration
MAX_FILE_SIZE = int(os.getenv('MAX_FILE_SIZE', 5242880))  # 5MB
ALLOWED_EXTENSIONS = os.getenv('ALLOWED_EXTENSIONS', 'pdf,jpg,jpeg,png').split(',')

def get_db_connection():
    """Create and return a database connection"""
    try:
        connection = mysql.connector.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME,
            port=DB_PORT
        )
        return connection
    except mysql.connector.Error as e:
        print(f"Database connection error: {e}")
        return None
import mysql.connector
from dotenv import load_dotenv
import os

load_dotenv()

def initialize_database():
    # To read the schema file
    with open('database/schema.sql', 'r', encoding='utf-8') as file:
        sql_script = file.read()
    
    # To connect to MySQL server 
    try:
        connection = mysql.connector.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASSWORD', 'ROOT'),
            port=int(os.getenv('DB_PORT', 3306))
        )
        
        cursor = connection.cursor()
        
        # To execute every statement
        for statement in sql_script.split(';'):
            statement = statement.strip()
            if statement:
                try:
                    cursor.execute(statement)
                    print(f"Executed: {statement[:50]}...")
                except Exception as e:
                    print(f"Error: {e}")
        
        connection.commit()
        cursor.close()
        connection.close()
        print("\n✓ Database initialized successfully!")
        
    except mysql.connector.Error as e:
        print(f"MySQL Error: {e}")

if __name__ == "__main__":
    initialize_database()
from config import get_db_connection

def main():
    conn = get_db_connection()
    if not conn:
        print('DB_CONNECTION: FAILED')
        return
    try:
        cur = conn.cursor()
        cur.execute('SELECT 1')#used to test the connection
        print('DB_CONNECTION: OK, SELECT 1 ->', cur.fetchone())
    except Exception as e:
        print('DB_QUERY_ERROR:', e)
    finally:
        conn.close()

if __name__ == '__main__':#used to run the test when this file is executed directly
    main()

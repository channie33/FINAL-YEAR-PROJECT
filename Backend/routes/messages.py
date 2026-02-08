import json
from config import get_db_connection


def _json_default(value):
	"""Fallback serializer for non-JSON types (e.g., datetime)."""
	return str(value)


def _ensure_admin_schema(cursor):
	cursor.execute("""
		CREATE TABLE IF NOT EXISTS Admins (
			AdminID INT AUTO_INCREMENT PRIMARY KEY,
			Username VARCHAR(50) NOT NULL UNIQUE,
			Email VARCHAR(100) NOT NULL UNIQUE,
			Password VARCHAR(250) NOT NULL,
			CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
		)
	""")
	try:
		cursor.execute("ALTER TABLE Admins ADD COLUMN Username VARCHAR(50) UNIQUE")
	except Exception:
		pass


def _ensure_admin_messages_table(cursor):
	cursor.execute("""
		CREATE TABLE IF NOT EXISTS AdminMessages (
			AdminMessageID INT AUTO_INCREMENT PRIMARY KEY,
			AdminID INT NOT NULL,
			StudentID INT NULL,
			ProfessionalID INT NULL,
			MessageText TEXT NOT NULL,
			SentAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			Sender ENUM('Student', 'Professional', 'Admin') NOT NULL,
			FOREIGN KEY (AdminID) REFERENCES Admins(AdminID),
			FOREIGN KEY (StudentID) REFERENCES Students(StudentID),
			FOREIGN KEY (ProfessionalID) REFERENCES MentalHealthProfessionals(ProfessionalID)
		)
	""")


def _get_or_create_admin_id(cursor, admin_username):
	_ensure_admin_schema(cursor)
	cursor.execute(
		"SELECT AdminID FROM Admins WHERE Username = %s",
		(admin_username,)
	)
	row = cursor.fetchone()
	if row:
		return row.get('AdminID') if isinstance(row, dict) else row[0]

	default_email = f"{admin_username}@local"
	default_password = "admin123"
	cursor.execute(
		"INSERT INTO Admins (Username, Email, Password) VALUES (%s, %s, %s)",
		(admin_username, default_email, default_password)
	)
	return cursor.lastrowid


def get_student_admin_messages(request_handler, student_id, admin_username):
	connection = get_db_connection()
	if not connection:
		request_handler._set_headers(500, 'application/json')
		request_handler.wfile.write(json.dumps({"status": "error", "message": "Database connection failed"}).encode())
		return

	try:
		cursor = connection.cursor(dictionary=True)
		_ensure_admin_messages_table(cursor)
		admin_id = _get_or_create_admin_id(cursor, admin_username)

		cursor.execute("""
			SELECT MessageText, SentAt, Sender
			FROM AdminMessages
			WHERE StudentID = %s AND AdminID = %s
			ORDER BY SentAt ASC
		""", (student_id, admin_id))
		messages = cursor.fetchall()

		last_message_time = messages[-1]['SentAt'] if messages else None

		request_handler._set_headers(200, 'application/json')
		response = json.dumps({
			"status": "success",
			"data": {
				"messages": messages,
				"last_message_time": last_message_time
			}
		}, default=_json_default)
		request_handler.wfile.write(response.encode())
	except Exception as e:
		request_handler._set_headers(500, 'application/json')
		request_handler.wfile.write(json.dumps({"status": "error", "message": str(e)}, default=_json_default).encode())
	finally:
		cursor.close()
		connection.close()


def get_professional_admin_messages(request_handler, professional_id, admin_username):
	connection = get_db_connection()
	if not connection:
		request_handler._set_headers(500, 'application/json')
		request_handler.wfile.write(json.dumps({"status": "error", "message": "Database connection failed"}).encode())
		return

	try:
		cursor = connection.cursor(dictionary=True)
		_ensure_admin_messages_table(cursor)
		admin_id = _get_or_create_admin_id(cursor, admin_username)

		cursor.execute("""
			SELECT MessageText, SentAt, Sender
			FROM AdminMessages
			WHERE ProfessionalID = %s AND AdminID = %s
			ORDER BY SentAt ASC
		""", (professional_id, admin_id))
		messages = cursor.fetchall()

		last_message_time = messages[-1]['SentAt'] if messages else None

		request_handler._set_headers(200, 'application/json')
		response = json.dumps({
			"status": "success",
			"data": {
				"messages": messages,
				"last_message_time": last_message_time
			}
		}, default=_json_default)
		request_handler.wfile.write(response.encode())
	except Exception as e:
		request_handler._set_headers(500, 'application/json')
		request_handler.wfile.write(json.dumps({"status": "error", "message": str(e)}, default=_json_default).encode())
	finally:
		cursor.close()
		connection.close()


def get_admin_messages(request_handler, admin_username, limit=50):
	connection = get_db_connection()
	if not connection:
		request_handler._set_headers(500, 'application/json')
		request_handler.wfile.write(json.dumps({"status": "error", "message": "Database connection failed"}).encode())
		return

	try:
		cursor = connection.cursor(dictionary=True)
		_ensure_admin_messages_table(cursor)
		admin_id = _get_or_create_admin_id(cursor, admin_username)

		cursor.execute("""
			SELECT
				am.StudentID,
				am.ProfessionalID,
				am.MessageText,
				am.SentAt,
				am.Sender,
				s.FullName AS StudentName,
				p.FullName AS ProfessionalName,
				CASE
					WHEN am.Sender = 'Student' THEN CONCAT('Student: ', s.FullName)
					WHEN am.Sender = 'Professional' THEN CONCAT('Professional: ', p.FullName)
					ELSE 'Admin'
				END AS sender_label
			FROM AdminMessages am
			LEFT JOIN Students s ON am.StudentID = s.StudentID
			LEFT JOIN MentalHealthProfessionals p ON am.ProfessionalID = p.ProfessionalID
			WHERE am.AdminID = %s
			ORDER BY am.SentAt DESC
			LIMIT %s
		""", (admin_id, limit))
		messages = cursor.fetchall()

		request_handler._set_headers(200, 'application/json')
		response = json.dumps({
			"status": "success",
			"data": messages
		}, default=_json_default)
		request_handler.wfile.write(response.encode())
	except Exception as e:
		request_handler._set_headers(500, 'application/json')
		request_handler.wfile.write(json.dumps({"status": "error", "message": str(e)}, default=_json_default).encode())
	finally:
		cursor.close()
		connection.close()


def send_admin_message(request_handler, data):
	admin_username = data.get('admin_username') or 'admin'
	target_type = data.get('target_type')
	target_id = data.get('target_id')
	message_text = data.get('message_text')

	if not target_type or not target_id or not message_text:
		request_handler._set_headers(400, 'application/json')
		request_handler.wfile.write(json.dumps({"status": "error", "message": "Missing target_type, target_id, or message_text"}).encode())
		return

	connection = get_db_connection()
	if not connection:
		request_handler._set_headers(500, 'application/json')
		request_handler.wfile.write(json.dumps({"status": "error", "message": "Database connection failed"}).encode())
		return

	try:
		cursor = connection.cursor(dictionary=True)
		_ensure_admin_messages_table(cursor)
		admin_id = _get_or_create_admin_id(cursor, admin_username)

		if target_type == 'student':
			cursor.execute("""
				INSERT INTO AdminMessages (AdminID, StudentID, MessageText, Sender)
				VALUES (%s, %s, %s, 'Admin')
			""", (admin_id, target_id, message_text))
		elif target_type == 'professional':
			cursor.execute("""
				INSERT INTO AdminMessages (AdminID, ProfessionalID, MessageText, Sender)
				VALUES (%s, %s, %s, 'Admin')
			""", (admin_id, target_id, message_text))
		else:
			request_handler._set_headers(400, 'application/json')
			request_handler.wfile.write(json.dumps({"status": "error", "message": "Invalid target_type"}).encode())
			return

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


def send_student_admin_message(request_handler, data):
	student_id = data.get('student_id') or data.get('user_id')
	admin_username = data.get('admin_username') or 'admin'
	message_text = data.get('message_text')

	if not student_id or not message_text:
		request_handler._set_headers(400, 'application/json')
		request_handler.wfile.write(json.dumps({"status": "error", "message": "Missing student_id or message_text"}).encode())
		return

	connection = get_db_connection()
	if not connection:
		request_handler._set_headers(500, 'application/json')
		request_handler.wfile.write(json.dumps({"status": "error", "message": "Database connection failed"}).encode())
		return

	try:
		cursor = connection.cursor(dictionary=True)
		_ensure_admin_messages_table(cursor)
		admin_id = _get_or_create_admin_id(cursor, admin_username)

		cursor.execute("""
			INSERT INTO AdminMessages (AdminID, StudentID, MessageText, Sender)
			VALUES (%s, %s, %s, 'Student')
		""", (admin_id, student_id, message_text))
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


def send_professional_admin_message(request_handler, data):
	professional_id = data.get('professional_id') or data.get('user_id')
	admin_username = data.get('admin_username') or 'admin'
	message_text = data.get('message_text')

	if not professional_id or not message_text:
		request_handler._set_headers(400, 'application/json')
		request_handler.wfile.write(json.dumps({"status": "error", "message": "Missing professional_id or message_text"}).encode())
		return

	connection = get_db_connection()
	if not connection:
		request_handler._set_headers(500, 'application/json')
		request_handler.wfile.write(json.dumps({"status": "error", "message": "Database connection failed"}).encode())
		return

	try:
		cursor = connection.cursor(dictionary=True)
		_ensure_admin_messages_table(cursor)
		admin_id = _get_or_create_admin_id(cursor, admin_username)

		cursor.execute("""
			INSERT INTO AdminMessages (AdminID, ProfessionalID, MessageText, Sender)
			VALUES (%s, %s, %s, 'Professional')
		""", (admin_id, professional_id, message_text))
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


def get_conversation(request_handler, student_id, professional_id):
	connection = get_db_connection()
	if not connection:
		request_handler._set_headers(500, 'application/json')
		request_handler.wfile.write(json.dumps({"status": "error", "message": "Database connection failed"}).encode())
		return

	try:
		cursor = connection.cursor(dictionary=True)
		cursor.execute("""
			SELECT MessageID, StudentID, ProfessionalID, MessageText, SentAt, Sender
			FROM Messages
			WHERE StudentID = %s AND ProfessionalID = %s
			ORDER BY SentAt ASC
		""", (student_id, professional_id))
		messages = cursor.fetchall()

		request_handler._set_headers(200, 'application/json')
		response = json.dumps({
			"status": "success",
			"data": messages
		}, default=_json_default)
		request_handler.wfile.write(response.encode())
	except Exception as e:
		request_handler._set_headers(500, 'application/json')
		request_handler.wfile.write(json.dumps({"status": "error", "message": str(e)}, default=_json_default).encode())
	finally:
		cursor.close()
		connection.close()


def send_message(request_handler, data):
	student_id = data.get('student_id')
	professional_id = data.get('professional_id')
	sender = data.get('sender')
	message_text = data.get('message_text')

	if not student_id or not professional_id or not sender or not message_text:
		request_handler._set_headers(400, 'application/json')
		request_handler.wfile.write(json.dumps({"status": "error", "message": "Missing required fields"}).encode())
		return

	if sender not in ['Student', 'Professional']:
		request_handler._set_headers(400, 'application/json')
		request_handler.wfile.write(json.dumps({"status": "error", "message": "Invalid sender"}).encode())
		return

	connection = get_db_connection()
	if not connection:
		request_handler._set_headers(500, 'application/json')
		request_handler.wfile.write(json.dumps({"status": "error", "message": "Database connection failed"}).encode())
		return

	try:
		cursor = connection.cursor()
		cursor.execute("""
			INSERT INTO Messages (StudentID, ProfessionalID, MessageText, Sender)
			VALUES (%s, %s, %s, %s)
		""", (student_id, professional_id, message_text, sender))
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

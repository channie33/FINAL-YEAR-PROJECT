import json
from config import get_db_connection


def _json_default(value):
	return str(value)


def get_slots(request_handler, professional_id, date_str):
	connection = get_db_connection()
	if not connection:
		request_handler._set_headers(500, 'application/json')
		request_handler.wfile.write(json.dumps({"status": "error", "message": "Database connection failed"}).encode())
		return

	try:
		cursor = connection.cursor(dictionary=True)
		cursor.execute("""
			SELECT TimeSlot, Status
			FROM ProfessionalSchedule
			WHERE ProfessionalID = %s AND AvailableDate = %s
		""", (professional_id, date_str))
		rows = cursor.fetchall()

		status_map = {row['TimeSlot']: row['Status'] for row in rows}
		times = ['09:00', '13:00', '16:00']
		slots = []
		for time in times:
			booked = status_map.get(time) == 'Booked'
			slots.append({"time": time, "booked": booked})

		request_handler._set_headers(200, 'application/json')
		request_handler.wfile.write(json.dumps({"status": "success", "slots": slots}, default=_json_default).encode())
	except Exception as e:
		request_handler._set_headers(500, 'application/json')
		request_handler.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode())
	finally:
		cursor.close()
		connection.close()


def book_session(request_handler, data):
	student_id = data.get('student_id')
	professional_id = data.get('professional_id')
	date_str = data.get('date')
	time_str = data.get('time')

	if not student_id or not professional_id or not date_str or not time_str:
		request_handler._set_headers(400, 'application/json')
		request_handler.wfile.write(json.dumps({"status": "error", "message": "Missing required fields"}).encode())
		return

	connection = get_db_connection()
	if not connection:
		request_handler._set_headers(500, 'application/json')
		request_handler.wfile.write(json.dumps({"status": "error", "message": "Database connection failed"}).encode())
		return

	try:
		cursor = connection.cursor(dictionary=True)
		cursor.execute("""
			SELECT ScheduleID, Status
			FROM ProfessionalSchedule
			WHERE ProfessionalID = %s AND AvailableDate = %s AND TimeSlot = %s
			LIMIT 1
		""", (professional_id, date_str, time_str))
		schedule = cursor.fetchone()

		if schedule and schedule['Status'] == 'Booked':
			request_handler._set_headers(409, 'application/json')
			request_handler.wfile.write(json.dumps({"status": "error", "message": "Slot already booked"}).encode())
			return

		if schedule:
			schedule_id = schedule['ScheduleID']
			cursor.execute("""
				UPDATE ProfessionalSchedule
				SET Status = 'Booked'
				WHERE ScheduleID = %s
			""", (schedule_id,))
		else:
			cursor.execute("""
				INSERT INTO ProfessionalSchedule (ProfessionalID, AvailableDate, TimeSlot, Status)
				VALUES (%s, %s, %s, 'Booked')
			""", (professional_id, date_str, time_str))
			schedule_id = cursor.lastrowid

		cursor.execute("""
			INSERT INTO SessionAppointments (ScheduleID, StudentID, ProfessionalID, SessionDate)
			VALUES (%s, %s, %s, CONCAT(%s, ' ', %s, ':00'))
		""", (schedule_id, student_id, professional_id, date_str, time_str))

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

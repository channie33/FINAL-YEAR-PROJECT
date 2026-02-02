
The database is called Better_Space. Initialization is in `Database/init_db.py` and the schema is `Database/schema.sql`.

Original files coordinating the app: `Backend/app.py`, `Backend/routes/request_handler.py`, `Backend/routes/api.py`, `Backend/routes/auth.py`, and `Backend/config.py`.

Recent edits and what they do
- `Backend/app.py` — now reads `PORT` from environment and defaults to `8080`. This aligns the backend port with the frontend/launch configuration so the browser can reach the server.
- `Backend/routes/request_handler.py` — updated to correctly resolve and serve static frontend files from the `Frontend` folder. Specifically:
  - Serves `Frontend/assets/pages/shared/index.html` when requesting `/`.
  - Maps `/pages/...` to `Frontend/assets/pages/...` and `/assets/...` to `Frontend/assets/...`.
  - Normalizes file paths and prevents serving files outside the `Frontend` directory.
- `run.ps1` — helper script to start the backend; it sets `PORT` and runs `app.py` using the venv Python.






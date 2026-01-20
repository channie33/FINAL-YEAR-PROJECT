from http.server import HTTPServer #used to create the HTTP server
from routes.request_handler import RequestHandler #importing our custom request handler
import os #import os to access environment variables

def run_server(port=None):
    # Prefer the explicit port argument, then the PORT env var, then default 8000
    env_port = os.getenv('PORT')
    if port is None:
        try:
            # default to 8080 to match frontend/launch expectations
            port = int(env_port) if env_port is not None else 8080
        except ValueError:
            port = 8080

    server_address = ('', port)
    httpd = HTTPServer(server_address, RequestHandler)
    print(f'Server running on http://localhost:{port}')
    print('Press Ctrl+C to stop the server')
    httpd.serve_forever()

if __name__ == '__main__':#starts the server if this file is run directly
    run_server()
from http.server import ThreadingHTTPServer #used to create the HTTP server
from routes.request_handler import RequestHandler #importing our custom request handler
import os #import os to access environment variables
import ssl #for HTTPS support

def run_server(port=None):
    # Prefer the explicit port argument, then the PORT env var, then default 8443
    env_port = os.getenv('PORT')
    if port is None:
        try:
            port = int(env_port) if env_port is not None else 8443
        except ValueError:
            port = 8443

    # Locate SSL certificate and key (stored in Backend/certs/)
    base_dir = os.path.dirname(os.path.abspath(__file__))
    cert_file = os.path.join(base_dir, 'certs', 'cert.pem')
    key_file = os.path.join(base_dir, 'certs', 'key.pem')

    server_address = ('', port)
    # Threaded server lets the browser fetch multiple assets in parallel.
    httpd = ThreadingHTTPServer(server_address, RequestHandler)

    # Optimize SSL context with session caching and modern TLS settings
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    context.load_cert_chain(certfile=cert_file, keyfile=key_file)
    
    # Set modern TLS versions (1.2+) for better performance
    context.minimum_version = ssl.TLSVersion.TLSv1_2
    context.maximum_version = ssl.TLSVersion.TLSv1_3
    
    # Use faster cipher suites
    context.set_ciphers('ECDHE+AESGCM:ECDHE+CHACHA20:DHE+AESGCM:DHE+CHACHA20:!aNULL:!MD5:!DSS')
    
    # Keep session tickets enabled for faster TLS resumption.
    if hasattr(ssl, 'OP_NO_TICKET'):
        context.options &= ~ssl.OP_NO_TICKET
    
    httpd.socket = context.wrap_socket(httpd.socket, server_side=True)

    print(f'Server running on https://localhost:{port}')
    print('Press Ctrl+C to stop the server')
    httpd.serve_forever()

if __name__ == '__main__':#starts the server if this file is run directly
    run_server()
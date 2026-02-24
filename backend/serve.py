import os
from waitress import serve
from app import create_app
import socket

# Create the application instance
app = create_app(os.getenv('FLASK_ENV', 'production'))

def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # doesn't even have to be reachable
        s.connect(('10.255.255.255', 1))
        IP = s.getsockname()[0]
    except Exception:
        IP = '127.0.0.1'
    finally:
        s.close()
    return IP

if __name__ == '__main__':
    host = os.getenv('SERVER_HOST', '0.0.0.0')
    port = int(os.getenv('SERVER_PORT', 5000))
    
    # Threads: 4-6 threads per core is a good starting point for I/O bound apps
    # We'll default to 6 threads if not specified
    threads = int(os.getenv('WAITRESS_THREADS', 6))
    
    local_ip = get_local_ip()
    print(f"\n{'='*50}")
    print(f" PRODUCTION SERVER STARTED")
    print(f"{'='*50}")
    print(f" Local Access:   http://localhost:{port}")
    print(f" Network Access: http://{local_ip}:{port}")
    print(f" Threads:        {threads}")
    print(f"{'='*50}\n")
    
    serve(app, host=host, port=port, threads=threads)

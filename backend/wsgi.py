import os
import sys

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(__file__))

from app import create_app

# The global application object used by WSGI servers like Gunicorn or Waitress
app = create_app('production')

if __name__ == "__main__":
    app.run()

import sys
import os
import json

# Add the backend directory to the Python path
# From netlify/functions/api.py, go up two levels to repo root, then to backend
BACKEND_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "backend")
)
if BACKEND_PATH not in sys.path:
    sys.path.insert(0, BACKEND_PATH)

# Import the Flask app from app.py
from app import app as flask_app

# Import serverless-wsgi handler
from serverless_wsgi import handle_request

# This is the Netlify function handler
def handler(event, context):
    """Netlify Function handler for Flask app"""
    try:
        # Convert the Netlify event to a WSGI environment
        return handle_request(flask_app, event, context)
    except Exception as e:
        # Return error response if something goes wrong
        import traceback
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': str(e),
                'message': 'Internal server error',
                'traceback': traceback.format_exc()
            })
        }


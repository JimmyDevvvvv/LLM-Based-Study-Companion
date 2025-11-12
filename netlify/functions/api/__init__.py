from flask import Flask, request, jsonify
import sys
import os

# Add the backend directory to the Python path
BACKEND_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "..", "backend")
)
if BACKEND_PATH not in sys.path:
    sys.path.insert(0, BACKEND_PATH)

# Import the Flask app from app.py
from app import app as flask_app

# This is the Netlify function handler
def handler(event, context):
    # Convert the API Gateway event to a WSGI environment
    from serverless_wsgi import handle_request
    return handle_request(flask_app, event, context)

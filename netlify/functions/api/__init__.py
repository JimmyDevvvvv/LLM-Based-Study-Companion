from flask import Flask, request, jsonify
import sys
import os

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'backend'))

# Import the Flask app from app.py
from app import app as flask_app

# This is the Netlify function handler
def handler(event, context):
    # Convert the API Gateway event to a WSGI environment
    from serverless_wsgi import handle_request
    return handle_request(flask_app, event, context)

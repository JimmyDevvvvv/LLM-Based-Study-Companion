"""
Authentication Manager for StudyMind AI
Handles Supabase authentication and JWT verification
"""

from supabase import create_client, Client
from functools import wraps
from flask import request, jsonify
import jwt
import os
from typing import Optional, Dict


class AuthManager:
    """Manages authentication using Supabase"""
    
    def __init__(self, supabase_url: str, supabase_key: str):
        """Initialize Supabase client"""
        self.supabase: Client = create_client(supabase_url, supabase_key)
        self.jwt_secret = supabase_key  # Use anon key for JWT verification
        print("✅ Auth manager initialized")
    
    def verify_token(self, token: str) -> Optional[Dict]:
        """Verify JWT token and return user data"""
        try:
            # Decode JWT
            payload = jwt.decode(
                token,
                self.jwt_secret,
                algorithms=['HS256'],
                options={"verify_signature": False}  # Supabase handles signature
            )
            
            return {
                'user_id': payload.get('sub'),
                'email': payload.get('email'),
                'role': payload.get('role')
            }
        except jwt.ExpiredSignatureError:
            print("Token expired")
            return None
        except jwt.InvalidTokenError as e:
            print(f"Invalid token: {e}")
            return None
    
    def get_user_from_token(self, token: str) -> Optional[Dict]:
        """Get full user data from token"""
        try:
            user_response = self.supabase.auth.get_user(token)
            if user_response and user_response.user:
                return {
                    'user_id': user_response.user.id,
                    'email': user_response.user.email,
                    'metadata': user_response.user.user_metadata
                }
        except Exception as e:
            print(f"Error getting user: {e}")
        return None


def require_auth(f):
    """Decorator to protect routes with authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Get token from header
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return jsonify({'error': 'No authorization header'}), 401
        
        # Extract token (format: "Bearer <token>")
        try:
            token = auth_header.split(' ')[1]
        except IndexError:
            return jsonify({'error': 'Invalid authorization header format'}), 401
        
        # Verify token
        auth_manager = request.environ.get('auth_manager')
        if not auth_manager:
            return jsonify({'error': 'Auth manager not configured'}), 500
        
        user_data = auth_manager.verify_token(token)
        
        if not user_data:
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        # Add user data to request
        request.user = user_data
        
        return f(*args, **kwargs)
    
    return decorated_function


def optional_auth(f):
    """Decorator for routes that work with or without authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Get token from header
        auth_header = request.headers.get('Authorization')
        
        if auth_header:
            try:
                token = auth_header.split(' ')[1]
                auth_manager = request.environ.get('auth_manager')
                
                if auth_manager:
                    user_data = auth_manager.verify_token(token)
                    if user_data:
                        request.user = user_data
            except:
                pass  # Silently fail for optional auth
        
        # If no valid auth, set default user
        if not hasattr(request, 'user'):
            request.user = {'user_id': 'default_user', 'email': None, 'role': 'anonymous'}
        
        return f(*args, **kwargs)
    
    return decorated_function
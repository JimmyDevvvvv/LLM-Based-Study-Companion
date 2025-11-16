"""
Authentication Manager for StudyMind AI
Handles custom JWT-based authentication
"""

from functools import wraps
from flask import request, jsonify
import jwt
import bcrypt
import os
from datetime import datetime, timedelta
from typing import Optional, Dict


class AuthManager:
    """Manages authentication using JWT tokens"""
    
    def __init__(self, jwt_secret: str, db_manager=None):
        """Initialize auth manager with JWT secret"""
        self.jwt_secret = jwt_secret
        self.db_manager = db_manager
        print("✅ Auth manager initialized")
    
    def hash_password(self, password: str) -> str:
        """Hash a password using bcrypt"""
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    
    def verify_password(self, password: str, hashed: str) -> bool:
        """Verify a password against its hash"""
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    
    def create_token(self, user_id: str, email: str, role: str = 'user') -> str:
        """Create a JWT token for a user"""
        payload = {
            'sub': user_id,
            'email': email,
            'role': role,
            'iat': datetime.utcnow(),
            'exp': datetime.utcnow() + timedelta(days=30)  # Token expires in 30 days
        }
        return jwt.encode(payload, self.jwt_secret, algorithm='HS256')
    
    def verify_token(self, token: str) -> Optional[Dict]:
        """Verify JWT token and return user data"""
        try:
            payload = jwt.decode(
                token,
                self.jwt_secret,
                algorithms=['HS256']
            )
            
            return {
                'user_id': payload.get('sub'),
                'email': payload.get('email'),
                'role': payload.get('role', 'user')
            }
        except jwt.ExpiredSignatureError:
            print("Token expired")
            return None
        except jwt.InvalidTokenError as e:
            print(f"Invalid token: {e}")
            return None
    
    def register_user(self, email: str, password: str) -> Optional[Dict]:
        """Register a new user"""
        if not self.db_manager:
            return None
        
        # Check if user already exists
        existing_user = self.db_manager.get_user_by_email(email)
        if existing_user:
            return None
        
        # Hash password and create user
        hashed_password = self.hash_password(password)
        user_id = f"user_{datetime.now().timestamp()}".replace('.', '')
        
        user = self.db_manager.create_user_with_password(user_id, email, hashed_password)
        if user:
            token = self.create_token(user_id, email)
            return {
                'user_id': user_id,
                'email': email,
                'token': token
            }
        return None
    
    def login_user(self, email: str, password: str) -> Optional[Dict]:
        """Login a user"""
        if not self.db_manager:
            return None
        
        user = self.db_manager.get_user_by_email(email)
        if not user:
            return None
        
        # Verify password
        if not self.verify_password(password, user.get('password', '')):
            return None
        
        # Create token
        token = self.create_token(user['user_id'], user['email'], user.get('role', 'user'))
        return {
            'user_id': user['user_id'],
            'email': user['email'],
            'token': token
        }


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
        
        # If no valid auth, check for guest user ID from request or set default user
        if not hasattr(request, 'user'):
            # Check if there's a guest user ID in the request (from frontend)
            guest_id = None
            
            # Check JSON body (POST/PUT requests)
            if request.is_json and request.json:
                guest_id = request.json.get('guest_user_id')
            
            # Check query parameters (GET requests)
            if not guest_id:
                guest_id = request.args.get('guest_user_id')
            
            # Check custom header (fallback)
            if not guest_id:
                guest_id = request.headers.get('X-Guest-User-Id')
            
            # Use guest ID if provided, otherwise use default_user
            user_id = guest_id if guest_id else 'default_user'
            request.user = {'user_id': user_id, 'email': None, 'role': 'anonymous'}
        
        return f(*args, **kwargs)
    
    return decorated_function
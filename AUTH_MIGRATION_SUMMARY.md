# Authentication System Migration Summary

## Overview
Successfully migrated from Supabase authentication to a custom JWT-based authentication system.

## Changes Made

### Backend Changes

#### 1. **auth_manager.py** - Complete Rewrite
- Removed Supabase client dependency
- Implemented custom JWT token generation and verification
- Added bcrypt password hashing
- Created `register_user()` and `login_user()` methods
- Token expiration set to 30 days

#### 2. **app.py** - Auth Configuration & Endpoints
- Replaced Supabase credentials with JWT_SECRET environment variable
- Added `/auth/signup` endpoint for user registration
- Added `/auth/login` endpoint for user authentication
- Updated auth_manager initialization to use DatabaseManager

#### 3. **db_manager.py** - User Storage
- Added `create_user_with_password()` method to store hashed passwords
- Added `get_user_by_email()` method for email-based lookup
- Users now stored with: user_id, email, password (hashed), role, timestamps

#### 4. **requirements.txt** - Dependencies
Added:
- `pyjwt` - JWT token handling
- `bcrypt` - Password hashing
- `pymongo` - MongoDB driver
- `google-generativeai` - Gemini API
- `python-dotenv` - Environment variables

### Frontend Changes

#### 1. **utils/authClient.ts** - New Custom Auth Client
- Created custom authentication client to replace Supabase
- Implements: signUp, signIn, signOut, session management
- Stores session in localStorage
- Provides auth state change listeners
- Compatible with existing useAuth hook interface

#### 2. **hooks/useAuth.ts** - Updated Hook
- Replaced Supabase imports with custom authClient
- Removed `signInWithGoogle()` method
- Updated User and Session types to custom types
- Maintains same API for components

#### 3. **components/AuthModal.tsx** - Simplified UI
- Removed Google sign-in button and divider
- Simplified to email/password only
- Updated error handling for custom auth responses

#### 4. **components/Header.tsx** - Type Update
- Changed User import from `@supabase/supabase-js` to `@/utils/authClient`

### Configuration Files

#### 1. **backend/.env.example**
```env
GEMINI_API_KEY=your_gemini_api_key_here
MONGODB_URI=your_mongodb_connection_string_here
JWT_SECRET=your-secret-key-change-this-in-production
PORT=5000
```

#### 2. **frontend/env.example.txt**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## How It Works

### Registration Flow
1. User submits email + password via AuthModal
2. Frontend calls `/auth/signup` endpoint
3. Backend validates input, checks for existing user
4. Password is hashed with bcrypt
5. User created in MongoDB with hashed password
6. JWT token generated and returned
7. Token stored in localStorage, user logged in

### Login Flow
1. User submits email + password via AuthModal
2. Frontend calls `/auth/login` endpoint
3. Backend retrieves user by email
4. Password verified against stored hash
5. JWT token generated and returned
6. Token stored in localStorage, user logged in

### Authentication Flow
1. Frontend includes JWT token in Authorization header
2. Backend decorators (`@require_auth`, `@optional_auth`) verify token
3. User data extracted from token and added to request
4. Protected routes accessible with valid token

## Security Features
- Passwords hashed with bcrypt (salt rounds: default)
- JWT tokens with 30-day expiration
- Secure token verification on backend
- No passwords stored in plain text
- Session management via localStorage

## Migration Steps for Users

### Backend Setup
1. Install new dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```

2. Update `.env` file:
   ```env
   JWT_SECRET=your-long-random-secret-key-here
   MONGODB_URI=your_mongodb_connection_string
   GEMINI_API_KEY=your_gemini_api_key
   ```

3. Remove old Supabase environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`

### Frontend Setup
1. Create `.env.local` file:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000
   ```

2. Reinstall dependencies (if needed):
   ```bash
   npm install
   ```

## Breaking Changes
- Google OAuth sign-in removed
- Supabase dependencies removed
- Users must re-register (old Supabase users won't transfer)
- Session storage moved from Supabase to localStorage

## Benefits
- ✅ No external auth service dependency
- ✅ Full control over authentication logic
- ✅ Simpler codebase
- ✅ No Supabase API costs
- ✅ Works offline (after initial login)
- ✅ Customizable token expiration
- ✅ Direct MongoDB integration

## Notes
- JWT_SECRET should be a long, random string in production
- Consider implementing refresh tokens for better security
- Add rate limiting to auth endpoints in production
- Consider adding email verification for production use
- Password reset functionality not yet implemented

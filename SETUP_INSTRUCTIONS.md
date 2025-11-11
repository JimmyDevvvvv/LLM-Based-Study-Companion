# Setup Instructions - Custom Authentication System

## Prerequisites
- Python 3.8+
- Node.js 16+
- MongoDB instance (local or cloud)
- Gemini API key

## Backend Setup

### 1. Install Python Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment Variables
Create a `.env` file in the `backend` directory:

```env
# Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# MongoDB
MONGODB_URI=mongodb://localhost:27017/studymind
# Or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/studymind

# JWT Authentication (IMPORTANT: Change this!)
JWT_SECRET=change-this-to-a-long-random-secure-string-in-production

# Server
PORT=5000
```

**⚠️ IMPORTANT:** Generate a secure JWT_SECRET using:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 3. Start Backend Server
```bash
cd backend
python app.py
```

Server will start on `http://localhost:5000`

## Frontend Setup

### 1. Install Node Dependencies
```bash
cd frontend
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the `frontend` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 3. Start Frontend Development Server
```bash
cd frontend
npm run dev
```

Frontend will start on `http://localhost:3000`

## Testing the Authentication

### 1. Sign Up
1. Open `http://localhost:3000`
2. Click "Sign In / Sign Up" button
3. Toggle to "Sign Up" mode
4. Enter email and password (min 6 characters)
5. Click "Sign Up"

### 2. Sign In
1. Use the same email and password
2. Toggle to "Sign In" mode
3. Click "Sign In"

### 3. Verify Authentication
- Check browser localStorage for `auth_session`
- User email should appear in the sidebar
- All features should be accessible

## Troubleshooting

### Backend Issues

**"Auth manager not configured"**
- Ensure MongoDB is running and MONGODB_URI is correct
- Check that JWT_SECRET is set in .env

**"Database connection failed"**
- Verify MongoDB is running
- Check MONGODB_URI format
- For MongoDB Atlas, ensure IP whitelist is configured

**"User already exists"**
- Email is already registered
- Try signing in instead or use different email

### Frontend Issues

**"Failed to fetch"**
- Ensure backend server is running on port 5000
- Check NEXT_PUBLIC_API_URL in .env.local
- Verify CORS is enabled in backend

**"Invalid or expired token"**
- Clear localStorage and sign in again
- JWT_SECRET may have changed on backend

**Authentication modal won't close**
- This is intentional - you must sign in to use the app
- Sign in or sign up to proceed

## MongoDB Collections

The system creates these collections automatically:
- `users` - User accounts with hashed passwords
- `conversations` - Chat history
- `user_memory` - User preferences and memory
- `grading_history` - Grading records
- `saved_content` - Generated content

## Security Best Practices

1. **Never commit .env files** - They're gitignored for security
2. **Use strong JWT_SECRET** - At least 32 random characters
3. **Use HTTPS in production** - Never send tokens over HTTP
4. **Rotate JWT_SECRET periodically** - Invalidates all tokens
5. **Set secure password requirements** - Current min is 6 chars
6. **Consider adding rate limiting** - Prevent brute force attacks

## Production Deployment

### Backend
1. Set strong JWT_SECRET
2. Use production MongoDB instance
3. Enable HTTPS
4. Set `debug=False` in app.py
5. Use production WSGI server (gunicorn, uwsgi)
6. Add rate limiting middleware
7. Configure proper CORS origins

### Frontend
1. Update NEXT_PUBLIC_API_URL to production backend
2. Build for production: `npm run build`
3. Deploy to Vercel/Netlify or use `npm start`
4. Ensure environment variables are set

## API Endpoints

### Authentication
- `POST /auth/signup` - Register new user
- `POST /auth/login` - Login existing user
- `GET /auth/user` - Get current user (requires auth)

### Protected Routes
All other endpoints support optional or required authentication via:
- `Authorization: Bearer <jwt_token>` header

## Support

For issues or questions:
1. Check AUTH_MIGRATION_SUMMARY.md for detailed changes
2. Verify all environment variables are set correctly
3. Check browser console and backend logs for errors
4. Ensure MongoDB is accessible and running

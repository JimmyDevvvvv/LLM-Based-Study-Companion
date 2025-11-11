# API Documentation - Custom Authentication

## Base URL
```
http://localhost:5000
```

## Authentication

All authenticated requests must include the JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Auth Endpoints

### Sign Up
**POST** `/auth/signup`

Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Success Response (200):**
```json
{
  "user": {
    "id": "user_1699999999999",
    "email": "user@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `400` - Email and password required
- `400` - Password must be at least 6 characters
- `409` - User already exists
- `503` - Auth not configured

---

### Login
**POST** `/auth/login`

Authenticate an existing user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Success Response (200):**
```json
{
  "user": {
    "id": "user_1699999999999",
    "email": "user@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `400` - Email and password required
- `401` - Invalid email or password
- `503` - Auth not configured

---

### Get Current User
**GET** `/auth/user`

Get the currently authenticated user's information.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Success Response (200):**
```json
{
  "user_id": "user_1699999999999",
  "email": "user@example.com",
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses:**
- `401` - No authorization header
- `401` - Invalid or expired token
- `500` - Auth manager not configured

---

## Protected Endpoints

All the following endpoints support authentication. Include the JWT token in the Authorization header.

### Chat
**POST** `/chat`

Send a message and get AI response.

**Request Body:**
```json
{
  "message": "Explain quantum computing",
  "history": [
    {
      "role": "user",
      "content": "Previous message"
    },
    {
      "role": "assistant",
      "content": "Previous response"
    }
  ]
}
```

**Success Response (200):**
```json
{
  "response": "Quantum computing is..."
}
```

---

### Generate Content
**POST** `/generate`

Generate content from text.

**Request Body:**
```json
{
  "text": "Input text to process",
  "task": "summarize"
}
```

**Tasks:** `summarize`, `quiz`, `flashcards`, `explain`

---

### Content Creation
**POST** `/content/create`

Create lecture content.

**Request Body:**
```json
{
  "input": "Machine Learning",
  "difficulty": "beginner"
}
```

**Difficulty Levels:** `beginner`, `intermediate`, `advanced`

---

### Grading
**POST** `/grade`

Grade an answer.

**Request Body:**
```json
{
  "question": "What is photosynthesis?",
  "answer": "Process where plants convert light to energy",
  "is_code": false
}
```

**Success Response (200):**
```json
{
  "grade": 85,
  "feedback": "Good understanding...",
  "detected_issues": ["Minor detail missing"],
  "strengths": ["Clear explanation"]
}
```

---

### Quiz Generation
**POST** `/quiz`

Generate a quiz on a topic.

**Request Body:**
```json
{
  "topic": "Python Programming",
  "difficulty": "intermediate",
  "type": "mcq",
  "count": 5
}
```

**Types:** `mcq`, `short`

---

### File Upload
**POST** `/upload`

Upload and extract text from files.

**Request:**
- Content-Type: `multipart/form-data`
- Field name: `file`
- Supported formats: PDF, TXT

**Success Response (200):**
```json
{
  "filename": "document.pdf",
  "extracted_text": "Extracted content...",
  "extraction_status": "success",
  "char_count": 1234
}
```

---

## Conversation Management

### Get Conversations
**GET** `/conversations/<user_id>`

Get all conversations for a user.

**Success Response (200):**
```json
{
  "conversations": [
    {
      "id": "1699999999999",
      "title": "Python Discussion",
      "timestamp": "2024-01-01T00:00:00.000Z",
      "messages": [],
      "last_message": "How do I..."
    }
  ]
}
```

---

### Create Conversation
**POST** `/conversations/<user_id>`

Create a new conversation.

**Request Body:**
```json
{
  "title": "New Conversation"
}
```

---

### Update Conversation
**PUT** `/conversations/<user_id>/<conversation_id>`

Update conversation messages or title.

**Request Body:**
```json
{
  "messages": [...],
  "title": "Updated Title"
}
```

---

### Delete Conversation
**DELETE** `/conversations/<user_id>/<conversation_id>`

Delete a conversation.

**Success Response (200):**
```json
{
  "message": "Deleted"
}
```

---

## Memory Management

### Get Memory
**GET** `/memory/<user_id>`

Get user's memory/preferences.

---

### Update Memory
**PUT** `/memory/<user_id>`

Update user's memory.

**Request Body:**
```json
{
  "preferred_tone": "casual",
  "learning_style": "visual",
  "topics_of_interest": ["AI", "Python"]
}
```

---

### Clear Memory
**DELETE** `/memory/<user_id>`

Clear all user memory.

---

## Tone Management

### Get Tone
**GET** `/tone/<user_id>`

Get user's preferred tone.

**Success Response (200):**
```json
{
  "user_id": "user_123",
  "tone": "professional"
}
```

---

### Set Tone
**POST** `/tone/<user_id>`

Set user's preferred tone.

**Request Body:**
```json
{
  "tone": "casual"
}
```

**Available Tones:**
- `professional`
- `casual`
- `enthusiastic`
- `concise`

---

## History

### Get History
**GET** `/history`

Get user's saved content and grading history.

**Success Response (200):**
```json
{
  "items": [
    {
      "name": "lecture_20240101_120000.md",
      "type": "file"
    }
  ],
  "grading_entries": 5
}
```

---

## Health Check

### Health
**GET** `/health`

Check API health status.

**Success Response (200):**
```json
{
  "status": "healthy",
  "model": "gemini-2.5-pro",
  "database": "connected",
  "auth": "configured"
}
```

---

## Error Responses

All endpoints may return these common errors:

**400 Bad Request**
```json
{
  "error": "Description of what went wrong"
}
```

**401 Unauthorized**
```json
{
  "error": "Invalid or expired token"
}
```

**403 Forbidden**
```json
{
  "error": "Unauthorized"
}
```

**404 Not Found**
```json
{
  "error": "Not found"
}
```

**500 Internal Server Error**
```json
{
  "error": "Error description"
}
```

**503 Service Unavailable**
```json
{
  "error": "Database not configured"
}
```

---

## Rate Limiting

Currently no rate limiting is implemented. Consider adding in production:
- Login attempts: 5 per minute
- API requests: 100 per minute
- File uploads: 10 per hour

---

## CORS Configuration

The API allows all origins (`*`) in development. In production, configure specific origins:

```python
CORS(app, resources={
    r"/*": {
        "origins": ["https://yourdomain.com"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})
```

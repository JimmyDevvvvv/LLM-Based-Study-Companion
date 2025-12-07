# Orchestration API Documentation

## Base URL

```
http://localhost:5000
```

## Authentication

All endpoints support optional authentication. Include JWT token in header if authenticated:
```
Authorization: Bearer <your_jwt_token>
```

---

## Study Assistant Endpoint

### POST `/study/assist`

Unified orchestration endpoint that routes natural language queries to appropriate tools.

**Request Body:**
```json
{
  "query": "Create a 10-question quiz on photosynthesis",
  "context": {
    "course": "Biology 101",
    "chapter": "Chapter 5",
    "user_id": "user_123"
  },
  "explicit_intent": "quiz_generation"  // Optional: skip classification
}
```

**Success Response (200):**
```json
{
  "success": true,
  "intent": "quiz_generation",
  "confidence": 0.95,
  "tool_used": "Quiz Generator",
  "result": {
    "quiz": "## Questions\n\n1. What is photosynthesis?\n..."
  },
  "needs_clarification": false,
  "clarification_options": null,
  "metadata": {
    "processing_time": 1.2,
    "parameters_extracted": {
      "topic": "photosynthesis",
      "count": 10,
      "type": "mcq",
      "difficulty": "beginner"
    }
  }
}
```

**Clarification Needed (400):**
```json
{
  "success": false,
  "error": "ambiguous_query",
  "intent": "quiz_generation",
  "confidence": 0.65,
  "needs_clarification": true,
  "clarification_options": [
    {
      "intent": "quiz_generation",
      "name": "Quiz Generator",
      "description": "Generate quiz questions on a topic"
    },
    {
      "intent": "content_generation",
      "name": "Content Generator",
      "description": "Generate lecture content or study materials"
    }
  ],
  "metadata": {
    "processing_time": 0.5,
    "parameters_extracted": {}
  }
}
```

**Error Response (500):**
```json
{
  "success": false,
  "error": "tool_execution_failed",
  "message": "Failed to generate content: API error",
  "metadata": {
    "processing_time": 0.8
  }
}
```

**Error Codes:**
- `400` - Bad request (no query provided, ambiguous query)
- `500` - Internal server error (tool execution failed)

---

## Statistics Endpoint

### GET `/orchestration/stats`

Get orchestration statistics and metrics.

**Response (200):**
```json
{
  "total_requests": 150,
  "intent_distribution": {
    "quiz_generation": 45,
    "content_generation": 30,
    "flashcards": 20,
    "explanation": 25,
    "chat": 30
  },
  "average_confidence": 0.87,
  "tool_usage_breakdown": {
    "Quiz Generator": 45,
    "Content Generator": 30,
    "Flashcard Creator": 20,
    "Explanation": 25,
    "Chat": 30
  },
  "average_response_time_ms": 1250.5,
  "error_count": 5,
  "success_rate": 96.67
}
```

---

## Example cURL Commands

### Basic Query
```bash
curl -X POST http://localhost:5000/study/assist \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Create a quiz on Python loops"
  }'
```

### With Authentication
```bash
curl -X POST http://localhost:5000/study/assist \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "query": "Generate flashcards for Chapter 3",
    "context": {
      "course": "CS101"
    }
  }'
```

### With Explicit Intent
```bash
curl -X POST http://localhost:5000/study/assist \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Machine Learning basics",
    "explicit_intent": "content_generation"
  }'
```

### Get Statistics
```bash
curl -X GET http://localhost:5000/orchestration/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Available Intents

| Intent | Description | Required Parameters | Optional Parameters |
|--------|-------------|---------------------|---------------------|
| `quiz_generation` | Generate quiz questions | `topic` | `difficulty`, `count`, `type` |
| `content_generation` | Generate lecture content | `topic` | `difficulty` |
| `flashcards` | Create flashcards | `topic` | - |
| `summarize` | Summarize text | `topic` | - |
| `explanation` | Explain concepts | `topic` | - |
| `project_ideas` | Generate project ideas | `topic` | `level` |
| `admin_template` | Generate admin templates | - | `template` |
| `help` | Get help | - | - |
| `chat` | General conversation | - | - |

---

## Parameter Extraction

The system automatically extracts parameters from queries:

**Examples:**
- "Create a 10-question quiz on photosynthesis" → `{topic: "photosynthesis", count: 10}`
- "Explain quantum physics for beginners" → `{topic: "quantum physics", difficulty: "beginner"}`
- "Make flashcards for Spanish verbs" → `{topic: "Spanish verbs"}`

**Supported Patterns:**
- Topic: "on X", "about X", "for X", "regarding X"
- Difficulty: "beginner", "easy", "basic", "intermediate", "medium", "advanced", "hard", "expert"
- Count: "N question(s)", "N quiz", "N flashcard(s)"
- Type: "multiple choice", "mcq", "short answer", "short"


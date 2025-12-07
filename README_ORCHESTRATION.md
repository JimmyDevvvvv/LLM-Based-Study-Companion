# Orchestration Layer - Quick Start

## Overview

The orchestration layer adds a unified conversational interface to StudyMind AI, allowing users to interact with all tools through natural language.

## Features

✅ **Natural Language Interface**: Type queries in plain English  
✅ **Intelligent Routing**: Automatically routes to the right tool  
✅ **Fast Keyword Classification**: Quick responses for simple queries  
✅ **LLM Classification**: Handles complex and ambiguous queries  
✅ **Clarification Dialog**: Asks for clarification when needed  
✅ **Unified Response Format**: Consistent responses across all tools  
✅ **Logging & Analytics**: Track usage and performance  

## Quick Start

### Backend

1. The orchestration module is already integrated in `backend/app.py`
2. No additional setup required - just start the Flask server:
   ```bash
   cd backend
   python app.py
   ```

### Frontend

1. The Study Assistant component is already integrated
2. Navigate to the **"Study Assistant"** tab in the UI
3. Start typing natural language queries!

## Example Queries

- "Create a 10-question quiz on photosynthesis"
- "Generate flashcards for Chapter 3 vocabulary"
- "Summarize the French Revolution"
- "Explain Newton's laws in simple terms"
- "Give me project ideas for data structures"

## API Endpoints

### POST `/study/assist`

Main orchestration endpoint.

**Request:**
```json
{
  "query": "Create a quiz on Python",
  "context": {
    "user_id": "user_123"
  }
}
```

**Response:**
```json
{
  "success": true,
  "intent": "quiz_generation",
  "confidence": 0.95,
  "tool_used": "Quiz Generator",
  "result": { /* tool result */ },
  "metadata": {
    "processing_time": 1.2,
    "parameters_extracted": { /* params */ }
  }
}
```

### GET `/orchestration/stats`

Get orchestration statistics.

## Documentation

Full documentation available in `docs/`:
- `ARCHITECTURE.md` - System architecture
- `API.md` - API documentation
- `INTEGRATION.md` - Frontend-backend integration
- `ADDING_TOOLS.md` - How to add new tools
- `USER_GUIDE.md` - User guide
- `THESIS_NOTES.md` - Technical methodology

## Testing

### Test Backend

```bash
curl -X POST http://localhost:5000/study/assist \
  -H "Content-Type: application/json" \
  -d '{"query": "Create a quiz on Python"}'
```

### Test Frontend

1. Open the app in browser
2. Navigate to "Study Assistant" tab
3. Enter a query and verify results

## Troubleshooting

### Common Issues

1. **Import Errors**: Ensure `orchestrator.py` is in the same directory as `app.py`
2. **API Errors**: Check Gemini API key is set in environment
3. **CORS Errors**: Verify CORS configuration in `app.py`
4. **Clarification Always Triggered**: Try more specific queries

## Architecture

```
User Query
    ↓
Keyword Classification (Fast)
    ↓ (if confidence < 0.6)
LLM Classification
    ↓
Intent + Parameters
    ↓
Tool Routing
    ↓
Result
```

## Logging

Logs are written to `orchestration_logs.jsonl` in the backend directory.

## Statistics

View statistics at `GET /orchestration/stats` or check logs.

## Support

For issues or questions, check the documentation in `docs/` or review the code comments.


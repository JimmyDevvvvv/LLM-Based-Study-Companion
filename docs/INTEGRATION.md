# Frontend-Backend Integration Guide

## Overview

This document describes how the frontend Study Assistant component integrates with the backend orchestration API.

## Integration Flow

```
Frontend Component (StudyAssist.tsx)
    │
    ├─→ User types query
    │
    ├─→ handleSubmit() called
    │
    ├─→ apiUtils.post(API_ENDPOINTS.studyAssist, {...})
    │
    └─→ Backend: POST /study/assist
        │
        ├─→ orchestrator.orchestrate()
        │   ├─→ classify_intent()
        │   ├─→ route_to_tool()
        │   └─→ Return unified response
        │
        └─→ Frontend receives response
            │
            ├─→ If success: renderResult()
            ├─→ If clarification needed: show clarification dialog
            └─→ If error: show error message
```

## API Configuration

### Frontend (`frontend/config/api.ts`)

```typescript
export const API_ENDPOINTS = {
  get studyAssist() {
    return endpoint('/study/assist');
  },
  get orchestrationStats() {
    return endpoint('/orchestration/stats');
  },
};
```

The `endpoint()` function automatically resolves the base URL:
- Local development: `http://localhost:5000`
- Netlify: `/api` (proxied)

## Request Format

### Frontend → Backend

```typescript
const response = await apiUtils.post(
  API_ENDPOINTS.studyAssist,
  {
    query: "Create a quiz on photosynthesis",
    context: {
      user_id: userId
    },
    explicit_intent: "quiz_generation"  // Optional
  },
  accessToken  // Optional: JWT token
);
```

### Backend Processing

1. **Authentication**: `@optional_auth` decorator extracts user_id
2. **Orchestration**: `orchestrator.orchestrate()` processes query
3. **Response**: Returns unified JSON format

## Response Handling

### Success Response

```typescript
if (response.success) {
  setResult(response);
  // Render result based on intent
  renderResult();
}
```

### Clarification Needed

```typescript
if (response.needs_clarification) {
  setNeedsClarification(true);
  setClarificationOptions(response.clarification_options);
  // Show clarification dialog
}
```

### Error Response

```typescript
if (!response.success && !response.needs_clarification) {
  setError(response.message || response.error);
  // Show error message
}
```

## Result Rendering

The `renderResult()` function routes to appropriate display based on intent:

```typescript
switch (intent) {
  case "quiz_generation":
    // Display quiz result
    break;
  case "content_generation":
    // Display content result
    break;
  // ... other cases
}
```

## Loading States

Frontend shows different loading messages based on processing stage:

```typescript
{stage === "classifying" && "Analyzing your request..."}
{stage === "executing" && "Generating results..."}
```

## Error Handling

### Network Errors
```typescript
try {
  const response = await apiUtils.post(...);
} catch (err) {
  setError(err.message);
}
```

### Backend Errors
- 400: Bad request (handled in response)
- 500: Internal error (handled in response)

## Authentication

### Guest Users
- No token required
- `user_id` from `request.user['user_id']` (default_user or guest_id)

### Authenticated Users
- JWT token in `Authorization` header
- `user_id` from token payload

## Testing Integration

### Manual Testing

1. Start backend: `python backend/app.py`
2. Start frontend: `npm run dev`
3. Navigate to "Study Assistant" tab
4. Enter query: "Create a quiz on Python"
5. Verify:
   - Loading state appears
   - Result displays correctly
   - Metadata shows confidence and processing time

### Example Queries

```typescript
// Quiz generation
"Create a 10-question quiz on photosynthesis"

// Content generation
"Generate lecture notes on machine learning"

// Flashcards
"Make flashcards for Spanish verbs"

// Explanation
"Explain Newton's laws"

// Project ideas
"Give me project ideas for data structures"
```

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check backend CORS configuration
   - Verify frontend origin is whitelisted

2. **404 Not Found**
   - Verify API endpoint URL resolution
   - Check backend route registration

3. **500 Internal Error**
   - Check backend logs
   - Verify Gemini API key is set
   - Check tool function imports

4. **Clarification Always Triggered**
   - Check confidence threshold (0.7)
   - Verify keyword classification is working
   - Test with more specific queries

## Performance Considerations

- **Keyword Classification**: Fast path (< 50ms)
- **LLM Classification**: Slower (~500-1000ms)
- **Tool Execution**: Varies by tool (500-3000ms)
- **Total**: 1-4 seconds typical

## Security

- All endpoints support optional auth
- User ID extracted from token or guest session
- No sensitive data in query logs
- Logs stored locally (orchestration_logs.jsonl)


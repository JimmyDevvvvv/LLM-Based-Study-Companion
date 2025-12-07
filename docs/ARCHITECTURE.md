# Orchestration Layer Architecture

## Overview

The orchestration layer provides a unified conversational interface that routes natural language queries to the appropriate tool in the StudyMind AI system.

## Architecture Flow

```
User Query
    │
    ├─→ Keyword Classification (Fast Path)
    │   └─→ If confidence ≥ 0.6 → Route to Tool
    │
    └─→ LLM Classification (Fallback)
        ├─→ If confidence ≥ 0.7 → Route to Tool
        └─→ If confidence < 0.7 → Request Clarification
            │
            └─→ User Selects Intent → Route to Tool
                │
                └─→ Execute Tool Function
                    │
                    └─→ Return Unified Response
```

## Components

### 1. Intent Classification

**Keyword Classification (Fast Path)**
- Scans query for tool-specific keywords
- Scores each tool based on keyword matches
- Returns intent if confidence ≥ 0.6
- Saves API calls for simple queries

**LLM Classification (Fallback)**
- Uses Gemini API for complex queries
- Extracts intent and parameters
- Returns confidence score (0.0 - 1.0)
- Handles ambiguous queries

### 2. Parameter Extraction

Extracts relevant parameters from queries:
- `topic`: Subject/topic mentioned
- `difficulty`: beginner/intermediate/advanced
- `count`: Number of items (questions, flashcards, etc.)
- `type`: For quizzes: "mcq" or "short"
- `action`: For content: "simplify" or "expand"
- `template`: For admin: template type
- `level`: For project ideas: difficulty level

### 3. Tool Routing

Routes classified intent to appropriate tool:
- `quiz_generation` → Quiz Generator
- `content_generation` → Content Generator
- `flashcards` → Flashcard Creator
- `summarize` → Summarizer
- `explanation` → Explanation Tool
- `project_ideas` → Project Ideas Generator
- `admin_template` → Admin Template Generator
- `help` → Help System
- `chat` → General Chat (fallback)

### 4. Response Format

Unified response structure:
```json
{
  "success": true,
  "intent": "quiz_generation",
  "confidence": 0.95,
  "tool_used": "Quiz Generator",
  "result": { /* tool-specific result */ },
  "needs_clarification": false,
  "clarification_options": null,
  "metadata": {
    "processing_time": 1.2,
    "parameters_extracted": { /* extracted params */ }
  }
}
```

## File Structure

```
backend/
├── orchestrator.py      # Main orchestration logic
├── app.py              # Flask app with /study/assist endpoint
└── prompts.py          # Tool-specific prompts

frontend/
├── components/
│   └── StudyAssist.tsx # Conversational interface component
├── config/
│   └── api.ts          # API endpoint configuration
└── app/
    └── page.tsx        # Main page with Study Assistant tab
```

## Data Flow

1. **User Input** → Frontend `StudyAssist` component
2. **API Request** → `POST /study/assist` with query
3. **Intent Classification** → Keyword or LLM classification
4. **Parameter Extraction** → Extract relevant parameters
5. **Tool Routing** → Call appropriate tool function
6. **Response** → Unified format with result
7. **Display** → Frontend renders result based on intent

## Error Handling

- **Low Confidence** (< 0.7): Request clarification with options
- **Tool Execution Error**: Return error response with message
- **Missing Parameters**: Use defaults or request clarification
- **Invalid Intent**: Fallback to chat

## Logging

All requests are logged to `orchestration_logs.jsonl`:
- Timestamp
- User ID
- Query
- Intent classified
- Confidence score
- Tool executed
- Execution time
- Success/failure
- Error details (if any)

## Statistics

Stats endpoint: `GET /orchestration/stats`
- Total requests
- Intent distribution
- Average confidence
- Tool usage breakdown
- Average response times
- Error count
- Success rate


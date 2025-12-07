# Technical Methodology: Orchestration Layer

## Abstract

This document describes the technical implementation of the orchestration layer for the LLM-based study companion tool, suitable for inclusion in a thesis methodology section.

## Introduction

The orchestration layer provides a unified conversational interface that intelligently routes natural language queries to specialized educational tools. This approach improves user experience by eliminating the need for users to navigate multiple interfaces and understand tool-specific parameters.

## Architecture

### System Design

The orchestration layer follows a three-stage pipeline:

1. **Intent Classification**: Determines user intent from natural language
2. **Parameter Extraction**: Extracts relevant parameters from queries
3. **Tool Routing**: Executes appropriate tool with extracted parameters

### Classification Strategy

#### Two-Tier Classification

**Tier 1: Keyword-Based Classification (Fast Path)**
- Scans queries for tool-specific keywords
- Uses scoring algorithm based on keyword matches
- Returns result if confidence ≥ 0.6
- Average processing time: < 50ms
- Reduces API calls for simple queries

**Tier 2: LLM-Based Classification (Fallback)**
- Uses Google Gemini 2.5 Pro for complex queries
- Structured prompt with tool descriptions
- Returns JSON with intent, confidence, and parameters
- Average processing time: 500-1000ms
- Handles ambiguous and complex queries

#### Confidence Thresholds

- **High Confidence (≥ 0.7)**: Direct routing to tool
- **Medium Confidence (0.6-0.7)**: Keyword classification result
- **Low Confidence (< 0.7)**: Request clarification from user

### Parameter Extraction

Parameters are extracted using:
1. **LLM Extraction**: Primary method using structured prompts
2. **Pattern Matching**: Fallback using regex patterns
3. **Default Values**: Applied when parameters not found

Extracted parameters include:
- Topic/subject
- Difficulty level (beginner/intermediate/advanced)
- Count (number of items)
- Type (for quizzes: mcq/short)
- Action (for content: simplify/expand)
- Template type (for admin tools)

### Tool Routing

Tools are mapped to intents:
- `quiz_generation` → Quiz Generator
- `content_generation` → Content Generator
- `flashcards` → Flashcard Creator
- `summarize` → Summarizer
- `explanation` → Explanation Tool
- `project_ideas` → Project Ideas Generator
- `admin_template` → Admin Template Generator
- `help` → Help System
- `chat` → General Chat (fallback)

## Implementation Details

### Backend

**Technology Stack:**
- Python 3.8+
- Flask (web framework)
- Google Gemini 2.5 Pro (LLM)
- JSONL logging

**Key Components:**
- `orchestrator.py`: Core orchestration logic
- `app.py`: Flask endpoints
- `prompts.py`: Tool-specific prompts

**API Endpoint:**
```
POST /study/assist
```

**Response Format:**
```json
{
  "success": boolean,
  "intent": string,
  "confidence": float,
  "tool_used": string,
  "result": object,
  "needs_clarification": boolean,
  "metadata": {
    "processing_time": float,
    "parameters_extracted": object
  }
}
```

### Frontend

**Technology Stack:**
- Next.js 14
- React 18
- TypeScript

**Key Components:**
- `StudyAssist.tsx`: Main conversational interface
- `api.ts`: API configuration and utilities

**Features:**
- Real-time loading states
- Clarification dialog
- Result rendering by intent type
- Example queries help panel

## Evaluation Metrics

### Performance

- **Keyword Classification**: < 50ms average
- **LLM Classification**: 500-1000ms average
- **Tool Execution**: 500-3000ms (varies by tool)
- **Total Response Time**: 1-4 seconds typical

### Accuracy

- **Intent Classification Accuracy**: Measured via logs
- **Confidence Scores**: Tracked per request
- **Clarification Rate**: Percentage of queries requiring clarification
- **Success Rate**: Percentage of successful tool executions

### User Experience

- **Clarification Requests**: Handled gracefully with options
- **Error Handling**: User-friendly error messages
- **Loading States**: Clear feedback during processing
- **Result Display**: Contextual rendering based on tool type

## Logging and Analytics

All requests are logged to `orchestration_logs.jsonl`:
- Timestamp
- User ID
- Query text
- Intent classified
- Confidence score
- Tool executed
- Execution time
- Success/failure status
- Error details (if any)

Statistics endpoint provides:
- Total requests
- Intent distribution
- Average confidence
- Tool usage breakdown
- Average response times
- Error count
- Success rate

## Limitations and Future Work

### Current Limitations

1. **Language Support**: English only
2. **Tool Coverage**: Limited to existing tools
3. **Parameter Extraction**: May miss implicit parameters
4. **Clarification**: Binary choice (could be improved)

### Future Enhancements

1. **Multi-language Support**: Extend to other languages
2. **Context Awareness**: Remember previous queries
3. **Learning**: Improve from user feedback
4. **Advanced Clarification**: Multi-step clarification
5. **Tool Chaining**: Execute multiple tools in sequence

## Conclusion

The orchestration layer successfully provides a unified conversational interface that intelligently routes user queries to appropriate educational tools. The two-tier classification approach balances speed and accuracy, while the clarification mechanism handles ambiguous queries gracefully.

## References

- Google Gemini API Documentation
- Flask Framework Documentation
- Next.js Documentation
- Natural Language Processing Best Practices


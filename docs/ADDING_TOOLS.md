# Adding New Tools to Orchestration

## Overview

This guide explains how to add a new tool to the orchestration layer.

## Steps

### 1. Add Tool to AVAILABLE_TOOLS

Edit `backend/orchestrator.py`:

```python
AVAILABLE_TOOLS = {
    # ... existing tools ...
    "your_new_tool": {
        "name": "Your Tool Name",
        "endpoint": "/your/endpoint",
        "description": "What this tool does",
        "keywords": ["keyword1", "keyword2", "keyword3"]
    }
}
```

### 2. Add Routing Logic

In `route_to_tool()` method, add case:

```python
elif intent == "your_new_tool":
    request_data = {
        "param1": parameters.get("param1") or query,
        "param2": parameters.get("param2", "default")
    }
    # Call your tool function
    from app import _gemini_generate
    from prompts import your_tool_prompt
    
    prompt = your_tool_prompt(request_data["param1"], ...)
    result = _gemini_generate(prompt, temperature=0.7)
    return {"output": result}
```

### 3. Update Parameter Extraction

In `llm_classify_intent()` prompt, add parameter:

```python
Parameters to extract:
- param1: Description
- param2: Description
# ... add your parameters
```

### 4. Update Keyword Classification (Optional)

Add keywords to tool definition (already done in step 1).

### 5. Update Frontend Display

In `frontend/components/StudyAssist.tsx`, add case to `renderResult()`:

```typescript
case "your_new_tool":
  return (
    <div className="mt-6">
      {/* Your display component */}
    </div>
  );
```

### 6. Add Example Queries

In `StudyAssist.tsx`, add to `exampleQueries`:

```typescript
{
  category: "🛠️ Your Tool",
  examples: [
    "Example query 1",
    "Example query 2"
  ]
}
```

## Example: Adding a "Code Review" Tool

### Step 1: Add to AVAILABLE_TOOLS

```python
"code_review": {
    "name": "Code Review",
    "endpoint": "/code/review",
    "description": "Review and provide feedback on code",
    "keywords": ["code review", "review code", "check code", "code feedback"]
}
```

### Step 2: Add Routing

```python
elif intent == "code_review":
    request_data = {
        "code": parameters.get("code") or query,
        "language": parameters.get("language", "python")
    }
    from app import _gemini_generate
    prompt = f"Review this {request_data['language']} code:\n\n{request_data['code']}"
    result = _gemini_generate(prompt, temperature=0.3, max_tokens=1024)
    return {"review": result}
```

### Step 3: Update Frontend

```typescript
case "code_review":
  return (
    <div className="mt-6">
      <div className={`${theme.surface} p-6`}>
        <pre className="whitespace-pre-wrap">
          {toolResult?.review || "No result"}
        </pre>
      </div>
    </div>
  );
```

## Testing

1. Test keyword classification:
   ```bash
   curl -X POST http://localhost:5000/study/assist \
     -d '{"query": "review this code"}'
   ```

2. Test LLM classification:
   ```bash
   curl -X POST http://localhost:5000/study/assist \
     -d '{"query": "can you check my python function"}'
   ```

3. Test explicit intent:
   ```bash
   curl -X POST http://localhost:5000/study/assist \
     -d '{"query": "some code", "explicit_intent": "code_review"}'
   ```

## Best Practices

1. **Keywords**: Use 3-5 relevant keywords that users might say
2. **Description**: Clear, concise description of what the tool does
3. **Parameters**: Extract only necessary parameters
4. **Error Handling**: Handle missing parameters gracefully
5. **Response Format**: Return consistent format in `result` object
6. **Testing**: Test with various query phrasings

## Notes

- Tools are called directly (not through HTTP endpoints)
- Use existing `_gemini_generate()` function for LLM calls
- Reuse existing prompts from `prompts.py` when possible
- Keep response format consistent with other tools


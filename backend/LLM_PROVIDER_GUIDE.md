# Unified LLM Provider Guide

This document explains how to use the unified LLM provider interface that supports multiple providers (Gemini, Groq) through a single, clean API.

## Architecture

The unified LLM provider system abstracts away provider-specific differences, allowing you to switch between providers by simply changing environment variables.

### Files

- **`llm_provider.py`**: Core provider abstraction with base class and implementations
- **`app.py`**: Uses unified provider via `_llm_generate()` function
- **`orchestrator.py`**: Uses unified provider for intent classification and tool routing
- **`memory_manager.py`**: Uses unified provider for user info extraction

## Environment Variables

### Required Variables

```bash
# Provider selection: "gemini" or "groq"
LLM_PROVIDER=gemini

# Model name (varies by provider)
# For Gemini: gemini-2.5-flash, gemini-pro, gemini-1.5-flash, etc.
# For Groq: llama-3.1-8b-instant, llama-3.1-70b-versatile, mixtral-8x7b-32768, etc.
LLM_MODEL=gemini-2.5-flash

# API Key
LLM_API_KEY=your-api-key-here
```

### Backward Compatibility

The old Gemini-specific environment variables still work:

```bash
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_MODEL=gemini-2.5-flash
```

If `LLM_API_KEY` is not set but `GEMINI_API_KEY` is, the system will use `GEMINI_API_KEY` when the provider is Gemini.

## Switching Providers

### From Gemini to Groq

Simply update your `.env` file:

```bash
LLM_PROVIDER=groq
LLM_MODEL=llama-3.1-8b-instant
LLM_API_KEY=your-groq-api-key-here
```

**No code changes required!** The entire backend automatically switches to Groq.

### From Groq to Gemini

```bash
LLM_PROVIDER=gemini
LLM_MODEL=gemini-2.5-flash
LLM_API_KEY=your-gemini-api-key-here
```

## Supported Models

### Gemini Models
- `gemini-2.5-flash` (recommended, free tier compatible)
- `gemini-pro` (free tier compatible)
- `gemini-1.5-flash`
- `gemini-1.5-pro`

### Groq Models
- `llama-3.1-8b-instant` (recommended, fast)
- `llama-3.1-70b-versatile` (higher quality)
- `mixtral-8x7b-32768`
- Other Groq-supported models

## Usage in Code

### Simple Chat Call

```python
from llm_provider import llm_chat

response = llm_chat("Explain quantum computing", temperature=0.7, max_tokens=2048)
```

### Using the Provider Directly

```python
from llm_provider import get_llm_provider

llm = get_llm_provider()
response = llm.chat("What is AI?", temperature=0.7, max_tokens=2048)
```

### Streaming (if supported)

```python
from llm_provider import get_llm_provider

llm = get_llm_provider()
for chunk in llm.stream_chat("Tell me a story", temperature=0.7):
    print(chunk, end="", flush=True)
```

### Message Format

The provider accepts both string prompts and message lists:

```python
# String prompt
response = llm.chat("Hello, how are you?")

# Message list (conversation format)
messages = [
    {"role": "user", "content": "What is Python?"},
    {"role": "assistant", "content": "Python is a programming language."},
    {"role": "user", "content": "Tell me more"}
]
response = llm.chat(messages)
```

## Adding New Providers

To add a new provider (e.g., OpenAI, Claude):

1. Create a new class in `llm_provider.py` that inherits from `LLMProvider`
2. Implement the `chat()` and `stream_chat()` methods
3. Update `get_llm_provider()` to handle the new provider name
4. Add the provider's SDK to `requirements.txt`

Example:

```python
class OpenAIProvider(LLMProvider):
    def __init__(self, api_key: str, model_name: str):
        from openai import OpenAI
        self.client = OpenAI(api_key=api_key)
        self.model_name = model_name
    
    def chat(self, messages, temperature=0.7, max_tokens=2048, **kwargs):
        # Implementation here
        pass
    
    def stream_chat(self, messages, temperature=0.7, max_tokens=2048, **kwargs):
        # Implementation here
        pass
```

Then update `get_llm_provider()`:

```python
elif provider_name == "openai":
    _llm_provider = OpenAIProvider(api_key=api_key, model_name=model_name)
```

## Error Handling

The unified provider handles common errors consistently:

- **Quota/Rate Limit Errors**: Returns user-friendly error messages
- **Model Not Found**: Provides guidance on checking environment variables
- **API Errors**: Wraps errors with context

## Benefits

1. **Zero Code Changes**: Switch providers by updating `.env` only
2. **Consistent Interface**: Same API regardless of provider
3. **Easy Testing**: Switch providers to test different models
4. **Cost Optimization**: Use faster/cheaper providers when appropriate
5. **Fallback Support**: Easy to implement provider fallbacks

## Troubleshooting

### Provider Not Initializing

Check that your environment variables are set correctly:

```bash
echo $LLM_PROVIDER
echo $LLM_MODEL
echo $LLM_API_KEY
```

### Model Not Found

Verify the model name is correct for your chosen provider. Check provider documentation for available models.

### API Key Issues

Ensure your API key is valid and has the necessary permissions/quota.

## Migration Notes

All existing code using `_gemini_generate()` has been updated to use `_llm_generate()`, which internally uses the unified provider. The function signature remains the same, so no changes are needed in calling code.


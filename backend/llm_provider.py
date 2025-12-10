"""
Unified LLM Provider Interface
Supports multiple providers (Gemini, Groq) via environment configuration
"""
import os
from abc import ABC, abstractmethod
from typing import List, Dict, Optional, Union
from dotenv import load_dotenv

load_dotenv()


class LLMProvider(ABC):
    """Base class for LLM providers"""
    
    @abstractmethod
    def chat(
        self,
        messages: Union[str, List[Dict[str, str]]],
        temperature: float = 0.7,
        max_tokens: int = 2048,
        **kwargs
    ) -> str:
        """
        Send a chat request and return the response text.
        
        Args:
            messages: Either a string (single prompt) or list of message dicts with 'role' and 'content'
            temperature: Temperature for generation (0.0-1.0)
            max_tokens: Maximum tokens to generate
            **kwargs: Additional provider-specific parameters
            
        Returns:
            Response text as string
        """
        pass
    
    @abstractmethod
    def stream_chat(
        self,
        messages: Union[str, List[Dict[str, str]]],
        temperature: float = 0.7,
        max_tokens: int = 2048,
        **kwargs
    ):
        """
        Send a streaming chat request.
        
        Args:
            messages: Either a string (single prompt) or list of message dicts
            temperature: Temperature for generation
            max_tokens: Maximum tokens to generate
            **kwargs: Additional provider-specific parameters
            
        Yields:
            Chunks of response text
        """
        pass


class GeminiProvider(LLMProvider):
    """Google Gemini provider implementation"""
    
    def __init__(self, api_key: str, model_name: str):
        import google.generativeai as genai
        self.genai = genai
        self.model_name = model_name
        genai.configure(api_key=api_key)
        
        # Default safety settings for educational content
        self.safety_settings = [
            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
        ]
    
    def _convert_messages(self, messages: Union[str, List[Dict[str, str]]]) -> str:
        """Convert messages to Gemini prompt format"""
        if isinstance(messages, str):
            return messages
        
        # Convert message list to prompt string
        # Gemini typically uses simple string prompts, but we can format conversation
        prompt_parts = []
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role == "user":
                prompt_parts.append(f"User: {content}")
            elif role == "assistant":
                prompt_parts.append(f"Assistant: {content}")
            elif role == "system":
                prompt_parts.append(f"System: {content}")
        
        return "\n\n".join(prompt_parts)
    
    def chat(
        self,
        messages: Union[str, List[Dict[str, str]]],
        temperature: float = 0.7,
        max_tokens: int = 2048,
        **kwargs
    ) -> str:
        """Send chat request to Gemini"""
        try:
            prompt = self._convert_messages(messages)
            
            generation_config = {
                "temperature": min(max(temperature, 0.0), 1.0),  # Clamp 0-1
                "top_p": kwargs.get("top_p", 0.95),
                "top_k": kwargs.get("top_k", 40),
                "max_output_tokens": max_tokens,
            }
            
            model = self.genai.GenerativeModel(
                model_name=self.model_name,
                generation_config=generation_config,
                safety_settings=self.safety_settings
            )
            
            response = model.generate_content(prompt)
            
            # Check for safety filter blocks
            if response.candidates and len(response.candidates) > 0:
                candidate = response.candidates[0]
                if hasattr(candidate, 'finish_reason') and candidate.finish_reason == 2:
                    raise Exception(
                        "Response blocked by safety filter. Please try rephrasing your request."
                    )
            
            if not response.text:
                raise Exception("Empty response from Gemini API")
            
            return response.text.strip()
            
        except Exception as e:
            error_str = str(e)
            
            # Handle quota errors
            if "quota" in error_str.lower() or "429" in error_str:
                raise Exception(
                    f"API quota exceeded. Please check your plan and billing details. "
                    f"Error: {error_str[:200]}"
                )
            
            # Handle model not found
            if "not found" in error_str.lower() or "not supported" in error_str.lower() or "404" in error_str:
                raise Exception(
                    f"AI model '{self.model_name}' not found or not supported. "
                    f"Please check your LLM_MODEL environment variable. "
                    f"Error: {error_str[:200]}"
                )
            
            # Re-raise with context
            raise Exception(f"Gemini API error: {error_str}")
    
    def stream_chat(
        self,
        messages: Union[str, List[Dict[str, str]]],
        temperature: float = 0.7,
        max_tokens: int = 2048,
        **kwargs
    ):
        """Stream chat response from Gemini"""
        try:
            prompt = self._convert_messages(messages)
            
            generation_config = {
                "temperature": min(max(temperature, 0.0), 1.0),
                "top_p": kwargs.get("top_p", 0.95),
                "top_k": kwargs.get("top_k", 40),
                "max_output_tokens": max_tokens,
            }
            
            model = self.genai.GenerativeModel(
                model_name=self.model_name,
                generation_config=generation_config,
                safety_settings=self.safety_settings
            )
            
            response = model.generate_content(prompt, stream=True)
            
            for chunk in response:
                if chunk.text:
                    yield chunk.text
                    
        except Exception as e:
            error_str = str(e)
            if "quota" in error_str.lower() or "429" in error_str:
                raise Exception("API quota exceeded. Please try again later.")
            if "not found" in error_str.lower() or "404" in error_str:
                raise Exception(f"Model '{self.model_name}' not found.")
            raise Exception(f"Gemini streaming error: {error_str}")


class GroqProvider(LLMProvider):
    """Groq provider implementation"""
    
    def __init__(self, api_key: str, model_name: str):
        try:
            from groq import Groq
        except ImportError:
            raise ImportError(
                "Groq SDK not installed. Install it with: pip install groq"
            )
        
        self.client = Groq(api_key=api_key)
        self.model_name = model_name
    
    def _convert_messages(self, messages: Union[str, List[Dict[str, str]]]) -> List[Dict[str, str]]:
        """Convert messages to Groq format"""
        if isinstance(messages, str):
            return [{"role": "user", "content": messages}]
        
        # Groq expects list of dicts with 'role' and 'content'
        groq_messages = []
        for msg in messages:
            role = msg.get("role", "user")
            # Groq uses 'user' and 'assistant' roles
            if role == "system":
                # Groq doesn't have system role, prepend to first user message
                if groq_messages and groq_messages[0]["role"] == "user":
                    groq_messages[0]["content"] = f"System: {msg.get('content', '')}\n\n{groq_messages[0]['content']}"
                else:
                    groq_messages.append({"role": "user", "content": f"System: {msg.get('content', '')}"})
            else:
                groq_messages.append({
                    "role": role if role in ["user", "assistant"] else "user",
                    "content": msg.get("content", "")
                })
        
        return groq_messages
    
    def chat(
        self,
        messages: Union[str, List[Dict[str, str]]],
        temperature: float = 0.7,
        max_tokens: int = 2048,
        **kwargs
    ) -> str:
        """Send chat request to Groq"""
        try:
            groq_messages = self._convert_messages(messages)
            
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=groq_messages,
                temperature=min(max(temperature, 0.0), 2.0),  # Groq allows 0-2
                max_tokens=max_tokens,
                **{k: v for k, v in kwargs.items() if k not in ['top_p', 'top_k']}
            )
            
            if not response.choices or len(response.choices) == 0:
                raise Exception("Empty response from Groq API")
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            error_str = str(e)
            
            # Handle quota/rate limit errors
            if "quota" in error_str.lower() or "429" in error_str.lower() or "rate limit" in error_str.lower():
                raise Exception(
                    f"API quota/rate limit exceeded. Please try again later. "
                    f"Error: {error_str[:200]}"
                )
            
            # Handle model not found
            if "not found" in error_str.lower() or "404" in error_str:
                raise Exception(
                    f"AI model '{self.model_name}' not found or not supported. "
                    f"Please check your LLM_MODEL environment variable. "
                    f"Error: {error_str[:200]}"
                )
            
            raise Exception(f"Groq API error: {error_str}")
    
    def stream_chat(
        self,
        messages: Union[str, List[Dict[str, str]]],
        temperature: float = 0.7,
        max_tokens: int = 2048,
        **kwargs
    ):
        """Stream chat response from Groq"""
        try:
            groq_messages = self._convert_messages(messages)
            
            stream = self.client.chat.completions.create(
                model=self.model_name,
                messages=groq_messages,
                temperature=min(max(temperature, 0.0), 2.0),
                max_tokens=max_tokens,
                stream=True,
                **{k: v for k, v in kwargs.items() if k not in ['top_p', 'top_k']}
            )
            
            for chunk in stream:
                if chunk.choices and len(chunk.choices) > 0:
                    delta = chunk.choices[0].delta
                    if delta and delta.content:
                        yield delta.content
                        
        except Exception as e:
            error_str = str(e)
            if "quota" in error_str.lower() or "429" in error_str.lower() or "rate limit" in error_str.lower():
                raise Exception("API quota/rate limit exceeded. Please try again later.")
            if "not found" in error_str.lower() or "404" in error_str:
                raise Exception(f"Model '{self.model_name}' not found.")
            raise Exception(f"Groq streaming error: {error_str}")


# Global provider instance
_llm_provider: Optional[LLMProvider] = None


def get_llm_provider() -> LLMProvider:
    """
    Get the configured LLM provider instance.
    Uses environment variables: LLM_PROVIDER, LLM_MODEL, LLM_API_KEY
    """
    global _llm_provider
    
    if _llm_provider is not None:
        return _llm_provider
    
    provider_name = os.getenv("LLM_PROVIDER", "gemini").lower()
    model_name = os.getenv("LLM_MODEL")
    api_key = os.getenv("LLM_API_KEY")
    
    # Backward compatibility: check for old env vars
    if not api_key and provider_name == "gemini":
        api_key = os.getenv("GEMINI_API_KEY")
    if not model_name and provider_name == "gemini":
        model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    
    if not api_key:
        raise ValueError(
            f"LLM_API_KEY (or GEMINI_API_KEY for Gemini) environment variable is required. "
            f"Current provider: {provider_name}"
        )
    
    if not model_name:
        if provider_name == "groq":
            model_name = "llama-3.1-8b-instant"
        else:
            model_name = "gemini-2.5-flash"
        print(f"⚠️  LLM_MODEL not set, using default: {model_name}")
    
    # Create provider instance
    if provider_name == "groq":
        _llm_provider = GroqProvider(api_key=api_key, model_name=model_name)
        print(f"✅ Groq provider initialized with model: {model_name}")
    elif provider_name == "gemini":
        _llm_provider = GeminiProvider(api_key=api_key, model_name=model_name)
        print(f"✅ Gemini provider initialized with model: {model_name}")
    else:
        raise ValueError(
            f"Unsupported LLM provider: {provider_name}. "
            f"Supported providers: 'gemini', 'groq'"
        )
    
    return _llm_provider


def reset_provider():
    """Reset the global provider instance (useful for testing)"""
    global _llm_provider
    _llm_provider = None


# Convenience function for simple chat calls
def llm_chat(
    messages: Union[str, List[Dict[str, str]]],
    temperature: float = 0.7,
    max_tokens: int = 2048,
    **kwargs
) -> str:
    """
    Simple chat interface that uses the configured provider.
    
    Args:
        messages: String prompt or list of message dicts
        temperature: Generation temperature
        max_tokens: Max tokens to generate
        **kwargs: Provider-specific parameters
        
    Returns:
        Response text
    """
    provider = get_llm_provider()
    return provider.chat(messages, temperature=temperature, max_tokens=max_tokens, **kwargs)


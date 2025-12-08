"""
Orchestration Layer for StudyMind AI
Routes natural language queries to appropriate tools
"""

import json
import re
import time
import os
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime
import google.generativeai as genai
from functools import wraps


# Available tools mapping
AVAILABLE_TOOLS = {
    "quiz_generation": {
        "name": "Quiz Generator",
        "endpoint": "/quiz",
        "description": "Generate quiz questions on a topic",
        "keywords": ["quiz", "question", "test", "exam", "mcq", "multiple choice", "short answer"]
    },
    "content_generation": {
        "name": "Content Generator",
        "endpoint": "/content/create",
        "description": "Generate lecture content or study materials",
        "keywords": ["lecture", "content", "study guide", "study material", "notes", "summary", "guide"]
    },
    "flashcards": {
        "name": "Flashcard Creator",
        "endpoint": "/generate",
        "description": "Create flashcards from text or topic",
        "keywords": ["flashcard", "flash card", "card", "memorize", "memorization"]
    },
    "grading": {
        "name": "Grading & Feedback",
        "endpoint": "/grade",
        "description": "Grade student answers and provide feedback",
        "keywords": ["grade", "grading", "feedback", "evaluate", "score", "assessment"]
    },
    "explanation": {
        "name": "Explanation",
        "endpoint": "/generate",
        "description": "Explain concepts in simple terms",
        "keywords": ["explain", "explanation", "what is", "how does", "tell me about", "describe"]
    },
    "summarize": {
        "name": "Summarizer",
        "endpoint": "/generate",
        "description": "Summarize text or content",
        "keywords": ["summarize", "summary", "brief", "overview", "key points"]
    },
    "project_ideas": {
        "name": "Project Ideas",
        "endpoint": "/ideas",
        "description": "Generate project or lab ideas",
        "keywords": ["project", "idea", "lab", "assignment", "activity", "exercise"]
    },
    "admin_template": {
        "name": "Admin Template",
        "endpoint": "/admin/template",
        "description": "Generate administrative templates (emails, rubrics, etc.)",
        "keywords": ["template", "email", "rubric", "reminder", "course summary"]
    },
    "help": {
        "name": "Help",
        "endpoint": "/help",
        "description": "Get help about using the tool",
        "keywords": ["help", "how to", "how do i", "tutorial", "guide"]
    },
    "chat": {
        "name": "Chat",
        "endpoint": "/chat",
        "description": "General conversational assistance",
        "keywords": []  # Fallback for general queries
    }
}


def log_request(user_query: str, intent: str, confidence: float, tool_used: str, 
                execution_time: float, success: bool, error: Optional[str] = None,
                user_id: Optional[str] = None):
    """Log orchestration request to file"""
    try:
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "user_id": user_id or "unknown",
            "user_query": user_query,
            "intent_classified": intent,
            "confidence_score": confidence,
            "tool_executed": tool_used,
            "execution_time_ms": round(execution_time * 1000, 2),
            "success": success,
            "error_details": error
        }
        
        # Append to log file
        with open("orchestration_logs.jsonl", "a", encoding="utf-8") as f:
            f.write(json.dumps(log_entry) + "\n")
    except Exception as e:
        print(f"Error logging request: {e}")


def load_logs() -> List[Dict]:
    """Load orchestration logs"""
    try:
        logs = []
        with open("orchestration_logs.jsonl", "r", encoding="utf-8") as f:
            for line in f:
                if line.strip():
                    logs.append(json.loads(line))
        return logs
    except FileNotFoundError:
        return []
    except Exception as e:
        print(f"Error loading logs: {e}")
        return []


def keyword_classify(query: str) -> Optional[Tuple[str, float]]:
    """
    Fast keyword-based classification.
    Returns (intent, confidence) if match found, None otherwise.
    """
    query_lower = query.lower()
    
    # Score each tool based on keyword matches
    scores = {}
    for intent, tool_info in AVAILABLE_TOOLS.items():
        if intent == "chat":  # Skip chat as it's the fallback
            continue
            
        score = 0
        keywords = tool_info.get("keywords", [])
        for keyword in keywords:
            # Simple substring match (case-insensitive already handled by query_lower)
            if keyword in query_lower:
                # Boost score for whole word matches
                keyword_with_spaces = f" {keyword} "
                if keyword_with_spaces in f" {query_lower} " or query_lower == keyword or query_lower.startswith(keyword + " ") or query_lower.endswith(" " + keyword):
                    score += 3  # Strong match
                else:
                    score += 1  # Partial match
        
        if score > 0:
            scores[intent] = score
    
    if not scores:
        return None
    
    # Get highest scoring intent
    best_intent = max(scores.items(), key=lambda x: x[1])
    intent_name, score = best_intent
    
    # Confidence based on score
    # Higher confidence for clear keyword matches
    if score >= 3:
        confidence = 0.85  # Strong keyword match
    elif score >= 2:
        confidence = 0.75  # Good match
    else:
        confidence = 0.65  # Weak but valid match
    
    # Only return if confidence is reasonable
    if confidence >= 0.6:
        return (intent_name, confidence)
    
    return None


def llm_classify_intent(query: str, model_name: Optional[str] = None) -> Tuple[str, float, Dict]:
    """
    Use LLM to classify user intent and extract parameters.
    Returns (intent, confidence, extracted_params)
    """
    # Build tool descriptions for the prompt
    tool_descriptions = "\n".join([
        f"- {intent}: {info['description']} (keywords: {', '.join(info['keywords'][:3])})"
        for intent, info in AVAILABLE_TOOLS.items() if intent != "chat"
    ])
    
    classification_prompt = f"""You are an intent classifier for an educational study companion tool.

Available tools:
{tool_descriptions}

User query: "{query}"

Analyze the user's query and determine:
1. Which tool they want to use (intent)
2. Your confidence level (0.0 to 1.0)
3. Extract any relevant parameters from the query

Parameters to extract:
- topic: The subject/topic they're asking about
- difficulty: beginner, intermediate, or advanced (if mentioned)
- count: Number of items (questions, flashcards, etc.) if specified
- type: For quizzes: "mcq" or "short" (if mentioned)
- action: For content: "simplify" or "expand" (if mentioned)
- template: For admin: "reminder_email", "course_summary", or "grading_rubric" (if mentioned)
- level: For project ideas: beginner, intermediate, or advanced (if mentioned)

Respond with ONLY a valid JSON object in this exact format:
{{
  "intent": "intent_name",
  "confidence": 0.95,
  "parameters": {{
    "topic": "extracted topic or null",
    "difficulty": "beginner/intermediate/advanced or null",
    "count": 5 or null,
    "type": "mcq/short or null",
    "action": "simplify/expand or null",
    "template": "template_name or null",
    "level": "beginner/intermediate/advanced or null"
  }}
}}

Important:
- Use "chat" as intent only if the query is truly conversational and doesn't match any tool
- Confidence should be high (0.8+) if intent is clear, lower (0.5-0.7) if ambiguous
- Extract parameters only if explicitly mentioned or strongly implied
- Return null for parameters not found"""

    try:
        # Get model name from env if not provided
        if model_name is None:
            model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
        
        # Safety settings for educational content - less strict filters
        safety_settings = [
            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
        ]
        
        model = genai.GenerativeModel(
            model_name,
            safety_settings=safety_settings
        )
        response = model.generate_content(
            classification_prompt,
            generation_config={
                "temperature": 0.2,
                "max_output_tokens": 512,
            }
        )
        
        # Check for safety filter blocks
        if response.candidates and len(response.candidates) > 0:
            candidate = response.candidates[0]
            if hasattr(candidate, 'finish_reason') and candidate.finish_reason == 2:  # SAFETY
                print("Warning: Response blocked by safety filter, falling back to chat")
                return ("chat", 0.5, {})
        
        output = response.text.strip()
        
        # Extract JSON from response
        json_match = re.search(r'\{.*\}', output, re.DOTALL)
        if json_match:
            result = json.loads(json_match.group(0))
            intent = result.get("intent", "chat")
            confidence = float(result.get("confidence", 0.5))
            parameters = result.get("parameters", {})
            
            # Validate intent
            if intent not in AVAILABLE_TOOLS:
                intent = "chat"
                confidence = 0.5
            
            return (intent, confidence, parameters)
        else:
            return ("chat", 0.5, {})
            
    except Exception as e:
        error_str = str(e)
        print(f"Error in LLM classification: {error_str}")
        
        # Check if it's a quota error
        if "quota" in error_str.lower() or "429" in error_str:
            raise Exception(
                "API quota exceeded. The free tier for this model has been reached. "
                "Please try again later or contact support. "
                f"Details: {error_str[:200]}"
            )
        
        # Check if model not found
        if "not found" in error_str.lower() or "not supported" in error_str.lower() or "404" in error_str:
            raise Exception(
                f"AI model '{model_name}' not found or not supported. "
                "Please check your GEMINI_MODEL environment variable. "
                f"Error: {error_str[:200]}"
            )
        
        # For other errors, fall back to chat with low confidence
        print(f"Warning: LLM classification failed, falling back to chat intent. Error: {error_str[:100]}")
        return ("chat", 0.5, {})


def extract_parameters_from_query(query: str, intent: str) -> Dict[str, Any]:
    """
    Extract parameters from query using simple pattern matching.
    This is a fallback if LLM extraction fails.
    """
    params = {}
    query_lower = query.lower()
    
    # Extract topic (everything before common keywords)
    topic_patterns = [
        r"(?:about|on|for|regarding)\s+([^,\.]+)",
        r"create\s+(?:a\s+)?(?:quiz|flashcard|summary|guide|lecture)\s+(?:about|on|for)?\s*([^,\.]+)",
        r"explain\s+([^,\.]+)",
    ]
    
    for pattern in topic_patterns:
        match = re.search(pattern, query_lower)
        if match:
            params["topic"] = match.group(1).strip()
            break
    
    # Extract difficulty
    if any(word in query_lower for word in ["beginner", "easy", "basic"]):
        params["difficulty"] = "beginner"
    elif any(word in query_lower for word in ["intermediate", "medium"]):
        params["difficulty"] = "intermediate"
    elif any(word in query_lower for word in ["advanced", "hard", "expert"]):
        params["difficulty"] = "advanced"
    
    # Extract count
    count_match = re.search(r'(\d+)\s*(?:question|quiz|flashcard|item)', query_lower)
    if count_match:
        params["count"] = int(count_match.group(1))
    
    # Extract quiz type
    if "multiple choice" in query_lower or "mcq" in query_lower:
        params["type"] = "mcq"
    elif "short answer" in query_lower or "short" in query_lower:
        params["type"] = "short"
    
    return params


class Orchestrator:
    """Main orchestration class"""
    
    def __init__(self, app=None):
        self.app = app
        self.stats = {
            "total_requests": 0,
            "intent_distribution": {},
            "total_confidence": 0.0,
            "tool_usage": {},
            "total_execution_time": 0.0,
            "errors": 0
        }
    
    def classify_intent(self, query: str, explicit_intent: Optional[str] = None) -> Tuple[str, float, Dict]:
        """
        Classify user intent using keyword fallback + LLM.
        Returns (intent, confidence, parameters)
        """
        if explicit_intent:
            if explicit_intent in AVAILABLE_TOOLS:
                return (explicit_intent, 1.0, {})
            else:
                return ("chat", 0.5, {})
        
        # Try keyword classification first (fast path)
        keyword_result = keyword_classify(query)
        if keyword_result:
            intent, confidence = keyword_result
            print(f"✅ Keyword classification matched: {intent} (confidence: {confidence:.2f})")
            # Extract basic parameters
            params = extract_parameters_from_query(query, intent)
            return (intent, confidence, params)
        
        # Fall back to LLM classification
        print(f"⚠️ Keyword classification failed, trying LLM classification...")
        try:
            intent, confidence, params = llm_classify_intent(query)
            print(f"✅ LLM classification result: {intent} (confidence: {confidence:.2f})")
            return (intent, confidence, params)
        except Exception as e:
            print(f"❌ LLM classification failed: {str(e)}")
            # If LLM fails, try to extract intent from query anyway
            query_lower = query.lower()
            if "quiz" in query_lower or "question" in query_lower:
                return ("quiz_generation", 0.75, extract_parameters_from_query(query, "quiz_generation"))
            elif "flashcard" in query_lower:
                return ("flashcards", 0.75, extract_parameters_from_query(query, "flashcards"))
            elif "explain" in query_lower or "what is" in query_lower:
                return ("explanation", 0.75, extract_parameters_from_query(query, "explanation"))
            # Default fallback
            return ("chat", 0.5, {})
    
    def route_to_tool(self, intent: str, parameters: Dict, query: str, 
                     user_id: str, context: Optional[Dict] = None) -> Dict:
        """
        Route request to appropriate tool function.
        This calls the existing tool endpoints internally.
        Note: This function should be called from within app.py context where
        _gemini_generate and prompts are available.
        """
        # Import here to avoid circular imports
        # These imports work because route_to_tool is called from app.py
        from app import _gemini_generate, memory_manager
        from prompts import (
            quiz_prompt, lecture_content_prompt, ideas_prompt,
            admin_prompt, help_prompt, chat_prompt
        )
        
        # Get user's preferred tone
        tone_instruction = ""
        if memory_manager:
            try:
                memory = memory_manager.load_memory(user_id)
                preferred_tone = memory.get("preferred_tone", "professional")
                tone_instruction = memory_manager.get_tone_instruction(preferred_tone)
            except Exception as e:
                print(f"Error loading tone: {e}")
        
        tool_info = AVAILABLE_TOOLS.get(intent, AVAILABLE_TOOLS["chat"])
        
        # Prepare request data based on intent
        request_data = {}
        
        if intent == "quiz_generation":
            request_data = {
                "topic": parameters.get("topic") or query,
                "difficulty": parameters.get("difficulty", "beginner"),
                "type": parameters.get("type", "mcq"),
                "count": parameters.get("count", 5)
            }
            # Call quiz endpoint logic
            from app import _gemini_generate
            from prompts import quiz_prompt
            prompt = quiz_prompt(
                request_data["topic"],
                request_data["difficulty"],
                request_data["count"],
                request_data["type"]
            )
            result = _gemini_generate(prompt, temperature=0.5, max_tokens=2048)
            return {"quiz": result}
        
        elif intent == "content_generation":
            request_data = {
                "input": parameters.get("topic") or query,
                "difficulty": parameters.get("difficulty", "beginner")
            }
            prompt = lecture_content_prompt(
                request_data["input"],
                request_data["difficulty"]
            )
            # Add tone instruction if available
            if tone_instruction:
                prompt = tone_instruction + prompt
            result = _gemini_generate(prompt, temperature=0.5, max_tokens=3072)
            return {"content": result}
        
        elif intent == "flashcards":
            request_data = {
                "text": parameters.get("topic") or query,
                "task": "flashcards"
            }
            prompt = f"Create flashcards from this text:\n\n{request_data['text']}"
            result = _gemini_generate(prompt, temperature=0.7)
            return {"output": result, "task": "flashcards"}
        
        elif intent == "summarize":
            request_data = {
                "text": parameters.get("topic") or query,
                "task": "summarize"
            }
            prompt = f"Please summarize this text:\n\n{request_data['text']}"
            # Add tone instruction if available
            if tone_instruction:
                prompt = tone_instruction + prompt
            result = _gemini_generate(prompt, temperature=0.7)
            return {"output": result, "task": "summarize"}
        
        elif intent == "explanation":
            request_data = {
                "text": parameters.get("topic") or query,
                "task": "explain"
            }
            prompt = f"Explain this text simply:\n\n{request_data['text']}"
            # Add tone instruction if available
            if tone_instruction:
                prompt = tone_instruction + prompt
            result = _gemini_generate(prompt, temperature=0.7)
            return {"output": result, "task": "explain"}
        
        elif intent == "project_ideas":
            request_data = {
                "topic": parameters.get("topic") or query,
                "level": parameters.get("level", "beginner"),
                "variations": True
            }
            prompt = ideas_prompt(
                request_data["topic"],
                request_data["level"],
                request_data["variations"]
            )
            # Add tone instruction if available
            if tone_instruction:
                prompt = tone_instruction + prompt
            result = _gemini_generate(prompt, temperature=0.6, max_tokens=2048)
            return {"ideas": result}
        
        elif intent == "admin_template":
            # This requires more specific parameters
            template = parameters.get("template", "reminder_email")
            variables = {}
            prompt = admin_prompt(template, variables)
            # Add tone instruction if available
            if tone_instruction:
                prompt = tone_instruction + prompt
            result = _gemini_generate(prompt, temperature=0.4, max_tokens=1024)
            return {"output": result}
        
        elif intent == "help":
            request_data = {
                "question": query
            }
            prompt = help_prompt(request_data["question"])
            # Add tone instruction if available
            if tone_instruction:
                prompt = tone_instruction + prompt
            result = _gemini_generate(prompt, temperature=0.5, max_tokens=1024)
            return {"answer": result}
        
        elif intent == "grading":
            # Grading requires question and answer - return error if not provided
            return {
                "error": "Grading requires both a question and an answer. Please provide both.",
                "needs_clarification": True
            }
        
        else:  # chat fallback
            prompt = chat_prompt(query, [])
            # Add tone instruction if available
            if tone_instruction:
                prompt = tone_instruction + prompt
            result = _gemini_generate(prompt, temperature=0.7, max_tokens=2048)
            return {"response": result}
    
    def orchestrate(self, query: str, user_id: str, context: Optional[Dict] = None,
                   explicit_intent: Optional[str] = None) -> Dict:
        """
        Main orchestration function.
        Returns unified response format.
        """
        start_time = time.time()
        
        try:
            # Classify intent
            intent, confidence, parameters = self.classify_intent(query, explicit_intent)
            
            # Check if clarification is needed
            if confidence < 0.7 and not explicit_intent:
                # Generate clarification options
                clarification_options = []
                for intent_name, tool_info in AVAILABLE_TOOLS.items():
                    if intent_name != "chat":
                        clarification_options.append({
                            "intent": intent_name,
                            "name": tool_info["name"],
                            "description": tool_info["description"]
                        })
                
                execution_time = time.time() - start_time
                
                # Update stats
                self.stats["total_requests"] += 1
                self.stats["errors"] += 1
                
                log_request(query, intent, confidence, "none", execution_time, False,
                          "Low confidence - clarification needed", user_id)
                
                return {
                    "success": False,
                    "error": "ambiguous_query",
                    "message": "I'm not quite sure what you'd like me to do. Could you clarify?",
                    "intent": intent,
                    "confidence": confidence,
                    "needs_clarification": True,
                    "clarification_options": clarification_options[:5],  # Top 5 most relevant
                    "metadata": {
                        "processing_time": round(execution_time, 2),
                        "parameters_extracted": parameters
                    }
                }
            
            # Route to tool
            tool_info = AVAILABLE_TOOLS.get(intent, AVAILABLE_TOOLS["chat"])
            result = self.route_to_tool(intent, parameters, query, user_id, context)
            
            execution_time = time.time() - start_time
            
            # Update stats
            self.stats["total_requests"] += 1
            self.stats["intent_distribution"][intent] = self.stats["intent_distribution"].get(intent, 0) + 1
            self.stats["total_confidence"] += confidence
            self.stats["tool_usage"][tool_info["name"]] = self.stats["tool_usage"].get(tool_info["name"], 0) + 1
            self.stats["total_execution_time"] += execution_time
            
            log_request(query, intent, confidence, tool_info["name"], execution_time, True, None, user_id)
            
            return {
                "success": True,
                "intent": intent,
                "confidence": confidence,
                "tool_used": tool_info["name"],
                "result": result,
                "needs_clarification": False,
                "clarification_options": None,
                "metadata": {
                    "processing_time": round(execution_time, 2),
                    "parameters_extracted": parameters
                }
            }
            
        except Exception as e:
            execution_time = time.time() - start_time
            error_msg = str(e)
            
            # Update stats
            self.stats["total_requests"] += 1
            self.stats["errors"] += 1
            
            log_request(query, "error", 0.0, "none", execution_time, False, error_msg, user_id)
            
            return {
                "success": False,
                "error": "tool_execution_failed",
                "message": error_msg,
                "metadata": {
                    "processing_time": round(execution_time, 2)
                }
            }
    
    def get_stats(self) -> Dict:
        """Get orchestration statistics"""
        avg_confidence = (
            self.stats["total_confidence"] / self.stats["total_requests"]
            if self.stats["total_requests"] > 0 else 0.0
        )
        avg_execution_time = (
            self.stats["total_execution_time"] / self.stats["total_requests"]
            if self.stats["total_requests"] > 0 else 0.0
        )
        
        return {
            "total_requests": self.stats["total_requests"],
            "intent_distribution": self.stats["intent_distribution"],
            "average_confidence": round(avg_confidence, 3),
            "tool_usage_breakdown": self.stats["tool_usage"],
            "average_response_time_ms": round(avg_execution_time * 1000, 2),
            "error_count": self.stats["errors"],
            "success_rate": round(
                (self.stats["total_requests"] - self.stats["errors"]) / self.stats["total_requests"] * 100, 2
            ) if self.stats["total_requests"] > 0 else 0.0
        }


# Global orchestrator instance
orchestrator = Orchestrator()


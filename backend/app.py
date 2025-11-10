from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
from memory_manager import EducatorMemory
import os
import json
from datetime import datetime
from prompts import (
    lecture_content_prompt,
    slide_content_prompt,
    adjust_content_prompt,
    grading_prompt,
    quiz_prompt,
    admin_prompt,
    ideas_prompt,
    help_prompt,
    chat_prompt,
)
from typing import Optional
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

try:
    import PyPDF2  # type: ignore
except Exception:
    PyPDF2 = None
try:
    import pdfplumber  # type: ignore
except Exception:
    pdfplumber = None

app = Flask(__name__)
CORS(app)

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("⚠️  WARNING: GEMINI_API_KEY not found in environment variables!")
    print("   Set it with: export GEMINI_API_KEY='your-key-here'")
else:
    genai.configure(api_key=GEMINI_API_KEY)
    print("✅ Gemini API configured successfully")

# Model configuration
MODEL_NAME = "gemini-2.5-pro"  # Fast and free tier friendly
# Alternative: "gemini-1.5-pro" for better quality (but slower)

# Initialize memory manager
memory_manager = EducatorMemory(ollama_url=None)  # Pass None to use Gemini







import google.generativeai as genai

# After genai.configure(api_key=GEMINI_API_KEY)
print("\n📋 Available models:")
for model in genai.list_models():
    if 'generateContent' in model.supported_generation_methods:
        print(f"  - {model.name}")
print()






# Local data directory for saved outputs
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR, exist_ok=True)


def _now_ts() -> str:
    """Return ISO timestamp without microseconds for filenames."""
    return datetime.now().replace(microsecond=0).isoformat().replace(":", "-")


def _gemini_generate(prompt: str, temperature: float = 0.6, max_tokens: int = 2048) -> str:
    """
    Call Gemini API and return the string response, or raise an error.
    
    Args:
        prompt: The prompt to send to Gemini
        temperature: Controls randomness (0.0-1.0)
        max_tokens: Maximum tokens in response
    
    Returns:
        Generated text response
    """
    try:
        # Configure generation settings
        generation_config = {
            "temperature": temperature,
            "top_p": 0.95,
            "top_k": 40,
            "max_output_tokens": max_tokens,
        }
        
        # Safety settings (adjust as needed)
        safety_settings = [
            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
        ]
        
        # Initialize model
        model = genai.GenerativeModel(
            model_name=MODEL_NAME,
            generation_config=generation_config,
            safety_settings=safety_settings
        )
        
        # Generate content
        response = model.generate_content(prompt)
        
        # Extract text from response
        if response.text:
            return response.text.strip()
        else:
            # Handle case where response was blocked
            return "I apologize, but I couldn't generate a response. Please try rephrasing your request."
            
    except Exception as e:
        print(f"Gemini API Error: {str(e)}")
        raise Exception(f"Failed to generate content: {str(e)}")


def _write_text_file(content: str, prefix: str, ext: str = ".md") -> str:
    """Save text content to the data directory and return the file path."""
    safe_prefix = "".join(ch for ch in prefix if ch.isalnum() or ch in ("-", "_")) or "output"
    filename = f"{safe_prefix}_{_now_ts()}{ext}"
    path = os.path.join(DATA_DIR, filename)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    return path


def _append_jsonl(row: dict, filename: str) -> str:
    """Append a JSON line to a file under the data directory and return path."""
    path = os.path.join(DATA_DIR, filename)
    with open(path, "a", encoding="utf-8") as f:
        f.write(json.dumps(row, ensure_ascii=False) + "\n")
    return path


def build_prompt(task, text, user_id=None):
    """Build a context-aware prompt using educator memory."""
    text = text.strip()
    context = ""
    tone_instruction = ""
    
    # Add educator-specific context if user_id provided
    if user_id:
        memory = memory_manager.load_memory(user_id)
        memory_context = memory_manager.build_memory_context(memory)
        if memory_context:
            context = memory_context
        
        # Get tone instruction
        tone = memory.get("preferred_tone", "professional")
        tone_instruction = memory_manager.get_tone_instruction(tone)
    
    task_prompts = {
        "summarize": f"{tone_instruction}{context}Please summarize this text for teachers in a clear, actionable way:\n\n{text}",
        "quiz": f"{tone_instruction}{context}Generate 5 thoughtful quiz questions with answers from this text. Make them appropriate for the students:\n\n{text}",
        "flashcards": f"{tone_instruction}{context}Create flashcards (Q&A format) for students based on this text. Make them clear and memorable:\n\n{text}",
        "explain": f"{tone_instruction}{context}Explain this text in a simple, engaging way for students:\n\n{text}"
    }
    
    return task_prompts.get(task, f"{tone_instruction}{context}Summarize this text:\n\n{text}")


@app.route("/generate", methods=["POST"])
def generate():
    """Main endpoint for generating AI responses with memory integration."""
    data = request.json or {}
    text = data.get("text", "")
    task = data.get("task", "summarize")
    user_id = data.get("user_id", "default_user")
    
    if not text:
        return jsonify({"error": "No text provided"}), 400
    
    # Process the interaction and update memory
    try:
        updated_memory = memory_manager.process_interaction(user_id, text)
    except Exception as e:
        print(f"Error processing memory: {e}")
        updated_memory = {}
    
    # Build prompt with educator context and tone
    prompt = build_prompt(task, text, user_id)
    
    # Call Gemini
    try:
        output = _gemini_generate(prompt, temperature=0.7, max_tokens=2048)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
    # Return response with memory summary
    return jsonify({
        "output": output,
        "memory_summary": memory_manager.build_memory_context(updated_memory).replace("EDUCATOR CONTEXT: ", "").replace("\n\n", "").strip()
    })


# -------- Core Modules: Content Generation --------
@app.route("/content/create", methods=["POST"])
def content_create():
    data = request.json or {}
    topic_or_text = data.get("input", "").strip()
    difficulty = (data.get("difficulty", "beginner") or "beginner").lower()
    user_id = data.get("user_id", "default_user")

    if not topic_or_text:
        return jsonify({"error": "No input provided"}), 400

    try:
        # update memory with instructor message
        try:
            memory_manager.process_interaction(user_id, topic_or_text)
        except Exception:
            pass

        prompt = lecture_content_prompt(topic_or_text, difficulty)  # type: ignore[arg-type]
        output = _gemini_generate(prompt, temperature=0.5, max_tokens=3072)
        return jsonify({"content": output})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/content/slide", methods=["POST"])
def content_slide():
    data = request.json or {}
    markdown_content = data.get("content", "").strip()
    if not markdown_content:
        return jsonify({"error": "No content provided"}), 400
    try:
        prompt = slide_content_prompt(markdown_content)
        output = _gemini_generate(prompt, temperature=0.5, max_tokens=2048)
        return jsonify({"slides": output})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/content/adjust", methods=["POST"])
def content_adjust():
    data = request.json or {}
    text = data.get("content", "").strip()
    action = (data.get("action", "simplify") or "simplify").lower()
    if action not in ("simplify", "expand"):
        return jsonify({"error": "action must be 'simplify' or 'expand'"}), 400
    if not text:
        return jsonify({"error": "No content provided"}), 400
    try:
        prompt = adjust_content_prompt(text, action)  # type: ignore[arg-type]
        output = _gemini_generate(prompt, temperature=0.4, max_tokens=2048)
        return jsonify({"content": output})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/content/save", methods=["POST"])
def content_save():
    data = request.json or {}
    text = data.get("content", "")
    filename_prefix = data.get("name", "lecture")
    ext = ".md" if data.get("as_markdown", True) else ".txt"
    if not text:
        return jsonify({"error": "No content provided"}), 400
    try:
        path = _write_text_file(text, filename_prefix, ext)
        return jsonify({"saved_path": path})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -------- Core Modules: Grading & Feedback --------
@app.route("/grade", methods=["POST"])
def grade():
    data = request.json or {}
    question = data.get("question", "").strip()
    answer = data.get("answer", "").strip()
    is_code = bool(data.get("is_code", False))
    instructor_edit = data.get("instructor_edit", None)

    if not question or not answer:
        return jsonify({"error": "Both question and answer are required"}), 400
    try:
        prompt = grading_prompt(question, answer, is_code)
        raw = _gemini_generate(prompt, temperature=0.2, max_tokens=1024)

        # Try to parse JSON from model output
        parsed = {}
        try:
            # find JSON braces if model added text
            start = raw.find("{")
            end = raw.rfind("}")
            if start != -1 and end != -1 and end > start:
                parsed = json.loads(raw[start : end + 1])
        except Exception:
            parsed = {}

        # Fallback defaults
        grade_val = int(parsed.get("grade", 0)) if isinstance(parsed.get("grade"), (int, float)) else 0
        feedback_text = parsed.get("feedback") or ""
        detected_issues = parsed.get("detected_issues") or []
        strengths = parsed.get("strengths") or []

        if instructor_edit and isinstance(instructor_edit, str) and instructor_edit.strip():
            feedback_text = instructor_edit.strip()

        result = {
            "grade": max(0, min(100, grade_val)),
            "feedback": feedback_text,
            "detected_issues": detected_issues,
            "strengths": strengths,
        }

        _append_jsonl(
            {
                "ts": datetime.now().isoformat(),
                "question": question,
                "answer": answer,
                "is_code": is_code,
                "result": result,
            },
            "grading_history.jsonl",
        )
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -------- Core Modules: Quiz & Exercise Generator --------
@app.route("/quiz", methods=["POST"])
def quiz():
    data = request.json or {}
    topic = data.get("topic", "").strip()
    difficulty = (data.get("difficulty", "beginner") or "beginner").lower()
    qtype = (data.get("type", "mcq") or "mcq").lower()
    num_questions = int(data.get("count", 5))

    if not topic:
        return jsonify({"error": "No topic provided"}), 400
    if qtype not in ("mcq", "short"):
        return jsonify({"error": "type must be 'mcq' or 'short'"}), 400
    num_questions = max(1, min(20, num_questions))

    try:
        prompt = quiz_prompt(topic, difficulty, num_questions, qtype)  # type: ignore[arg-type]
        output = _gemini_generate(prompt, temperature=0.5, max_tokens=2048)
        return jsonify({"quiz": output})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -------- Storage & History --------
@app.route("/history", methods=["GET"])
def history():
    """Return saved history summaries."""
    items = []
    # List saved text files
    try:
        for fname in os.listdir(DATA_DIR):
            fpath = os.path.join(DATA_DIR, fname)
            if os.path.isfile(fpath) and (fname.endswith(".md") or fname.endswith(".txt")):
                items.append({"type": "file", "name": fname})
    except Exception:
        pass

    # Include grading history count
    grading_file = os.path.join(DATA_DIR, "grading_history.jsonl")
    grading_count = 0
    try:
        if os.path.exists(grading_file):
            with open(grading_file, "r", encoding="utf-8") as f:
                grading_count = sum(1 for _ in f)
    except Exception:
        grading_count = 0

    return jsonify({"items": items, "grading_entries": grading_count})


# -------- Admin Tools --------
@app.route("/admin/template", methods=["POST"])
def admin_template():
    data = request.json or {}
    template = (data.get("template", "") or "").lower()
    variables = data.get("variables", {}) or {}
    if template not in ("reminder_email", "course_summary", "grading_rubric"):
        return jsonify({"error": "template must be one of: reminder_email, course_summary, grading_rubric"}), 400
    try:
        prompt = admin_prompt(template, variables)
        output = _gemini_generate(prompt, temperature=0.4, max_tokens=1024)
        return jsonify({"output": output})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -------- Ideas & Projects --------
@app.route("/ideas", methods=["POST"])
def ideas():
    data = request.json or {}
    topic = data.get("topic", "").strip()
    level = (data.get("level", "beginner") or "beginner").lower()
    variations = bool(data.get("variations", True))
    if not topic:
        return jsonify({"error": "No topic provided"}), 400
    try:
        prompt = ideas_prompt(topic, level, variations)  # type: ignore[arg-type]
        output = _gemini_generate(prompt, temperature=0.6, max_tokens=2048)
        return jsonify({"ideas": output})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -------- Help / Mentor Chatbot --------
@app.route("/help", methods=["POST"])
def help_chat():
    data = request.json or {}
    question = data.get("question", "").strip()
    if not question:
        return jsonify({"error": "No question provided"}), 400
    try:
        prompt = help_prompt(question)
        answer = _gemini_generate(prompt, temperature=0.5, max_tokens=1024)
        return jsonify({"answer": answer})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -------- Conversational Chat --------
@app.route("/chat", methods=["POST"])
def chat():
    """Conversational chat endpoint with context awareness."""
    data = request.json or {}
    message = data.get("message", "").strip()
    user_id = data.get("user_id", "default_user")
    history = data.get("history", [])
    
    if not message:
        return jsonify({"error": "No message provided"}), 400
    
    try:
        # Process interaction for memory
        try:
            memory_manager.process_interaction(user_id, message)
        except Exception as e:
            print(f"Memory processing error: {e}")
        
        # Build chat prompt with history
        prompt = chat_prompt(message, history)
        
        # Generate response
        response = _gemini_generate(prompt, temperature=0.7, max_tokens=2048)
        
        return jsonify({"response": response})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -------- File Upload & Extraction --------
def _extract_text_from_pdf(file_path: str) -> str:
    """Extract text from PDF using multiple methods with detailed error logging."""
    extracted_text = ""
    
    # Try pdfplumber first (usually better for complex PDFs)
    if pdfplumber is not None:
        try:
            print(f"Attempting PDF extraction with pdfplumber: {file_path}")
            with pdfplumber.open(file_path) as pdf:
                pages_text = []
                for i, page in enumerate(pdf.pages):
                    try:
                        page_text = page.extract_text()
                        if page_text:
                            pages_text.append(f"--- Page {i+1} ---\n{page_text}")
                            print(f"Extracted {len(page_text)} chars from page {i+1}")
                    except Exception as e:
                        print(f"Error extracting page {i+1} with pdfplumber: {e}")
                        pages_text.append(f"--- Page {i+1} ---\n[Could not extract text]")
                
                extracted_text = "\n\n".join(pages_text).strip()
                if extracted_text:
                    print(f"pdfplumber: Successfully extracted {len(extracted_text)} characters")
                    return extracted_text
        except Exception as e:
            print(f"pdfplumber failed: {e}")
    
    # Try PyPDF2 as fallback
    if PyPDF2 is not None and not extracted_text:
        try:
            print(f"Attempting PDF extraction with PyPDF2: {file_path}")
            with open(file_path, "rb") as f:
                reader = PyPDF2.PdfReader(f)
                texts = []
                for i, page in enumerate(reader.pages):
                    try:
                        page_text = page.extract_text()
                        if page_text:
                            texts.append(f"--- Page {i+1} ---\n{page_text}")
                            print(f"Extracted {len(page_text)} chars from page {i+1}")
                    except Exception as e:
                        print(f"Error extracting page {i+1} with PyPDF2: {e}")
                        texts.append(f"--- Page {i+1} ---\n[Could not extract text]")
                
                extracted_text = "\n\n".join(texts).strip()
                if extracted_text:
                    print(f"PyPDF2: Successfully extracted {len(extracted_text)} characters")
                    return extracted_text
        except Exception as e:
            print(f"PyPDF2 failed: {e}")
    
    if not extracted_text:
        print(f"WARNING: No text could be extracted from PDF: {file_path}")
    
    return extracted_text


@app.route("/upload", methods=["POST"])
def upload_file():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400
    up = request.files["file"]
    if up.filename == "":
        return jsonify({"error": "Empty filename"}), 400
    
    print(f"\n{'='*60}")
    print(f"FILE UPLOAD: {up.filename}")
    print(f"{'='*60}")
    
    # Save to data dir
    safe_name = "".join(ch for ch in up.filename if ch.isalnum() or ch in (".", "-", "_"))
    if not safe_name:
        safe_name = f"upload_{_now_ts()}"
    save_path = os.path.join(DATA_DIR, safe_name)
    up.save(save_path)
    
    print(f"Saved to: {save_path}")
    print(f"File size: {os.path.getsize(save_path)} bytes")
    
    text = ""
    extraction_status = "success"
    
    if safe_name.lower().endswith(".pdf"):
        print("File type: PDF - Starting extraction...")
        text = _extract_text_from_pdf(save_path)
        if not text or len(text.strip()) < 50:
            extraction_status = "failed"
            print(f"⚠️ WARNING: Extraction resulted in {len(text)} characters (likely failed)")
        else:
            print(f"✅ Successfully extracted {len(text)} characters")
    else:
        print("File type: Text - Reading directly...")
        try:
            with open(save_path, "r", encoding="utf-8", errors="ignore") as f:
                text = f.read()
            print(f"✅ Successfully read {len(text)} characters")
        except Exception as e:
            print(f"❌ Error reading text file: {e}")
            extraction_status = "failed"
            text = ""
    
    print(f"{'='*60}\n")
    
    return jsonify({
        "filename": safe_name, 
        "extracted_text": text,
        "extraction_status": extraction_status,
        "char_count": len(text)
    })


@app.route("/tone/<user_id>", methods=["GET"])
def get_tone(user_id):
    """Get current tone for a user."""
    try:
        memory = memory_manager.load_memory(user_id)
        current_tone = memory.get("preferred_tone", "professional")
        return jsonify({
            "user_id": user_id,
            "tone": current_tone
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/tone/<user_id>", methods=["POST"])
def set_tone(user_id):
    """Set tone preference for a user."""
    data = request.json or {}
    tone = data.get("tone", "professional")
    
    # Validate tone
    available_tones = memory_manager.get_available_tones()
    if tone not in available_tones:
        return jsonify({"error": f"Invalid tone. Must be one of: {', '.join(available_tones)}"}), 400
    
    try:
        # Load existing memory
        memory = memory_manager.load_memory(user_id)
        if not memory:
            memory = memory_manager._empty_structure()
        
        # Update tone
        memory["preferred_tone"] = tone
        
        # Save memory
        memory_manager.save_memory(user_id, memory)
        
        return jsonify({
            "message": "Tone updated successfully",
            "user_id": user_id,
            "tone": tone
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/memory/<user_id>", methods=["GET"])
def get_memory(user_id):
    """Retrieve memory for a specific user."""
    try:
        memory = memory_manager.load_memory(user_id)
        return jsonify({
            "user_id": user_id,
            "memory": memory,
            "context": memory_manager.build_memory_context(memory)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/memory/<user_id>", methods=["DELETE"])
def clear_memory(user_id):
    """Clear memory for a specific user."""
    try:
        memory_manager.save_memory(user_id, {})
        return jsonify({"message": f"Memory cleared for user {user_id}"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/memory/<user_id>", methods=["PUT"])
def update_memory_manual(user_id):
    """Manually update memory for a user."""
    data = request.json or {}
    try:
        existing_memory = memory_manager.load_memory(user_id)
        updated_memory = memory_manager.update_memory(existing_memory, data)
        memory_manager.save_memory(user_id, updated_memory)
        return jsonify({
            "message": "Memory updated successfully",
            "memory": updated_memory
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint."""
    api_status = "configured" if GEMINI_API_KEY else "missing"
    return jsonify({
        "status": "healthy",
        "model": MODEL_NAME,
        "api_key_status": api_status
    })


# -------- Conversation Management --------
@app.route("/conversations/<user_id>", methods=["GET"])
def get_conversations(user_id):
    """Get all conversations for a user."""
    try:
        conversations_file = os.path.join(DATA_DIR, f"conversations_{user_id}.json")
        if not os.path.exists(conversations_file):
            return jsonify({"conversations": []})
        
        with open(conversations_file, "r", encoding="utf-8") as f:
            conversations = json.load(f)
        
        # Sort by timestamp (most recent first)
        conversations.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        return jsonify({"conversations": conversations})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/conversations/<user_id>", methods=["POST"])
def create_conversation(user_id):
    """Create a new conversation."""
    data = request.json or {}
    title = data.get("title", "New Conversation")
    
    try:
        conversations_file = os.path.join(DATA_DIR, f"conversations_{user_id}.json")
        
        # Load existing conversations
        conversations = []
        if os.path.exists(conversations_file):
            with open(conversations_file, "r", encoding="utf-8") as f:
                conversations = json.load(f)
        
        # Create new conversation
        new_conversation = {
            "id": str(datetime.now().timestamp()).replace(".", ""),
            "title": title,
            "messages": [],
            "timestamp": datetime.now().isoformat(),
            "lastMessage": ""
        }
        
        conversations.append(new_conversation)
        
        # Save conversations
        with open(conversations_file, "w", encoding="utf-8") as f:
            json.dump(conversations, f, ensure_ascii=False, indent=2)
        
        return jsonify({"conversation": new_conversation})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/conversations/<user_id>/<conversation_id>", methods=["GET"])
def get_conversation(user_id, conversation_id):
    """Get a specific conversation with all messages."""
    try:
        conversations_file = os.path.join(DATA_DIR, f"conversations_{user_id}.json")
        if not os.path.exists(conversations_file):
            return jsonify({"error": "Conversation not found"}), 404
        
        with open(conversations_file, "r", encoding="utf-8") as f:
            conversations = json.load(f)
        
        # Find the conversation
        conversation = next((c for c in conversations if c["id"] == conversation_id), None)
        if not conversation:
            return jsonify({"error": "Conversation not found"}), 404
        
        return jsonify({"conversation": conversation})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/conversations/<user_id>/<conversation_id>", methods=["PUT"])
def update_conversation(user_id, conversation_id):
    """Update a conversation (add messages, update title, etc.)."""
    data = request.json or {}
    
    try:
        conversations_file = os.path.join(DATA_DIR, f"conversations_{user_id}.json")
        if not os.path.exists(conversations_file):
            return jsonify({"error": "Conversation not found"}), 404
        
        with open(conversations_file, "r", encoding="utf-8") as f:
            conversations = json.load(f)
        
        # Find and update the conversation
        for i, conv in enumerate(conversations):
            if conv["id"] == conversation_id:
                if "messages" in data:
                    conversations[i]["messages"] = data["messages"]
                    # Update lastMessage
                    if data["messages"]:
                        last_msg = data["messages"][-1]
                        conversations[i]["lastMessage"] = last_msg.get("content", "")[:100]
                
                if "title" in data:
                    conversations[i]["title"] = data["title"]
                
                conversations[i]["timestamp"] = datetime.now().isoformat()
                
                # Save conversations
                with open(conversations_file, "w", encoding="utf-8") as f:
                    json.dump(conversations, f, ensure_ascii=False, indent=2)
                
                return jsonify({"conversation": conversations[i]})
        
        return jsonify({"error": "Conversation not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/conversations/<user_id>/<conversation_id>", methods=["DELETE"])
def delete_conversation(user_id, conversation_id):
    """Delete a conversation."""
    try:
        conversations_file = os.path.join(DATA_DIR, f"conversations_{user_id}.json")
        if not os.path.exists(conversations_file):
            return jsonify({"error": "Conversation not found"}), 404
        
        with open(conversations_file, "r", encoding="utf-8") as f:
            conversations = json.load(f)
        
        # Filter out the conversation to delete
        conversations = [c for c in conversations if c["id"] != conversation_id]
        
        # Save conversations
        with open(conversations_file, "w", encoding="utf-8") as f:
            json.dump(conversations, f, ensure_ascii=False, indent=2)
        
        return jsonify({"message": "Conversation deleted successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Add new route for retrieving saved files
@app.route("/file", methods=["GET"])
def get_file():
    """Retrieve content of a saved file from the data directory."""
    filename = request.args.get("name", "").strip()
    if not filename:
        return jsonify({"error": "No filename provided"}), 400

    # Sanitize filename and enforce data dir containment
    safe_name = "".join(ch for ch in filename if ch.isalnum() or ch in (".", "-", "_"))
    if not safe_name or not (safe_name.endswith(".txt") or safe_name.endswith(".md")):
        return jsonify({"error": "Invalid filename"}), 400

    file_path = os.path.join(DATA_DIR, safe_name)
    if not os.path.exists(file_path) or not os.path.isfile(file_path):
        return jsonify({"error": "File not found"}), 404

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        return jsonify({
            "name": safe_name,
            "content": content
        })
    except Exception as e:
        return jsonify({"error": f"Failed to read file: {str(e)}"}), 500


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(debug=False, host="0.0.0.0", port=port)
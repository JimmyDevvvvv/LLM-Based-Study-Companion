from flask import Flask, request, jsonify
from flask_cors import CORS
from memory_manager import EducatorMemory
from db_manager import DatabaseManager, FileConversationStore
from auth_manager import AuthManager, require_auth, optional_auth
from llm_provider import get_llm_provider, llm_chat
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
from orchestrator import orchestrator

# Load environment variables
load_dotenv()

try:
    import PyPDF2
except Exception:
    PyPDF2 = None
try:
    import pdfplumber
except Exception:
    pdfplumber = None

app = Flask(__name__)

# CORS configuration
CORS(app, resources={
    r"/*": {
        "origins": [
            "https://llm-based-study-companion.netlify.app",  # Netlify production
            "http://localhost:3000",  # Local development
            "http://127.0.0.1:3000"  # Local development alternative
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Unified LLM provider will be initialized lazily on first use
# Configured via environment variables: LLM_PROVIDER, LLM_MODEL, LLM_API_KEY
# Provider is initialized when _llm_generate is first called
llm = None

# Configure Database
MONGODB_URI = os.getenv("MONGODB_URI")
if MONGODB_URI:
    try:
        db = DatabaseManager(MONGODB_URI)
        print("✅ Database connected")
    except Exception as e:
        print(f"⚠️  Database connection failed: {e}")
        db = None
else:
    print("⚠️  No MONGODB_URI found - database features disabled")
    db = None

# Conversation store (DB or file fallback)
conversation_store = db if db else FileConversationStore()

# Configure Auth
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-this-in-production")
if db:
    try:
        auth_manager = AuthManager(JWT_SECRET, db)
        print("✅ Auth manager initialized")
    except Exception as e:
        print(f"⚠️  Auth initialization failed: {e}")
        auth_manager = None
else:
    print("⚠️  No database - auth features disabled")
    auth_manager = None

# Initialize memory manager with DB support
memory_manager = EducatorMemory(db_manager=db)

# Middleware to add auth_manager to request
@app.before_request
def before_request():
    request.environ['auth_manager'] = auth_manager


def _llm_generate(prompt: str, temperature: float = 0.6, max_tokens: int = 2048) -> str:
    """Call unified LLM provider and return response"""
    global llm
    
    # Lazy initialization
    if llm is None:
        try:
            llm = get_llm_provider()
        except Exception as e:
            raise Exception(
                f"LLM provider initialization failed: {str(e)}. "
                f"Please check your LLM_PROVIDER, LLM_MODEL, and LLM_API_KEY environment variables."
            )
    
    try:
        return llm.chat(prompt, temperature=temperature, max_tokens=max_tokens)
    except Exception as e:
        error_str = str(e)
        print(f"LLM API Error: {error_str}")
        raise


def _extract_text_from_pdf(file_path: str) -> str:
    """Extract text from PDF"""
    extracted_text = ""
    
    if pdfplumber is not None:
        try:
            with pdfplumber.open(file_path) as pdf:
                pages_text = []
                for i, page in enumerate(pdf.pages):
                    try:
                        page_text = page.extract_text()
                        if page_text:
                            pages_text.append(f"--- Page {i+1} ---\n{page_text}")
                    except Exception as e:
                        print(f"Error extracting page {i+1}: {e}")
                
                extracted_text = "\n\n".join(pages_text).strip()
                if extracted_text:
                    return extracted_text
        except Exception as e:
            print(f"pdfplumber failed: {e}")
    
    if PyPDF2 is not None and not extracted_text:
        try:
            with open(file_path, "rb") as f:
                reader = PyPDF2.PdfReader(f)
                texts = []
                for i, page in enumerate(reader.pages):
                    try:
                        page_text = page.extract_text()
                        if page_text:
                            texts.append(f"--- Page {i+1} ---\n{page_text}")
                    except Exception as e:
                        print(f"Error extracting page {i+1}: {e}")
                
                extracted_text = "\n\n".join(texts).strip()
        except Exception as e:
            print(f"PyPDF2 failed: {e}")
    
    return extracted_text


# ==================== AUTH ENDPOINTS ====================

@app.route("/auth/signup", methods=["POST"])
def signup():
    """Register a new user"""
    data = request.json or {}
    email = data.get("email", "").strip()
    password = data.get("password", "").strip()
    
    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400
    
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400
    
    if not auth_manager:
        return jsonify({"error": "Auth not configured"}), 503
    
    try:
        result = auth_manager.register_user(email, password)
        if not result:
            return jsonify({"error": "User already exists"}), 409
        
        return jsonify({
            "user": {
                "id": result['user_id'],
                "email": result['email']
            },
            "token": result['token']
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/auth/login", methods=["POST"])
def login():
    """Login a user"""
    data = request.json or {}
    email = data.get("email", "").strip()
    password = data.get("password", "").strip()
    
    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400
    
    if not auth_manager:
        return jsonify({"error": "Auth not configured"}), 503
    
    try:
        result = auth_manager.login_user(email, password)
        if not result:
            return jsonify({"error": "Invalid email or password"}), 401
        
        return jsonify({
            "user": {
                "id": result['user_id'],
                "email": result['email']
            },
            "token": result['token']
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/auth/user", methods=["GET"])
@require_auth
def get_current_user():
    """Get current authenticated user"""
    user = request.user
    
    # Get or create user in database
    if db:
        db_user = db.get_user(user['user_id'])
        if not db_user:
            db_user = db.create_user(user['user_id'], user.get('email', ''))
    else:
        db_user = {'user_id': user['user_id'], 'email': user.get('email')}
    
    return jsonify({
        'user_id': user['user_id'],
        'email': user.get('email'),
        'created_at': db_user.get('created_at').isoformat() if db_user.get('created_at') else None
    })


# ==================== CHAT & GENERATION ====================

@app.route("/chat", methods=["POST"])
@optional_auth
def chat():
    """Conversational chat with optional auth"""
    data = request.json or {}
    message = data.get("message", "").strip()
    history = data.get("history", [])
    user_id = request.user['user_id']
    
    if not message:
        return jsonify({"error": "No message provided"}), 400
    
    try:
        # Process memory
        if memory_manager:
            try:
                memory_manager.process_interaction(user_id, message)
            except Exception as e:
                print(f"Memory error: {e}")
        
        prompt = chat_prompt(message, history)
        response = _llm_generate(prompt, temperature=0.7, max_tokens=2048)
        
        return jsonify({"response": response})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/generate", methods=["POST"])
@optional_auth
def generate():
    """Generate content with optional auth"""
    data = request.json or {}
    text = data.get("text", "")
    task = data.get("task", "summarize")
    user_id = request.user['user_id']
    
    if not text:
        return jsonify({"error": "No text provided"}), 400
    
    # Build prompt based on task
    task_prompts = {
        "summarize": f"Please summarize this text:\n\n{text}",
        "quiz": f"Generate 5 quiz questions from this text:\n\n{text}",
        "flashcards": f"Create flashcards from this text:\n\n{text}",
        "explain": f"Explain this text simply:\n\n{text}"
    }
    
    prompt = task_prompts.get(task, f"Summarize:\n\n{text}")
    
    try:
        output = _llm_generate(prompt, temperature=0.7)
        return jsonify({"output": output, "memory_summary": ""})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==================== CONTENT GENERATION ====================

@app.route("/content/create", methods=["POST"])
@optional_auth
def content_create():
    data = request.json or {}
    topic = data.get("input", "").strip()
    difficulty = data.get("difficulty", "beginner").lower()
    user_id = request.user['user_id']

    if not topic:
        return jsonify({"error": "No input provided"}), 400

    try:
        prompt = lecture_content_prompt(topic, difficulty)
        output = _llm_generate(prompt, temperature=0.5, max_tokens=3072)
        return jsonify({"content": output})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/content/slide", methods=["POST"])
@optional_auth
def content_slide():
    data = request.json or {}
    content = data.get("content", "").strip()
    if not content:
        return jsonify({"error": "No content provided"}), 400
    try:
        prompt = slide_content_prompt(content)
        output = _llm_generate(prompt, temperature=0.5, max_tokens=2048)
        return jsonify({"slides": output})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/content/adjust", methods=["POST"])
@optional_auth
def content_adjust():
    data = request.json or {}
    text = data.get("content", "").strip()
    action = data.get("action", "simplify").lower()
    
    if action not in ("simplify", "expand"):
        return jsonify({"error": "action must be 'simplify' or 'expand'"}), 400
    if not text:
        return jsonify({"error": "No content provided"}), 400
    
    try:
        prompt = adjust_content_prompt(text, action)
        output = _llm_generate(prompt, temperature=0.4, max_tokens=2048)
        return jsonify({"content": output})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/content/save", methods=["POST"])
@optional_auth
def content_save():
    data = request.json or {}
    content = data.get("content", "")
    name = data.get("name", "lecture")
    as_markdown = data.get("as_markdown", True)
    user_id = request.user['user_id']
    
    if not content:
        return jsonify({"error": "No content provided"}), 400
    
    try:
        if db:
            content_type = "md" if as_markdown else "txt"
            filename = db.save_content(user_id, content, name, content_type)
            return jsonify({"saved_path": filename})
        else:
            return jsonify({"error": "Database not configured"}), 503
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==================== GRADING ====================

@app.route("/grade", methods=["POST"])
@optional_auth
def grade():
    data = request.json or {}
    question = data.get("question", "").strip()
    answer = data.get("answer", "").strip()
    is_code = bool(data.get("is_code", False))
    user_id = request.user['user_id']

    if not question or not answer:
        return jsonify({"error": "Both question and answer required"}), 400
    
    try:
        prompt = grading_prompt(question, answer, is_code)
        raw = _llm_generate(prompt, temperature=0.2, max_tokens=1024)

        parsed = {}
        try:
            start = raw.find("{")
            end = raw.rfind("}")
            if start != -1 and end != -1:
                parsed = json.loads(raw[start:end+1])
        except:
            pass

        result = {
            "grade": max(0, min(100, int(parsed.get("grade", 0)))),
            "feedback": parsed.get("feedback", ""),
            "detected_issues": parsed.get("detected_issues", []),
            "strengths": parsed.get("strengths", []),
        }

        # Save to database if available
        if db:
            db.save_grading(user_id, question, answer, result, is_code)

        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==================== QUIZ ====================

@app.route("/quiz", methods=["POST"])
@optional_auth
def quiz():
    data = request.json or {}
    topic = data.get("topic", "").strip()
    difficulty = data.get("difficulty", "beginner").lower()
    qtype = data.get("type", "mcq").lower()
    num_questions = max(1, min(20, int(data.get("count", 5))))

    if not topic:
        return jsonify({"error": "No topic provided"}), 400
    if qtype not in ("mcq", "short"):
        return jsonify({"error": "type must be 'mcq' or 'short'"}), 400

    try:
        prompt = quiz_prompt(topic, difficulty, num_questions, qtype)
        output = _llm_generate(prompt, temperature=0.5, max_tokens=2048)
        return jsonify({"quiz": output})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==================== CONVERSATIONS ====================

@app.route("/conversations/<user_id>", methods=["GET"])
@optional_auth
def get_conversations(user_id):
    """Get all conversations"""
    # Verify access
    if request.user['user_id'] != user_id and request.user.get('role') != 'admin':
        return jsonify({"error": "Unauthorized"}), 403
    
    try:
        conversations = conversation_store.get_conversations(user_id)
        return jsonify({"conversations": conversations})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/conversations/<user_id>", methods=["POST"])
@optional_auth
def create_conversation(user_id):
    """Create new conversation"""
    if request.user['user_id'] != user_id:
        return jsonify({"error": "Unauthorized"}), 403
    
    data = request.json or {}
    title = data.get("title", "New Conversation")
    
    try:
        conv_id = conversation_store.create_conversation(user_id, title)
        conversation = conversation_store.get_conversation(user_id, conv_id)
        return jsonify({"conversation": conversation})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/conversations/<user_id>/<conversation_id>", methods=["GET"])
@optional_auth
def get_conversation(user_id, conversation_id):
    """Get specific conversation"""
    if request.user['user_id'] != user_id:
        return jsonify({"error": "Unauthorized"}), 403
    
    try:
        conversation = conversation_store.get_conversation(user_id, conversation_id)
        if not conversation:
            return jsonify({"error": "Not found"}), 404
        return jsonify({"conversation": conversation})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/conversations/<user_id>/<conversation_id>", methods=["PUT"])
@optional_auth
def update_conversation(user_id, conversation_id):
    """Update conversation"""
    if request.user['user_id'] != user_id:
        return jsonify({"error": "Unauthorized"}), 403
    
    data = request.json or {}
    messages = data.get("messages")
    title = data.get("title")
    
    try:
        updated = conversation_store.update_conversation(user_id, conversation_id, messages, title)
        if not updated:
            return jsonify({"error": "Not found"}), 404
        conversation = conversation_store.get_conversation(user_id, conversation_id)
        return jsonify({"conversation": conversation})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/conversations/<user_id>/<conversation_id>", methods=["DELETE"])
@optional_auth
def delete_conversation(user_id, conversation_id):
    """Delete conversation"""
    if request.user['user_id'] != user_id:
        return jsonify({"error": "Unauthorized"}), 403
    
    try:
        deleted = conversation_store.delete_conversation(user_id, conversation_id)
        if not deleted:
            return jsonify({"error": "Not found"}), 404
        return jsonify({"message": "Deleted"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==================== MEMORY ====================

@app.route("/memory/<user_id>", methods=["GET"])
@optional_auth
def get_memory(user_id):
    """Get user memory"""
    if request.user['user_id'] != user_id:
        return jsonify({"error": "Unauthorized"}), 403
    
    try:
        memory = memory_manager.load_memory(user_id)
        return jsonify({"user_id": user_id, "memory": memory})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/memory/<user_id>", methods=["PUT"])
@optional_auth
def update_memory(user_id):
    """Update memory"""
    if request.user['user_id'] != user_id:
        return jsonify({"error": "Unauthorized"}), 403
    
    data = request.json or {}
    try:
        memory_manager.save_memory(user_id, data)
        return jsonify({"message": "Updated"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/memory/<user_id>", methods=["DELETE"])
@optional_auth
def clear_memory(user_id):
    """Clear memory"""
    if request.user['user_id'] != user_id:
        return jsonify({"error": "Unauthorized"}), 403
    
    try:
        memory_manager.save_memory(user_id, {})
        return jsonify({"message": "Cleared"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==================== TONE ====================

@app.route("/tone/<user_id>", methods=["GET"])
@optional_auth
def get_tone(user_id):
    """Get tone"""
    try:
        memory = memory_manager.load_memory(user_id) if memory_manager else {}
        return jsonify({"user_id": user_id, "tone": memory.get("preferred_tone", "professional")})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/tone/<user_id>", methods=["POST"])
@optional_auth
def set_tone(user_id):
    """Set tone"""
    data = request.json or {}
    tone = data.get("tone", "professional")
    
    available = memory_manager.get_available_tones()
    if tone not in available:
        return jsonify({"error": f"Invalid tone. Options: {', '.join(available)}"}), 400
    
    try:
        memory = memory_manager.load_memory(user_id) or {}
        memory["preferred_tone"] = tone
        memory_manager.save_memory(user_id, memory)
        return jsonify({"message": "Updated", "tone": tone})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==================== FILE UPLOAD ====================

@app.route("/upload", methods=["POST"])
@optional_auth
def upload_file():
    """Upload and extract file"""
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "Empty filename"}), 400
    
    import tempfile
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1])
    file.save(temp_file.name)
    
    text = ""
    status = "success"
    
    try:
        if file.filename.lower().endswith(".pdf"):
            text = _extract_text_from_pdf(temp_file.name)
            if not text or len(text.strip()) < 50:
                status = "failed"
        else:
            with open(temp_file.name, "r", encoding="utf-8", errors="ignore") as f:
                text = f.read()
    except Exception as e:
        print(f"Error: {e}")
        status = "failed"
    finally:
        os.unlink(temp_file.name)
    
    return jsonify({
        "filename": file.filename,
        "extracted_text": text,
        "extraction_status": status,
        "char_count": len(text)
    })


# ==================== ADMIN & OTHER ====================

@app.route("/admin/template", methods=["POST"])
@optional_auth
def admin_template():
    data = request.json or {}
    template = data.get("template", "").lower()
    variables = data.get("variables", {})
    
    if template not in ("reminder_email", "course_summary", "grading_rubric"):
        return jsonify({"error": "Invalid template"}), 400
    
    try:
        prompt = admin_prompt(template, variables)
        output = _llm_generate(prompt, temperature=0.4, max_tokens=1024)
        return jsonify({"output": output})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/ideas", methods=["POST"])
@optional_auth
def ideas():
    data = request.json or {}
    topic = data.get("topic", "").strip()
    level = data.get("level", "beginner").lower()
    variations = bool(data.get("variations", True))
    
    if not topic:
        return jsonify({"error": "No topic"}), 400
    
    try:
        prompt = ideas_prompt(topic, level, variations)
        output = _llm_generate(prompt, temperature=0.6, max_tokens=2048)
        return jsonify({"ideas": output})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/help", methods=["POST"])
@optional_auth
def help_chat():
    data = request.json or {}
    question = data.get("question", "").strip()
    
    if not question:
        return jsonify({"error": "No question"}), 400
    
    try:
        prompt = help_prompt(question)
        answer = _llm_generate(prompt, temperature=0.5, max_tokens=1024)
        return jsonify({"answer": answer})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/history", methods=["GET"])
@optional_auth
def history():
    """Get history"""
    user_id = request.user['user_id']
    
    try:
        if db:
            saved_content = db.get_saved_content(user_id, limit=50)
            grading_history = db.get_grading_history(user_id, limit=50)
            
            return jsonify({
                "items": [{"name": item['filename'], "type": "file"} for item in saved_content],
                "grading_entries": len(grading_history)
            })
        else:
            return jsonify({"items": [], "grading_entries": 0})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/health", methods=["GET"])
def health_check():
    """Health check"""
    return jsonify({
        "status": "healthy",
        "model": MODEL_NAME,
        "database": "connected" if db else "disabled",
        "auth": "configured" if auth_manager else "disabled"
    })


# ==================== ORCHESTRATION ====================

@app.route("/study/assist", methods=["POST"])
@optional_auth
def study_assist():
    """Unified orchestration endpoint for natural language queries"""
    data = request.json or {}
    query = data.get("query", "").strip()
    context = data.get("context", {})
    explicit_intent = data.get("explicit_intent")
    user_id = request.user['user_id']
    
    if not query:
        return jsonify({
            "success": False,
            "error": "No query provided",
            "message": "Please provide a query"
        }), 400
    
    try:
        result = orchestrator.orchestrate(
            query=query,
            user_id=user_id,
            context=context,
            explicit_intent=explicit_intent
        )
        
        status_code = 200 if result.get("success") else 400
        return jsonify(result), status_code
        
    except Exception as e:
        error_str = str(e)
        error_lower = error_str.lower()
        
        # Determine error type and status code
        if "quota" in error_lower or "429" in error_lower:
            error_type = "quota_exceeded"
            status_code = 429
            user_message = "Daily AI request limit reached — please try again tomorrow."
        elif "not found" in error_lower or "not supported" in error_lower or "404" in error_str:
            error_type = "model_not_found"
            status_code = 500
            user_message = "AI model configuration error. Please contact support."
        elif "safety" in error_lower or "blocked" in error_lower:
            error_type = "content_filtered"
            status_code = 400
            user_message = "Content was blocked by safety filters. Please try rephrasing your request."
        else:
            error_type = "internal_error"
            status_code = 500
            user_message = "Something went wrong. Please try again."
        
        print(f"Error in study_assist: {error_type} - {error_str}")
        
        return jsonify({
            "success": False,
            "error": error_type,
            "message": user_message,
            "details": error_str[:200] if error_str != user_message else None
        }), status_code


@app.route("/orchestration/stats", methods=["GET"])
@optional_auth
def orchestration_stats():
    """Get orchestration statistics"""
    try:
        stats = orchestrator.get_stats()
        return jsonify(stats)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(debug=False, host="0.0.0.0", port=port)
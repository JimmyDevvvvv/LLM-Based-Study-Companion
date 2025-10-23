from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from memory_manager import EducatorMemory

app = Flask(__name__)
CORS(app)

# Ollama API endpoint
OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "mistral"

# Initialize memory manager
memory_manager = EducatorMemory()

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
    
    # Call Ollama
    try:
        resp = requests.post(
            OLLAMA_URL,
            json={
                "model": MODEL_NAME, 
                "prompt": prompt, 
                "stream": False,
                "temperature": 0.7
            },
            timeout=120
        )
        resp.raise_for_status()
    except requests.exceptions.Timeout:
        return jsonify({"error": "Request timed out. Please try again."}), 504
    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Failed to connect to Ollama: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
    payload = resp.json()
    output = payload.get("response", "").strip()
    
    # Return response with memory summary
    return jsonify({
        "output": output,
        "memory_summary": memory_manager.build_memory_context(updated_memory).replace("EDUCATOR CONTEXT: ", "").replace("\n\n", "").strip()
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
    return jsonify({"status": "healthy", "model": MODEL_NAME})

if __name__ == "__main__":
    app.run(debug=True, port=5000)
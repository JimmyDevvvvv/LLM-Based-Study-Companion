from flask import Flask, request, jsonify
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app)

# Ollama API endpoint
OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "mistral"   # you can swap to "llama3" or "phi3" after pulling them

def build_prompt(task, text):
    text = text.strip()
    if task == "summarize":
        return f"Summarize this text for teachers:\n\n{text}"
    if task == "quiz":
        return f"Generate 5 quiz questions with answers from this text:\n\n{text}"
    if task == "flashcards":
        return f"Make flashcards (Q&A) for students based on this text:\n\n{text}"
    if task == "explain":
        return f"Explain this text simply for students:\n\n{text}"
    return f"Summarize:\n\n{text}"

@app.route("/generate", methods=["POST"])
def generate():
    data = request.json or {}
    text = data.get("text", "")
    task = data.get("task", "summarize")

    prompt = build_prompt(task, text)

    # Call Ollama
    try:
        resp = requests.post(
            OLLAMA_URL,
            json={"model": MODEL_NAME, "prompt": prompt, "stream": False},
            timeout=120
        )
        resp.raise_for_status()
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    payload = resp.json()
    output = payload.get("response", "").strip()

    return jsonify({"output": output})

if __name__ == "__main__":
    app.run(debug=True)

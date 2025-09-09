from flask import Flask, request, jsonify
from flask_cors import CORS
import openai

app = Flask(__name__)
CORS(app)

# Set your API key
openai.api_key = "YOUR_OPENAI_KEY"

@app.route("/generate", methods=["POST"])
def generate():
    data = request.json
    text = data.get("text", "")
    task = data.get("task", "")

    prompt_map = {
        "summarize": f"Summarize this text for teachers:\n{text}",
        "quiz": f"Generate 5 quiz questions with answers from this text:\n{text}",
        "flashcards": f"Make flashcards (Q&A) for students based on this text:\n{text}",
        "explain": f"Explain this text simply for students:\n{text}"
    }

    prompt = prompt_map.get(task, "Summarize:\n" + text)

    response = openai.Completion.create(
        model="text-davinci-003",
        prompt=prompt,
        max_tokens=300
    )

    return jsonify({"output": response.choices[0].text.strip()})

if __name__ == "__main__":
    app.run(debug=True)

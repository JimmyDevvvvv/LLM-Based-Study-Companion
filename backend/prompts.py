"""
Centralized prompt templates for the educator assistant features.

All prompts are designed to work with local LLMs via Ollama and should
produce consistent, cleanly formatted outputs for university instructors.
"""

from typing import Literal


Difficulty = Literal["beginner", "intermediate", "advanced"]


def system_preamble() -> str:
    """Shared system preface for all prompts."""
    return (
        "You are an AI teaching assistant for university-level Computer Science courses. "
        "Be accurate, practical, and helpful for instructors. Prefer clear structure, "
        "concise explanations, and directly usable outputs."
    )


def lecture_content_prompt(topic_or_text: str, difficulty: Difficulty) -> str:
    """Prompt to generate structured lecture content in Markdown."""
    input_text = topic_or_text.strip()
    return (
        f"{system_preamble()}\n\n"
        "TASK: Generate a well-structured lecture in Markdown for the given input. Assume the audience is university students.\n\n"
        f"REQUIREMENTS:\n"
        f"- Target difficulty: {difficulty.capitalize()}\n"
        "- Use clear section headings (##) and subheadings (###)\n"
        "- Include learning objectives, key concepts, examples, and a brief summary\n"
        "- Where relevant, include short code snippets (fenced with language)\n"
        "- Keep it factual and actionable for instructors to use directly in class\n\n"
        f"INPUT:\n{input_text}\n\n"
        "OUTPUT FORMAT (Markdown):\n"
        "# Title\n\n"
        "## Learning Objectives\n"
        "- objective 1\n"
        "- objective 2\n\n"
        "## Key Concepts\n"
        "- concept 1\n"
        "- concept 2\n\n"
        "## Explanations and Examples\n"
        "### Concept A\n"
        "Explanation...\n\n"
        "```python\n# minimal example if applicable\n```\n\n"
        "### Concept B\n"
        "Explanation...\n\n"
        "## Common Pitfalls\n"
        "- pitfall 1 and how to avoid\n\n"
        "## Summary\n"
        "Key takeaways...\n"
    )


def slide_content_prompt(markdown_content: str) -> str:
    """Prompt to convert lecture markdown into slide-ready content."""
    src = markdown_content.strip()
    return (
        f"{system_preamble()}\n\n"
        "TASK: Convert the provided lecture Markdown into slide-ready content.\n"
        "RULES:\n"
        "- Output a sequence of slides, each with a Title line and 3-6 concise bullet points\n"
        "- No prose paragraphs; bullets only\n"
        "- Keep bullets short and scannable\n\n"
        f"INPUT MARKDOWN:\n{src}\n\n"
        "OUTPUT FORMAT:\n"
        "Slide 1: Title text\n"
        "- bullet\n"
        "- bullet\n\n"
        "Slide 2: Title text\n"
        "- bullet\n"
        "- bullet\n"
    )


def adjust_content_prompt(text: str, action: Literal["simplify", "expand"]) -> str:
    """Prompt to simplify or expand existing content."""
    instruction = (
        "Simplify the content while preserving meaning. Use shorter sentences, clearer wording, and keep all important details. Keep Markdown intact."
        if action == "simplify"
        else "Expand the content by adding helpful explanations, clarifications, and brief examples where useful. Keep Markdown intact."
    )
    body = text.strip()
    return (
        f"{system_preamble()}\n\n"
        f"ACTION: {action.upper()}\n"
        f"INSTRUCTION: {instruction}\n\n"
        f"CONTENT:\n{body}\n"
    )


def grading_prompt(question: str, answer: str, is_code: bool) -> str:
    """Prompt to generate a suggested grade and concise feedback."""
    code_note = (
        "Focus on code correctness, common errors, and best practices."
        if is_code
        else "Focus on conceptual correctness and clarity."
    )
    q = question.strip()
    a = answer.strip()
    return (
        f"{system_preamble()}\n\n"
        "TASK: Grade a student's response to a university-level CS question and provide concise, constructive feedback.\n\n"
        "GUIDELINES:\n"
        "- Output JSON only\n"
        "- Suggested grade as a percentage (0-100)\n"
        "- 2-3 sentence feedback\n"
        f"- {code_note}\n\n"
        f"QUESTION:\n{q}\n\n"
        f"STUDENT_RESPONSE:\n{a}\n\n"
        "OUTPUT JSON SCHEMA:\n"
        "{\n"
        "  \"grade\": 0-100,\n"
        "  \"feedback\": \"string\",\n"
        "  \"detected_issues\": [\"short issue text\"],\n"
        "  \"strengths\": [\"short strength text\"]\n"
        "}\n"
    )


def quiz_prompt(topic: str, difficulty: Difficulty, num_questions: int, qtype: Literal["mcq", "short"]) -> str:
    """Prompt to generate quiz questions and an answer key."""
    type_text = "Multiple Choice" if qtype == "mcq" else "Short Answer"
    t = topic.strip()
    return (
        f"{system_preamble()}\n\n"
        f"TASK: Generate {num_questions} {type_text} questions for university students on the topic below.\n\n"
        f"REQUIREMENTS:\n"
        f"- Difficulty: {difficulty.capitalize()}\n"
        "- Number each question\n"
        "- For MCQ: Provide 4 options (A-D) and indicate the correct option\n"
        "- For Short Answer: Provide a concise expected answer\n"
        "- After questions, include an Answer Key section referencing question numbers\n\n"
        f"TOPIC:\n{t}\n\n"
        "OUTPUT FORMAT (Markdown):\n"
        "## Questions\n"
        "1. Question text\n"
        "   A. Option\n"
        "   B. Option\n"
        "   C. Option\n"
        "   D. Option\n\n"
        "...\n\n"
        "## Answer Key\n"
        "1. C - brief rationale\n"
        "...\n"
    )


# -------- Additional prompts for Admin Tools, Ideas, Help --------

def admin_prompt(template: str, variables: dict) -> str:
    """Prompt for admin templates: reminder email, course summary, grading rubric."""
    base = system_preamble()
    if template == "reminder_email":
        subject = variables.get("subject", "Assignment")
        due = variables.get("due", "the due date")
        details = variables.get("details", "")
        return (
            f"{base}\n\n"
            "Write a short, professional reminder email to students.\n"
            f"Context: {details}\n"
            f"Subject: {subject}\n"
            f"Due: {due}\n\n"
            "Output format:\n"
            "Subject: <subject line>\n\n"
            "Dear Students,\n"
            "<body in 3-5 short sentences>\n\n"
            "Best regards,\nInstructor\n"
        )
    if template == "course_summary":
        week = variables.get("week", "1")
        topics = variables.get("topics", "")
        return (
            f"{base}\n\n"
            "Generate a concise course summary for the specified week including key topics and action items.\n"
            f"Week: {week}\n"
            f"Topics: {topics}\n"
            "Format as bullet points."
        )
    if template == "grading_rubric":
        name = variables.get("assignment", "Assignment")
        criteria = variables.get("criteria", "correctness, style, documentation, efficiency")
        return (
            f"{base}\n\n"
            "Create a clear grading rubric table in Markdown with point allocations.\n"
            f"Assignment: {name}\n"
            f"Criteria: {criteria}\n"
            "Include total 100 points and brief descriptors."
        )
    return base


def ideas_prompt(topic: str, level: Difficulty, variations: bool) -> str:
    """Prompt to generate project or lab ideas."""
    t = topic.strip()
    return (
        f"{system_preamble()}\n\n"
        "TASK: Propose 5 practical project ideas for a CS course.\n"
        f"Topic: {t}\n"
        f"Level: {level.capitalize()}\n"
        f"Include difficulty variations: {'Yes' if variations else 'No'}\n\n"
        "FORMAT:\n"
        "1) Title - one sentence description; optional variations by difficulty\n"
        "2) ...\n"
    )


def help_prompt(question: str) -> str:
    """Prompt for the help/mentor chatbot about app features."""
    q = question.strip()
    return (
        "You are the in-app mentor for the Educator Assistant.\n"
        "Answer concisely and provide step-by-step guidance for this tool's features: \n"
        "Content Generation, Grading & Feedback, Quiz Generator, Admin Tools, Project Ideas, History, and PDF Upload.\n\n"
        f"QUESTION: {q}\n"
        "ANSWER:"
    )


def chat_prompt(message: str, history: list = None) -> str:
    """Prompt for conversational chat with context awareness."""
    msg = message.strip()
    context = ""
    
    # Check if this is a file upload (contains "File:" and "Extracted content:")
    is_file_upload = "File:" in msg and "Extracted content:" in msg
    
    if history and len(history) > 0:
        context = "CONVERSATION HISTORY:\n"
        for entry in history[-3:]:  # Last 3 messages for context (reduced to save tokens)
            role = entry.get("role", "user").upper()
            content = entry.get("content", "")[:200]  # Truncate long history
            context += f"{role}: {content}...\n"
        context += "\n"
    
    if is_file_upload:
        return (
            "You are StudyMind AI, an intelligent study companion. "
            "A student has uploaded a file and you need to analyze its content.\n\n"
            "INSTRUCTIONS:\n"
            "1. Focus ONLY on the extracted content from the uploaded file\n"
            "2. If the student asks a question, answer it based on the file content\n"
            "3. If no specific question is asked, provide a comprehensive summary of the file\n"
            "4. Identify key concepts, main topics, and important points\n"
            "5. Use markdown formatting for better readability\n"
            "6. Be specific and reference actual content from the file\n\n"
            f"{context}"
            f"FILE CONTENT AND USER REQUEST:\n{msg}\n\n"
            "YOUR ANALYSIS:"
        )
    else:
        return (
            "You are StudyMind AI, an intelligent study companion for students. "
            "You help students learn by:\n"
            "- Answering questions about any topic\n"
            "- Explaining concepts in simple terms\n"
            "- Analyzing uploaded study materials\n"
            "- Creating summaries and study aids\n"
            "- Providing educational guidance\n\n"
            "Be helpful, clear, and encouraging. Use examples when appropriate. "
            "Format your responses with markdown for better readability.\n\n"
            f"{context}"
            f"STUDENT MESSAGE: {msg}\n\n"
            "YOUR RESPONSE:"
        )



import json
import os
from datetime import datetime
import requests
from typing import Dict, List, Optional
import re

class EducatorMemory:
    """Manages persistent memory for educator-specific context and preferences."""
    
    # Define available tone personalities
    TONES = {
        "professional": {
            "description": "Clear, formal, and structured - perfect for academic settings",
            "instruction": "Respond in a professional, clear, and well-structured manner suitable for academic environments. Use proper terminology and maintain a formal tone."
        },
        "casual": {
            "description": "Friendly and conversational - like chatting with a colleague",
            "instruction": "Respond in a friendly, conversational tone as if talking to a colleague over coffee. Keep it approachable and warm while remaining helpful."
        },
        "enthusiastic": {
            "description": "Energetic and motivating - brings excitement to learning",
            "instruction": "Respond with enthusiasm and energy! Use exclamation points, encouraging language, and show genuine excitement about the topic. Make learning feel exciting and achievable!"
        },
        "humorous": {
            "description": "Witty and fun - like Grok, with jokes and personality",
            "instruction": "Respond with wit, humor, and personality. Use analogies, light jokes, and entertaining examples. Make it fun while staying educational. Think of yourself as the cool teacher everyone loves!"
        },
        "concise": {
            "description": "Brief and to-the-point - no fluff, just facts",
            "instruction": "Respond concisely and directly. Get straight to the point with minimal elaboration. Use bullet points when appropriate and avoid unnecessary details."
        },
        "encouraging": {
            "description": "Supportive and motivating - builds confidence",
            "instruction": "Respond in a supportive, encouraging manner that builds confidence. Acknowledge challenges, celebrate progress, and maintain a positive, can-do attitude."
        },
        "socratic": {
            "description": "Question-based and thought-provoking - encourages critical thinking",
            "instruction": "Respond by asking thoughtful questions that guide discovery. Encourage critical thinking and self-reflection. Help users arrive at insights themselves."
        },
        "storyteller": {
            "description": "Narrative-driven with examples and analogies",
            "instruction": "Respond by weaving information into stories, real-world examples, and vivid analogies. Make concepts memorable through narrative and imagery."
        }
    }
    
    def __init__(self, memory_file="user_memory.json", ollama_url="http://localhost:11434/api/generate"):
        self.memory_file = memory_file
        self.ollama_url = ollama_url
        self.ensure_memory_file()
    
    def ensure_memory_file(self):
        """Create memory file if it doesn't exist."""
        if not os.path.exists(self.memory_file):
            with open(self.memory_file, 'w') as f:
                json.dump({}, f)
    
    def extract_user_info(self, message: str) -> Dict:
        """Use LLM to infer structured educator data from a message."""
        # Skip extraction for very short messages
        if len(message.strip()) < 10:
            return self._empty_structure()
        
        # Get available tones for the prompt
        tone_options = ", ".join(self.get_available_tones())
        
        extraction_prompt = f"""Analyze this teacher's message and extract relevant information about them.
Return ONLY a valid JSON object with these fields (use empty arrays if nothing found):
- teaching_subjects: list of subjects they teach (e.g., ["biology", "chemistry"])
- grade_levels: list of grade levels or age groups (e.g., ["9th grade", "high school"])
- teaching_style: list of teaching approaches (e.g., ["project-based", "hands-on", "inquiry-based"])
- interests: list of educational interests or focuses (e.g., ["STEM education", "technology integration"])
- goals: list of current goals or challenges (e.g., ["improve engagement", "integrate more technology"])
- preferred_tone: if the teacher expresses a preference for how they want responses (e.g., "casual", "professional", "humorous"), choose ONE from these options: {tone_options}. Leave empty if not mentioned.

Important: Only extract information that is explicitly mentioned or clearly implied. Don't make assumptions.

Examples of tone preferences:
- "Can you be more casual?" → "casual"
- "I prefer a professional approach" → "professional"  
- "Make it fun and witty like Grok" → "humorous"
- "Keep it brief" → "concise"

Teacher's message: "{message}"

Respond with ONLY valid JSON, no explanation or additional text:"""

        try:
            resp = requests.post(
                self.ollama_url,
                json={
                    "model": "mistral",
                    "prompt": extraction_prompt,
                    "stream": False,
                    "temperature": 0.2  # Lower temperature for more consistent extraction
                },
                timeout=30
            )
            resp.raise_for_status()
            
            output = resp.json().get("response", "").strip()
            
            # Extract JSON from response (handle cases where model adds text)
            json_match = re.search(r'\{.*\}', output, re.DOTALL)
            
            if json_match:
                json_str = json_match.group(0)
                extracted_info = json.loads(json_str)
                
                # Validate and clean extracted data
                cleaned_info = self._validate_extraction(extracted_info)
                return cleaned_info
            
        except requests.exceptions.Timeout:
            print("Timeout while extracting user info")
        except json.JSONDecodeError as e:
            print(f"JSON decode error: {e}")
        except Exception as e:
            print(f"Error extracting user info: {e}")
        
        # Return empty structure on failure
        return self._empty_structure()
    
    def _empty_structure(self) -> Dict:
        """Return empty memory structure."""
        return {
            "teaching_subjects": [],
            "grade_levels": [],
            "teaching_style": [],
            "interests": [],
            "goals": [],
            "preferred_tone": ""
        }
    
    def _validate_extraction(self, extracted_info: Dict) -> Dict:
        """Validate and clean extracted information."""
        default_structure = self._empty_structure()
        
        # Ensure all expected keys exist
        for key in default_structure:
            if key not in extracted_info:
                extracted_info[key] = default_structure[key]
        
        # Clean list fields - remove empty strings and duplicates
        list_fields = ["teaching_subjects", "grade_levels", "teaching_style", "interests", "goals"]
        for field in list_fields:
            if isinstance(extracted_info[field], list):
                # Remove empty strings and strip whitespace
                cleaned = [item.strip() for item in extracted_info[field] if item and item.strip()]
                # Remove duplicates (case-insensitive)
                seen = set()
                unique = []
                for item in cleaned:
                    item_lower = item.lower()
                    if item_lower not in seen:
                        seen.add(item_lower)
                        unique.append(item)
                extracted_info[field] = unique
            else:
                extracted_info[field] = []
        
        # Ensure preferred_tone is a string
        if not isinstance(extracted_info.get("preferred_tone"), str):
            extracted_info["preferred_tone"] = ""
        
        return extracted_info
    
    def update_memory(self, existing_memory: Dict, new_info: Dict) -> Dict:
        """Merge new educator info, avoiding duplicates and maintaining clean data."""
        if not existing_memory:
            existing_memory = self._empty_structure()
            existing_memory["last_updated"] = datetime.now().isoformat()
            existing_memory["interaction_count"] = 0
        
        # Track if any changes were made
        changes_made = False
        
        # Merge list fields (remove duplicates, case-insensitive)
        list_fields = ["teaching_subjects", "grade_levels", "teaching_style", "interests", "goals"]
        
        for field in list_fields:
            if field in new_info and new_info[field]:
                # Get existing values (lowercase for comparison)
                existing_lower = [item.lower() for item in existing_memory.get(field, [])]
                
                # Add new unique values
                for item in new_info[field]:
                    if item and item.strip() and item.lower() not in existing_lower:
                        existing_memory[field].append(item)
                        existing_lower.append(item.lower())
                        changes_made = True
        
        # Update preferred_tone if new one is provided and different
        if new_info.get("preferred_tone") and new_info["preferred_tone"] != existing_memory.get("preferred_tone"):
            existing_memory["preferred_tone"] = new_info["preferred_tone"]
            changes_made = True
        
        # Update timestamp and interaction count
        if changes_made or not existing_memory.get("last_updated"):
            existing_memory["last_updated"] = datetime.now().isoformat()
        
        # Increment interaction count
        existing_memory["interaction_count"] = existing_memory.get("interaction_count", 0) + 1
        
        return existing_memory
    
    def save_memory(self, user_id: str, memory: Dict):
        """Write user memory to disk with error handling."""
        try:
            # Load all user memories
            all_memories = {}
            if os.path.exists(self.memory_file):
                with open(self.memory_file, 'r') as f:
                    try:
                        all_memories = json.load(f)
                    except json.JSONDecodeError:
                        print("Warning: Corrupted memory file, creating new one")
                        all_memories = {}
            
            # Update specific user's memory
            all_memories[user_id] = memory
            
            # Save back with atomic write (write to temp file first)
            temp_file = self.memory_file + ".tmp"
            with open(temp_file, 'w') as f:
                json.dump(all_memories, f, indent=2)
            
            # Atomic rename
            os.replace(temp_file, self.memory_file)
                
        except Exception as e:
            print(f"Error saving memory: {e}")
            # Clean up temp file if it exists
            if os.path.exists(temp_file):
                try:
                    os.remove(temp_file)
                except:
                    pass
    
    def load_memory(self, user_id: str) -> Dict:
        """Load memory for a specific user."""
        try:
            if not os.path.exists(self.memory_file):
                return {}
            
            with open(self.memory_file, 'r') as f:
                all_memories = json.load(f)
                return all_memories.get(user_id, {})
        except json.JSONDecodeError:
            print(f"Error: Corrupted memory file")
            return {}
        except Exception as e:
            print(f"Error loading memory: {e}")
            return {}
    
    def build_memory_context(self, memory: Dict) -> str:
        """Generate a natural language summary of educator memory for the prompt."""
        if not memory or not any(memory.get(k) for k in ["teaching_subjects", "grade_levels", "teaching_style", "interests", "goals"]):
            return ""
        
        context_parts = []
        
        # Teaching subjects and grade level
        subjects = memory.get("teaching_subjects", [])
        grades = memory.get("grade_levels", [])
        
        if subjects and grades:
            context_parts.append(f"This teacher teaches {', '.join(subjects)} to {', '.join(grades)} students")
        elif subjects:
            context_parts.append(f"This teacher teaches {', '.join(subjects)}")
        elif grades:
            context_parts.append(f"This teacher works with {', '.join(grades)} students")
        
        # Teaching style
        styles = memory.get("teaching_style", [])
        if styles:
            context_parts.append(f"prefers {', '.join(styles)} teaching approaches")
        
        # Interests
        interests = memory.get("interests", [])
        if interests:
            context_parts.append(f"is interested in {', '.join(interests)}")
        
        # Goals
        goals = memory.get("goals", [])
        if goals:
            context_parts.append(f"Current goals: {', '.join(goals)}")
        
        # Preferred tone
        tone = memory.get("preferred_tone", "")
        if tone:
            context_parts.append(f"Prefers communication that is {tone}")
        
        if context_parts:
            return "EDUCATOR CONTEXT: " + ". ".join(context_parts) + ".\n\n"
        
        return ""
    
    def process_interaction(self, user_id: str, message: str) -> Dict:
        """Process a user message and update memory. Returns current memory."""
        # Load existing memory
        current_memory = self.load_memory(user_id)
        
        # Extract new information from message
        new_info = self.extract_user_info(message)
        
        # Update memory
        updated_memory = self.update_memory(current_memory, new_info)
        
        # Save updated memory
        self.save_memory(user_id, updated_memory)
        
        return updated_memory
    
    def get_user_stats(self, user_id: str) -> Dict:
        """Get statistics about a user's memory."""
        memory = self.load_memory(user_id)
        
        if not memory:
            return {"exists": False}
        
        return {
            "exists": True,
            "interaction_count": memory.get("interaction_count", 0),
            "last_updated": memory.get("last_updated", "Never"),
            "total_subjects": len(memory.get("teaching_subjects", [])),
            "total_grade_levels": len(memory.get("grade_levels", [])),
            "total_interests": len(memory.get("interests", [])),
            "has_goals": len(memory.get("goals", [])) > 0,
            "has_preferred_tone": bool(memory.get("preferred_tone", ""))
        }
    
    def get_available_tones(self) -> List[str]:
        """Return list of available tone options."""
        return list(self.TONES.keys())
    
    def get_tone_description(self, tone: str) -> str:
        """Get description for a specific tone."""
        return self.TONES.get(tone, {}).get("description", "Unknown tone")
    
    def get_tone_instruction(self, tone: str) -> str:
        """Get the instruction text for a specific tone to add to prompts."""
        tone_data = self.TONES.get(tone, self.TONES["professional"])
        instruction = tone_data.get("instruction", "")
        return f"TONE: {instruction}\n\n" if instruction else ""
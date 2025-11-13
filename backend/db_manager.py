"""
Database Manager for StudyMind AI
Handles MongoDB operations for user data, conversations, and memory
"""

from pymongo import MongoClient
from datetime import datetime
from typing import Dict, List, Optional
import os
import json
import threading
import copy


class DatabaseManager:
    """Manages all database operations for StudyMind AI"""
    
    def __init__(self, connection_string: str):
        """Initialize database connection"""
        self.client = MongoClient(connection_string)
        self.db = self.client['studymind']
        
        # Collections
        self.users = self.db['users']
        self.conversations = self.db['conversations']
        self.memory = self.db['user_memory']
        self.grading_history = self.db['grading_history']
        self.saved_content = self.db['saved_content']
        
        print("✅ Database connected successfully")
    
    # ==================== USER OPERATIONS ====================
    
    def create_user(self, user_id: str, email: str, metadata: Dict = None) -> Dict:
        """Create a new user"""
        user = {
            'user_id': user_id,
            'email': email,
            'created_at': datetime.now(),
            'updated_at': datetime.now(),
            'metadata': metadata or {}
        }
        
        self.users.insert_one(user)
        return user
    
    def create_user_with_password(self, user_id: str, email: str, password_hash: str, metadata: Dict = None) -> Dict:
        """Create a new user with password"""
        user = {
            'user_id': user_id,
            'email': email,
            'password': password_hash,
            'created_at': datetime.now(),
            'updated_at': datetime.now(),
            'metadata': metadata or {},
            'role': 'user'
        }
        
        self.users.insert_one(user)
        return user
    
    def get_user(self, user_id: str) -> Optional[Dict]:
        """Get user by ID"""
        return self.users.find_one({'user_id': user_id})
    
    def get_user_by_email(self, email: str) -> Optional[Dict]:
        """Get user by email"""
        return self.users.find_one({'email': email})
    
    def update_user(self, user_id: str, updates: Dict) -> bool:
        """Update user data"""
        updates['updated_at'] = datetime.now()
        result = self.users.update_one(
            {'user_id': user_id},
            {'$set': updates}
        )
        return result.modified_count > 0
    
    # ==================== MEMORY OPERATIONS ====================
    
    def save_memory(self, user_id: str, memory_data: Dict) -> bool:
        """Save or update user memory"""
        memory_data['user_id'] = user_id
        memory_data['updated_at'] = datetime.now()
        
        result = self.memory.update_one(
            {'user_id': user_id},
            {'$set': memory_data},
            upsert=True
        )
        return True
    
    def load_memory(self, user_id: str) -> Dict:
        """Load user memory"""
        memory = self.memory.find_one({'user_id': user_id})
        if memory:
            memory.pop('_id', None)  # Remove MongoDB ID
            memory.pop('user_id', None)
        return memory or {}
    
    def delete_memory(self, user_id: str) -> bool:
        """Delete user memory"""
        result = self.memory.delete_one({'user_id': user_id})
        return result.deleted_count > 0
    
    # ==================== CONVERSATION OPERATIONS ====================
    
    def create_conversation(self, user_id: str, title: str = "New Conversation") -> str:
        """Create a new conversation"""
        conversation = {
            'user_id': user_id,
            'conversation_id': str(datetime.now().timestamp()).replace('.', ''),
            'title': title,
            'messages': [],
            'created_at': datetime.now(),
            'updated_at': datetime.now(),
            'last_message': ''
        }
        
        self.conversations.insert_one(conversation)
        return conversation['conversation_id']
    
    def get_conversations(self, user_id: str) -> List[Dict]:
        """Get all conversations for a user"""
        conversations = list(self.conversations.find(
            {'user_id': user_id},
            {'_id': 0}  # Exclude MongoDB ID
        ).sort('updated_at', -1))
        
        # Format for frontend
        for conv in conversations:
            conv['id'] = conv.pop('conversation_id')
            conv['timestamp'] = conv['updated_at'].isoformat()
            # Normalize snake_case to camelCase for frontend expectations
            if 'last_message' in conv:
                conv['lastMessage'] = conv.get('last_message', '')
                # Keep original in DB only; not needed in API response
                conv.pop('last_message', None)
        
        return conversations
    
    def get_conversation(self, user_id: str, conversation_id: str) -> Optional[Dict]:
        """Get a specific conversation"""
        conv = self.conversations.find_one({
            'user_id': user_id,
            'conversation_id': conversation_id
        }, {'_id': 0})
        
        if conv:
            conv['id'] = conv.pop('conversation_id')
            conv['timestamp'] = conv['updated_at'].isoformat()
            if 'last_message' in conv:
                conv['lastMessage'] = conv.get('last_message', '')
                conv.pop('last_message', None)
        
        return conv
    
    def update_conversation(self, user_id: str, conversation_id: str, 
                          messages: List = None, title: str = None) -> bool:
        """Update conversation"""
        updates = {'updated_at': datetime.now()}
        
        if messages is not None:
            updates['messages'] = messages
            if messages:
                last_msg = messages[-1].get('content', '')
                updates['last_message'] = last_msg[:100]
        
        if title is not None:
            updates['title'] = title
        
        result = self.conversations.update_one(
            {'user_id': user_id, 'conversation_id': conversation_id},
            {'$set': updates}
        )
        return result.modified_count > 0
    
    def delete_conversation(self, user_id: str, conversation_id: str) -> bool:
        """Delete a conversation"""
        result = self.conversations.delete_one({
            'user_id': user_id,
            'conversation_id': conversation_id
        })
        return result.deleted_count > 0
    
    # ==================== GRADING HISTORY ====================
    
    def save_grading(self, user_id: str, question: str, answer: str, 
                    result: Dict, is_code: bool = False) -> bool:
        """Save grading history"""
        grading_entry = {
            'user_id': user_id,
            'question': question,
            'answer': answer,
            'is_code': is_code,
            'result': result,
            'timestamp': datetime.now()
        }
        
        self.grading_history.insert_one(grading_entry)
        return True
    
    def get_grading_history(self, user_id: str, limit: int = 50) -> List[Dict]:
        """Get grading history for a user"""
        history = list(self.grading_history.find(
            {'user_id': user_id},
            {'_id': 0}
        ).sort('timestamp', -1).limit(limit))
        
        return history
    
    # ==================== SAVED CONTENT ====================
    
    def save_content(self, user_id: str, content: str, name: str, 
                    content_type: str = 'markdown') -> str:
        """Save generated content"""
        timestamp = datetime.now()
        filename = f"{name}_{timestamp.strftime('%Y%m%d_%H%M%S')}.{content_type}"
        
        content_doc = {
            'user_id': user_id,
            'filename': filename,
            'content': content,
            'content_type': content_type,
            'created_at': timestamp
        }
        
        self.saved_content.insert_one(content_doc)
        return filename
    
    def get_saved_content(self, user_id: str, limit: int = 50) -> List[Dict]:
        """Get saved content for a user"""
        content = list(self.saved_content.find(
            {'user_id': user_id},
            {'_id': 0, 'content': 0}  # Exclude content in list view
        ).sort('created_at', -1).limit(limit))
        
        return content
    
    def get_content_by_filename(self, user_id: str, filename: str) -> Optional[Dict]:
        """Get specific content file"""
        return self.saved_content.find_one(
            {'user_id': user_id, 'filename': filename},
            {'_id': 0}
        )
    
    # ==================== UTILITY ====================
    
    def close(self):
        """Close database connection"""
        self.client.close()
        print("Database connection closed")


class FileConversationStore:
    """Lightweight file-based conversation storage fallback when MongoDB is unavailable."""

    def __init__(self, storage_path: Optional[str] = None):
        base_dir = os.path.dirname(os.path.abspath(__file__))
        default_name = os.path.join(base_dir, "data", "conversations_default_user.json")
        self.storage_path = storage_path or default_name
        self._lock = threading.Lock()
        self._ensure_storage_file()

    # ---------- Internal helpers ----------
    def _ensure_storage_file(self):
        os.makedirs(os.path.dirname(self.storage_path), exist_ok=True)
        if not os.path.exists(self.storage_path):
            with open(self.storage_path, "w", encoding="utf-8") as f:
                json.dump({}, f)

    def _load(self) -> Dict[str, List[Dict]]:
        with self._lock:
            try:
                with open(self.storage_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
            except json.JSONDecodeError:
                data = {}

        # Backward compatibility: previous format was a bare list for default_user
        if isinstance(data, list):
            return {"default_user": data}

        if not isinstance(data, dict):
            return {}

        return data

    def _save(self, data: Dict[str, List[Dict]]):
        with self._lock:
            with open(self.storage_path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)

    def _generate_conversation_id(self) -> str:
        return str(int(datetime.now().timestamp() * 1000))

    def _build_conversation_response(self, conversation: Dict) -> Dict:
        # Return a deep copy to avoid accidental in-memory mutations
        conv_copy = copy.deepcopy(conversation)
        # Ensure required keys exist
        conv_copy.setdefault("id", self._generate_conversation_id())
        conv_copy.setdefault("title", "New Conversation")
        conv_copy.setdefault("messages", [])
        conv_copy.setdefault("lastMessage", "")
        conv_copy.setdefault("timestamp", datetime.utcnow().isoformat())
        return conv_copy

    # ---------- Public API ----------
    def get_conversations(self, user_id: str) -> List[Dict]:
        data = self._load()
        conversations = data.get(user_id, [])
        normalized = [self._build_conversation_response(conv) for conv in conversations]
        # Sort newest first
        normalized.sort(key=lambda c: c.get("timestamp", ""), reverse=True)
        return normalized

    def get_conversation(self, user_id: str, conversation_id: str) -> Optional[Dict]:
        data = self._load()
        for conv in data.get(user_id, []):
            if str(conv.get("id")) == str(conversation_id):
                return self._build_conversation_response(conv)
        return None

    def create_conversation(self, user_id: str, title: str = "New Conversation") -> str:
        data = self._load()
        conv_id = self._generate_conversation_id()
        timestamp = datetime.utcnow().isoformat()
        conversation = {
            "id": conv_id,
            "title": title or "New Conversation",
            "messages": [],
            "lastMessage": "",
            "timestamp": timestamp,
        }
        data.setdefault(user_id, [])
        data[user_id].append(conversation)
        self._save(data)
        return conv_id

    def update_conversation(self, user_id: str, conversation_id: str,
                            messages: List = None, title: str = None) -> bool:
        data = self._load()
        conversations = data.get(user_id, [])
        updated = False
        for idx, conv in enumerate(conversations):
            if str(conv.get("id")) == str(conversation_id):
                conv = copy.deepcopy(conv)
                if messages is not None:
                    conv["messages"] = messages
                    if messages:
                        last_msg = messages[-1].get("content", "")
                        conv["lastMessage"] = last_msg[:100]
                    else:
                        conv["lastMessage"] = ""
                if title is not None:
                    conv["title"] = title
                conv["timestamp"] = datetime.utcnow().isoformat()
                conversations[idx] = conv
                updated = True
                break
        if updated:
            data[user_id] = conversations
            self._save(data)
        return updated

    def delete_conversation(self, user_id: str, conversation_id: str) -> bool:
        data = self._load()
        conversations = data.get(user_id, [])
        new_conversations = [conv for conv in conversations if str(conv.get("id")) != str(conversation_id)]
        if len(new_conversations) == len(conversations):
            return False
        data[user_id] = new_conversations
        self._save(data)
        return True

    def close(self):
        """Compatibility method with DatabaseManager."""
        return None
"""
Database Manager for StudyMind AI
Handles MongoDB operations for user data, conversations, and memory
"""

from pymongo import MongoClient
from datetime import datetime
from typing import Dict, List, Optional
import os


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
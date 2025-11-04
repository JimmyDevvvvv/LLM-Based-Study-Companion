# Dynamic Chat History Implementation

## Overview
Implemented a fully dynamic chat history system that stores and manages conversations with persistent backend storage.

## Features Implemented

### 1. Backend API Endpoints (`backend/app.py`)
- **GET** `/conversations/<user_id>` - Retrieve all conversations for a user
- **POST** `/conversations/<user_id>` - Create a new conversation
- **GET** `/conversations/<user_id>/<conversation_id>` - Get a specific conversation with messages
- **PUT** `/conversations/<user_id>/<conversation_id>` - Update conversation (messages, title)
- **DELETE** `/conversations/<user_id>/<conversation_id>` - Delete a conversation

### 2. Frontend Hook (`frontend/hooks/useChatHistory.ts`)
Custom React hook that manages conversation state and API interactions:
- `loadConversations()` - Loads all conversations from backend
- `createConversation(title)` - Creates a new conversation
- `loadConversation(id)` - Loads messages from a specific conversation
- `updateConversation(id, messages, title)` - Saves conversation updates
- `deleteConversation(id)` - Deletes a conversation
- `generateTitle(messages)` - Auto-generates titles from first user message

### 3. Updated Components

#### Sidebar (`frontend/components/Sidebar.tsx`)
- Displays dynamic list of conversations from backend
- Shows active conversation with visual highlighting
- Hover-to-delete functionality with trash icon
- Empty state when no conversations exist
- Smooth animations for conversation items

#### Main Page (`frontend/app/page.tsx`)
- Integrated `useChatHistory` hook
- Auto-saves conversations when messages change
- Auto-generates conversation titles from first user message
- Initializes with a new conversation if none exists
- Handles conversation switching and deletion

### 4. Type Updates (`frontend/types/index.ts`)
Updated `Conversation` interface:
- Changed `id` from `number` to `string` (for timestamp-based IDs)
- Changed `timestamp` from `Date` to `string` (ISO format)
- Added optional `messages` array

## How It Works

### Creating a New Conversation
1. User clicks "New Conversation" button
2. Frontend calls `createConversation()` hook
3. Backend creates conversation with unique timestamp-based ID
4. Conversation saved to `data/conversations_<user_id>.json`
5. Initial AI message added to conversation

### Auto-Saving Messages
1. User sends a message
2. `useEffect` detects message changes
3. If it's the first user message, auto-generates title
4. Calls `updateConversation()` to save to backend
5. Backend updates conversation file with new messages

### Loading Conversations
1. On app mount, `useChatHistory` loads all conversations
2. Conversations displayed in sidebar, sorted by most recent
3. User clicks a conversation
4. Messages loaded from backend and displayed in chat

### Deleting Conversations
1. User hovers over conversation, trash icon appears
2. User clicks trash icon
3. Confirmation happens via `deleteConversation()`
4. Backend removes conversation from storage
5. If current conversation deleted, new one is created

## Data Storage
Conversations are stored in JSON files:
- Location: `backend/data/conversations_<user_id>.json`
- Format: Array of conversation objects
- Each conversation contains: id, title, messages, timestamp, lastMessage

## Benefits
✅ Persistent chat history across sessions
✅ Automatic conversation saving
✅ Smart title generation
✅ Easy conversation management (create, load, delete)
✅ Scalable architecture
✅ Clean separation of concerns (backend/frontend)

# State Management

## Overview

We use two tools for state:

- **Zustand**: Client-side UI state
- **React Query**: Server data fetching and caching

## Why Both?

| Zustand | React Query |
|---------|-------------|
| What's happening NOW | What the server told us |
| UI state | Server state |
| Typing indicators | User list |
| Active conversation | Messages |
| Sidebar open/closed | Conversations |

## Zustand Store

Location: `src/stores/chat-store.ts`

### State

```typescript
interface ChatState {
  // Current user
  currentUser: User | null;

  // Conversations list
  conversations: Conversation[];

  // Active conversation ID
  activeConversationId: string | null;

  // Messages by conversation
  messagesByConversation: Record<string, Message[]>;

  // Online users
  onlineUsers: Set<string>;

  // Who's typing in each conversation
  typingUsers: Record<string, string[]>;

  // UI state
  isSidebarOpen: boolean;
  searchQuery: string;
}
```

### Usage

```typescript
import { useChatStore } from '@/stores/chat-store';

function MyComponent() {
  // Get state
  const { currentUser, conversations } = useChatStore();

  // Get actions
  const { setActiveConversationId, addMessage } = useChatStore();

  // Update state
  setActiveConversationId('conv-123');
}
```

## React Query Hooks

Location: `src/hooks/`

### useAuth

```typescript
const { user, isLoading, logout } = useAuth();
```

### useConversations

```typescript
const { conversations, createConversation, isLoading } = useConversations();
```

### useMessages

```typescript
const { messages, sendMessage, isSending } = useMessages(conversationId);
```

### useUsers

```typescript
const { users, isLoading } = useUsers();
```

## Files

| File | Purpose |
|------|---------|
| `src/stores/chat-store.ts` | Zustand store |
| `src/components/providers/query-provider.tsx` | React Query setup |
| `src/hooks/use-auth.ts` | Auth hook |
| `src/hooks/use-conversations.ts` | Conversations hook |
| `src/hooks/use-messages.ts` | Messages hook |
| `src/hooks/use-users.ts` | Users hook |
| `src/hooks/use-pusher.ts` | Real-time subscriptions |

## Data Flow

```
User Action
    ↓
React Query mutation (API call)
    ↓
Server saves to database
    ↓
Server triggers Pusher event
    ↓
Pusher hook receives event
    ↓
Zustand store updates
    ↓
UI re-renders
```

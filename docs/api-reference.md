# API Reference

## Base URL

```
http://localhost:3000/api
```

## Authentication

All endpoints except `/api/auth/*` require authentication via JWT cookie.

---

## Auth Endpoints

### Login with Google

```
GET /api/auth/login
```

Redirects to Google OAuth page.

---

### OAuth Callback

```
GET /api/auth/callback/google?code=xxx
```

Handles Google's response, creates user, sets cookies.

---

### Get Current User

```
GET /api/auth/me
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "user-123",
    "email": "user@example.com",
    "name": "John Doe",
    "image": "https://...",
    "isOnline": true
  }
}
```

---

### Refresh Token

```
POST /api/auth/refresh
```

**Response:**

```json
{
  "success": true
}
```

---

### Logout

```
POST /api/auth/logout
```

**Response:**

```json
{
  "success": true
}
```

---

## User Endpoints

### List Users

```
GET /api/users
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "user-123",
      "name": "John Doe",
      "email": "john@example.com",
      "image": "https://...",
      "isOnline": true,
      "lastSeenAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

## Conversation Endpoints

### List Conversations

```
GET /api/conversations
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "conv-123",
      "user1": { ... },
      "user2": { ... },
      "lastMessage": { ... },
      "unreadCount": 3
    }
  ]
}
```

---

### Create Conversation

```
POST /api/conversations
```

**Body:**

```json
{
  "userId": "user-456"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "conv-123",
    "user1": { ... },
    "user2": { ... }
  }
}
```

---

### Get Conversation

```
GET /api/conversations/:id
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "conv-123",
    "user1": { ... },
    "user2": { ... },
    "messages": [ ... ]
  }
}
```

---

### Delete Conversation

```
DELETE /api/conversations/:id
```

**Response:**

```json
{
  "success": true
}
```

---

### Get Messages

```
GET /api/conversations/:id/messages
```

**Query Params:**

| Param | Type | Default |
|-------|------|---------|
| cursor | string | - |
| limit | number | 50 |

**Response:**

```json
{
  "success": true,
  "data": [ ... ],
  "nextCursor": "msg-100"
}
```

---

### Send Message

```
POST /api/conversations/:id/messages
```

**Body:**

```json
{
  "content": "Hello!"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "msg-123",
    "content": "Hello!",
    "senderId": "user-123",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

## Message Endpoints

### Mark Message as Read

```
POST /api/messages/:id/read
```

**Response:**

```json
{
  "success": true,
  "data": { ... }
}
```

---

### Mark All as Read

```
POST /api/messages/read-all
```

**Body:**

```json
{
  "conversationId": "conv-123"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "count": 5
  }
}
```

---

## Real-time Endpoints

### Pusher Auth

```
POST /api/pusher/auth
```

**Body (form-data):**

```
socket_id=123.456
channel_name=private-conversation-123
```

---

### Typing Indicator

```
POST /api/typing
```

**Body:**

```json
{
  "conversationId": "conv-123",
  "isTyping": true
}
```

---

## AI Endpoints

### AI Chat

```
POST /api/ai/chat
```

**Body:**

```json
{
  "prompt": "Help me write a message",
  "conversationId": "conv-123"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "response": "Here's a suggestion...",
    "message": { ... }
  }
}
```

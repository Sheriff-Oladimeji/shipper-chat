# Real-time Messaging

## Overview

Real-time messaging allows users to see new messages instantly without refreshing the page.

## Current Implementation: Pusher

We use **Pusher** as a WebSocket service because Vercel serverless functions don't support persistent WebSocket connections.

### How Pusher Works

```
1. User A sends a message
2. API saves message to database
3. API triggers Pusher event
4. Pusher broadcasts to subscribers
5. User B receives event instantly
6. UI updates with new message
```

### Channels

| Channel | Purpose |
|---------|---------|
| `private-user-{userId}` | Personal notifications |
| `private-conversation-{id}` | Chat-specific events |

### Events

| Event | Triggered When |
|-------|----------------|
| `new-message` | Message sent |
| `typing-start` | User starts typing |
| `typing-stop` | User stops typing |
| `message-read` | Message marked as read |

### Files

| File | Purpose |
|------|---------|
| `src/lib/pusher.ts` | Server & client setup |
| `src/app/api/pusher/auth/route.ts` | Authenticate channels |
| `src/hooks/use-pusher.ts` | React hooks for subscriptions |

### Environment Variables

```env
PUSHER_APP_ID=xxx
PUSHER_KEY=xxx
PUSHER_SECRET=xxx
PUSHER_CLUSTER=us2
NEXT_PUBLIC_PUSHER_KEY=xxx
NEXT_PUBLIC_PUSHER_CLUSTER=us2
```

## Alternative: Native WebSockets

If you want to use native WebSockets instead of Pusher, you have these options:

### Option 1: Separate WebSocket Server

Deploy a separate Node.js server (not on Vercel) that handles WebSocket connections:

```javascript
// websocket-server.js (deploy on Railway, Render, or VPS)
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    // Broadcast to all clients
    wss.clients.forEach((client) => {
      client.send(data);
    });
  });
});
```

### Option 2: Socket.io with Adapter

Use Socket.io with a Redis adapter for scaling:

```bash
npm install socket.io @socket.io/redis-adapter redis
```

### Option 3: Ably or Other Services

Similar to Pusher:
- [Ably](https://ably.com)
- [Liveblocks](https://liveblocks.io)
- [Supabase Realtime](https://supabase.com/realtime)

## Why Pusher for Vercel?

Vercel serverless functions:
- Have a 10-second timeout (hobby) / 60-second (pro)
- Can't maintain persistent connections
- Spin down when not in use

Pusher handles:
- WebSocket infrastructure
- Connection management
- Scaling automatically
- Works with serverless

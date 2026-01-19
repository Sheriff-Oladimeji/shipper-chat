# Shippr Chat

Real-time chat application built with Next.js 16, featuring Google OAuth and email/password authentication, WebSocket messaging via Pusher, and AI assistance.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Architecture Overview](#architecture-overview)
- [Authentication](#authentication)
- [Real-time Features](#real-time-features)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Setup Instructions](#setup-instructions)
- [Environment Variables](#environment-variables)

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | PostgreSQL (Neon serverless) |
| ORM | Prisma |
| Authentication | Google OAuth + JWT (jose library) |
| Password Hashing | bcryptjs |
| Real-time | Pusher (WebSocket service) |
| File Upload | UploadThing |
| State Management | Zustand + React Query |
| AI | Google Gemini (Vercel AI SDK) |
| UI Components | Radix UI primitives |

---

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth route group
│   │   └── login/                # Login page (Google OAuth + email/password)
│   ├── (chat)/                   # Protected chat route group
│   │   ├── layout.tsx            # Chat layout with sidebar
│   │   ├── page.tsx              # Welcome/empty state
│   │   └── c/[id]/               # Conversation view
│   ├── api/                      # API routes
│   │   ├── auth/                 # Authentication endpoints
│   │   │   ├── callback/         # Google OAuth callback
│   │   │   ├── login/            # Google OAuth initiation
│   │   │   ├── signin/           # Email/password sign in
│   │   │   ├── signup/           # Email/password sign up
│   │   │   ├── refresh/          # JWT token refresh
│   │   │   ├── logout/           # Logout (clear cookies)
│   │   │   └── me/               # Get current user
│   │   ├── users/                # User management
│   │   ├── conversations/        # Conversation CRUD
│   │   ├── messages/             # Message operations
│   │   ├── pusher/               # Pusher auth endpoint
│   │   ├── ai/                   # AI chat endpoint
│   │   └── uploadthing/          # File upload endpoint
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Global styles (Tailwind)
│
├── components/
│   ├── ui/                       # Reusable UI components (Button, Input, Sheet, etc.)
│   ├── chat/                     # Chat-specific components
│   │   ├── sidebar/              # Left panel (conversation list, search)
│   │   ├── conversation/         # Right panel (messages, header)
│   │   └── input/                # Message input with attachments
│   ├── layout/                   # Layout components
│   │   ├── nav-sidebar.tsx       # Left navigation with logo dropdown
│   │   ├── top-navbar.tsx        # Top navigation bar
│   │   └── index.ts              # Exports
│   ├── modals/                   # Modal components
│   │   ├── profile-settings-modal.tsx
│   │   ├── notification-settings-modal.tsx
│   │   ├── search-modal.tsx
│   │   └── index.ts              # Exports
│   └── providers/                # Context providers
│
├── lib/
│   ├── db/                       # Database utilities
│   │   ├── prisma.ts             # Prisma client singleton
│   │   └── index.ts              # Exports
│   ├── auth/                     # Authentication utilities
│   │   ├── jwt.ts                # JWT token creation/verification
│   │   ├── google.ts             # Google OAuth helpers
│   │   └── index.ts              # Exports
│   ├── realtime/                 # Real-time utilities
│   │   ├── pusher.ts             # Pusher server/client config
│   │   ├── events.ts             # Event type definitions
│   │   └── index.ts              # Exports
│   ├── upload/                   # File upload utilities
│   │   ├── uploadthing.ts        # UploadThing config
│   │   └── index.ts              # Exports
│   └── utils.ts                  # General utilities (cn, formatDate, etc.)
│
├── hooks/                        # Custom React hooks
│   ├── use-conversations.ts      # Conversation data fetching
│   ├── use-messages.ts           # Message data fetching
│   └── use-pusher.ts             # Pusher subscription hook
│
├── stores/                       # Zustand state stores
│   └── chat-store.ts             # Chat state management
│
├── types/                        # TypeScript type definitions
│   └── index.ts                  # Shared types
│
└── proxy.ts                      # Next.js 16 middleware (route protection)

prisma/
└── schema.prisma                 # Database schema
```

---

## Architecture Overview

### Middleware (proxy.ts)

Next.js 16 uses `proxy.ts` (not `middleware.ts`) for edge middleware. This file handles:

- **Route Protection**: Redirects unauthenticated users to `/login`
- **Token Verification**: Validates JWT access tokens on each request
- **Public Paths**: Allows access to auth endpoints and static files

```typescript
// Public paths that don't require authentication
const publicPaths = [
  "/login",
  "/api/auth/login",
  "/api/auth/callback",
  "/api/auth/signup",
  "/api/auth/signin",
  "/api/auth/refresh",
];
```

### State Management

- **Zustand**: Client-side state for UI state (selected conversation, typing indicators)
- **React Query**: Server state caching and data fetching with automatic invalidation

### Real-time Architecture

Uses Pusher channels for WebSocket communication:
- `presence-online`: User online/offline status
- `private-user-{userId}`: Direct notifications to specific users
- `private-conversation-{id}`: Conversation-specific events (messages, typing)

---

## Authentication

### Dual Authentication System

The app supports two authentication methods:

#### 1. Google OAuth

Flow: Login button → Google consent → Callback → JWT tokens → Redirect to chat

```
/login → /api/auth/login → Google → /api/auth/callback → /(chat)
```

#### 2. Email/Password

Flow: Sign up form → Create user → Hash password → JWT tokens → Redirect to chat

**Sign Up** (`POST /api/auth/signup`):
- Validates email format, password length (6+ chars), name (2+ chars)
- Hashes password with bcryptjs (10 rounds)
- Creates user in database
- Returns JWT tokens in httpOnly cookies

**Sign In** (`POST /api/auth/signin`):
- Validates credentials
- Compares password hash with bcrypt
- Returns JWT tokens in httpOnly cookies

### JWT Token Strategy

| Token | Cookie Name | Expiry | Purpose |
|-------|-------------|--------|---------|
| Access Token | `access_token` | 15 minutes | API authentication |
| Refresh Token | `refresh_token` | 7 days | Obtain new access token |

Both cookies are:
- `httpOnly`: Not accessible via JavaScript (XSS protection)
- `secure`: HTTPS only in production
- `sameSite: lax`: CSRF protection

---

## Real-time Features

### Pusher Events

| Channel | Event | Payload | Description |
|---------|-------|---------|-------------|
| `private-conversation-{id}` | `new-message` | `{ message }` | New message in conversation |
| `private-conversation-{id}` | `typing` | `{ userId, name }` | User typing indicator |
| `private-conversation-{id}` | `message-read` | `{ messageId }` | Message read receipt |
| `private-user-{userId}` | `new-message` | `{ message }` | Notification for new message |
| `presence-online` | `pusher:member_added` | `{ userId }` | User came online |
| `presence-online` | `pusher:member_removed` | `{ userId }` | User went offline |

### Implementation

```typescript
// Server: Trigger event when message is sent
await pusherServer.trigger(
  `private-conversation-${conversationId}`,
  "new-message",
  { message }
);

// Client: Subscribe to conversation events
const channel = pusherClient.subscribe(`private-conversation-${id}`);
channel.bind("new-message", (data) => {
  // Update UI with new message
});
```

---

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/login` | Initiate Google OAuth |
| GET | `/api/auth/callback` | Google OAuth callback |
| POST | `/api/auth/signup` | Email/password registration |
| POST | `/api/auth/signin` | Email/password login |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Clear auth cookies |
| GET | `/api/auth/me` | Get current user |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List all users |
| GET | `/api/users/[id]` | Get user by ID |
| PATCH | `/api/users/[id]` | Update user profile |

### Conversations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/conversations` | List user's conversations |
| POST | `/api/conversations` | Create new conversation |
| GET | `/api/conversations/[id]` | Get conversation details |
| DELETE | `/api/conversations/[id]` | Delete conversation |

### Messages

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/conversations/[id]/messages` | Get messages in conversation |
| POST | `/api/messages` | Send a message |
| PATCH | `/api/messages/[id]/read` | Mark message as read |

### Other

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/pusher/auth` | Authenticate Pusher channel |
| POST | `/api/ai/chat` | AI chat assistance |
| POST | `/api/uploadthing` | File upload handler |

---

## Database Schema

```prisma
model User {
  id          String    @id @default(cuid())
  email       String    @unique
  name        String
  image       String?
  password    String?   // For email/password auth (hashed)
  googleId    String?   @unique
  isOnline    Boolean   @default(false)
  lastSeenAt  DateTime  @default(now())
  createdAt   DateTime  @default(now())

  sentMessages      Message[]      @relation("SentMessages")
  receivedMessages  Message[]      @relation("ReceivedMessages")
  conversationsAsUser1 Conversation[] @relation("User1")
  conversationsAsUser2 Conversation[] @relation("User2")
}

model Conversation {
  id        String    @id @default(cuid())
  user1Id   String
  user2Id   String
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  user1     User      @relation("User1", fields: [user1Id], references: [id])
  user2     User      @relation("User2", fields: [user2Id], references: [id])
  messages  Message[]

  @@unique([user1Id, user2Id])
}

model Message {
  id             String   @id @default(cuid())
  content        String
  senderId       String
  receiverId     String
  conversationId String
  isRead         Boolean  @default(false)
  fileUrl        String?  // For file attachments
  fileType       String?  // MIME type
  fileName       String?  // Original filename
  createdAt      DateTime @default(now())

  sender       User         @relation("SentMessages", fields: [senderId], references: [id])
  receiver     User         @relation("ReceivedMessages", fields: [receiverId], references: [id])
  conversation Conversation @relation(fields: [conversationId], references: [id])
}
```

---

## Setup Instructions

### Prerequisites

- Node.js 18+
- PostgreSQL database (recommend [Neon](https://neon.tech))
- Google Cloud project for OAuth
- Pusher account for real-time features
- UploadThing account for file uploads

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd shippr-mvp

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your values

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Run development server
npm run dev
```

### Build for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

---

## Environment Variables

Create a `.env` file with the following variables:

```env
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
DIRECT_URL="postgresql://user:pass@host/db?sslmode=require"

# Google OAuth
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"

# JWT Secrets (generate with: openssl rand -base64 32)
JWT_SECRET="your-jwt-secret-min-32-chars"
JWT_REFRESH_SECRET="your-refresh-secret-min-32-chars"

# Pusher (Real-time)
PUSHER_APP_ID="your-app-id"
PUSHER_KEY="your-key"
PUSHER_SECRET="your-secret"
PUSHER_CLUSTER="your-cluster"
NEXT_PUBLIC_PUSHER_KEY="your-key"
NEXT_PUBLIC_PUSHER_CLUSTER="your-cluster"

# UploadThing (File uploads)
UPLOADTHING_SECRET="your-secret"
UPLOADTHING_APP_ID="your-app-id"

# AI (Google Gemini)
GOOGLE_GENERATIVE_AI_API_KEY="your-api-key"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## Key Architecture Decisions


### Why Pusher instead of Socket.io?

Pusher works seamlessly with Vercel's serverless architecture. Socket.io requires persistent connections which don't work well with serverless functions.


### Why httpOnly cookies instead of localStorage?

- Protects against XSS attacks (JavaScript can't access cookies)
- Automatically sent with requests (no manual header management)
- Works with SSR (available on server-side)

### Why Zustand + React Query?

- **Zustand**: Lightweight, simple API for client-only state (UI state, selections)
- **React Query**: Handles server state with caching, background refetching, optimistic updates

---

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:studio` | Open Prisma Studio |

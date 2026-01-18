# Database

## Overview

We use **Prisma ORM** with **Neon PostgreSQL** (serverless database).

## Why Neon?

- Serverless: Scales to zero, pay for usage
- Connection pooling: Handles many serverless connections
- Free tier: Good for development
- Fast: Edge-compatible

## Schema

### User

Stores registered users.

```prisma
model User {
  id         String   @id @default(cuid())
  email      String   @unique
  name       String
  image      String?
  googleId   String?  @unique
  isOnline   Boolean  @default(false)
  lastSeenAt DateTime @default(now())
  createdAt  DateTime @default(now())
}
```

| Field | Type | Description |
|-------|------|-------------|
| id | String | Unique identifier |
| email | String | User's email (unique) |
| name | String | Display name |
| image | String? | Profile picture URL |
| googleId | String? | Google account ID |
| isOnline | Boolean | Currently online? |
| lastSeenAt | DateTime | Last activity time |

### Conversation

Links two users in a chat.

```prisma
model Conversation {
  id        String   @id @default(cuid())
  user1Id   String
  user2Id   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([user1Id, user2Id])
}
```

| Field | Type | Description |
|-------|------|-------------|
| id | String | Unique identifier |
| user1Id | String | First user's ID |
| user2Id | String | Second user's ID |
| updatedAt | DateTime | Last message time |

### Message

Individual chat messages.

```prisma
model Message {
  id             String   @id @default(cuid())
  content        String
  senderId       String
  receiverId     String
  conversationId String
  isRead         Boolean  @default(false)
  isDelivered    Boolean  @default(false)
  isAiGenerated  Boolean  @default(false)
  createdAt      DateTime @default(now())
}
```

| Field | Type | Description |
|-------|------|-------------|
| content | String | Message text |
| senderId | String | Who sent it |
| receiverId | String | Who receives it |
| isRead | Boolean | Has been read? |
| isDelivered | Boolean | Has been delivered? |
| isAiGenerated | Boolean | Created by AI? |

## Files

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | Database schema |
| `src/lib/prisma.ts` | Prisma client singleton |

## Commands

```bash
# Push schema to database (no migrations)
npm run db:push

# Generate Prisma client
npm run db:generate

# Create migration
npm run db:migrate

# Open visual database editor
npm run db:studio
```

## Environment Variables

```env
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
```

## Setup Neon

1. Go to [neon.tech](https://neon.tech)
2. Create account and new project
3. Copy connection string from dashboard
4. Paste into `.env` as `DATABASE_URL`
5. Run `npm run db:push`

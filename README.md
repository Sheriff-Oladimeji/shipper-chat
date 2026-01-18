# Shippr Chat

Real-time chat app with Next.js 16, Google OAuth, and AI assistance.

## Quick Start

```bash
# Install
npm install

# Set up database
npm run db:push
npm run db:generate

# Run
npm run dev
```

## Documentation

| Doc | Description |
|-----|-------------|
| [Authentication](docs/authentication.md) | Google OAuth + JWT tokens |
| [Real-time](docs/realtime.md) | WebSocket messaging |
| [Database](docs/database.md) | Prisma + Neon PostgreSQL |
| [State Management](docs/state-management.md) | Zustand + React Query |
| [AI Chat](docs/ai-chat.md) | Google Gemini integration |
| [API Reference](docs/api-reference.md) | All endpoints |

## Environment Variables

Copy `.env.example` to `.env` and fill in:

| Variable | Get from |
|----------|----------|
| `DATABASE_URL` | [neon.tech](https://neon.tech) |
| `GOOGLE_CLIENT_ID` | [Google Cloud Console](https://console.cloud.google.com) |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console |
| `JWT_SECRET` | `openssl rand -base64 32` |
| `JWT_REFRESH_SECRET` | `openssl rand -base64 32` |
| `PUSHER_*` | [pusher.com](https://pusher.com) |
| `GOOGLE_GENERATIVE_AI_API_KEY` | [AI Studio](https://aistudio.google.com) |

## Tech Stack

- Next.js 16 (App Router)
- Prisma + Neon PostgreSQL
- Pusher (WebSocket service)
- Google OAuth + JWT
- Zustand + React Query
- Vercel AI SDK + Gemini

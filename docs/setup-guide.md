# Setup Guide

Complete step-by-step guide to get Shippr Chat running.

---

## Prerequisites

- Node.js 18+ installed
- A Google account
- All environment variables added to `.env` (see below)

---

## Step 1: Environment Variables

Create a `.env` file in the project root with:

```env
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://..."

# Google OAuth
GOOGLE_CLIENT_ID="xxxxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxxxx"

# JWT Secrets (generate with: openssl rand -base64 32)
JWT_SECRET="your-32-char-secret"
JWT_REFRESH_SECRET="your-32-char-secret"

# Pusher
PUSHER_APP_ID="1234567"
PUSHER_KEY="abc123"
PUSHER_SECRET="xyz789"
PUSHER_CLUSTER="eu"
NEXT_PUBLIC_PUSHER_KEY="abc123"
NEXT_PUBLIC_PUSHER_CLUSTER="eu"

# Google AI
GOOGLE_GENERATIVE_AI_API_KEY="your-key"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Where to get each:

| Variable | Source |
|----------|--------|
| DATABASE_URL | [neon.tech](https://neon.tech) → Create project → Connection string |
| GOOGLE_CLIENT_ID | [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials |
| GOOGLE_CLIENT_SECRET | Same as above |
| JWT_SECRET | Run `openssl rand -base64 32` in terminal |
| JWT_REFRESH_SECRET | Run `openssl rand -base64 32` again |
| PUSHER_* | [pusher.com](https://pusher.com) → Create Channels app → App Keys |
| GOOGLE_GENERATIVE_AI_API_KEY | [aistudio.google.com](https://aistudio.google.com/apikey) |

---

## Step 2: Install Dependencies

```bash
npm install
```

This installs all required packages.

---

## Step 3: Generate Prisma Client

```bash
npm run db:generate
```

This creates the database client code from your schema.

---

## Step 4: Push Schema to Database

```bash
npm run db:push
```

This creates the tables in your Neon database:
- `User` - stores user info
- `Conversation` - stores chat sessions
- `Message` - stores messages

---

## Step 5: Verify Database (Optional)

```bash
npm run db:studio
```

This opens Prisma Studio at http://localhost:5555

You should see:
- User table (empty)
- Conversation table (empty)
- Message table (empty)

Press `Ctrl+C` to close when done.

---

## Step 6: Run the App

```bash
npm run dev
```

Open http://localhost:3000

---

## Step 7: Test the App

### Test 1: Login
1. Go to http://localhost:3000
2. Should redirect to /login
3. Click "Sign in with Google"
4. Select your Google account
5. Should redirect back to the chat

### Test 2: Create Another User
1. Open an incognito/private window
2. Go to http://localhost:3000
3. Login with a different Google account

### Test 3: Start a Chat
1. In the first window, click "New Message"
2. Select the other user
3. Send a message
4. The message should appear in the other window instantly

---

## Troubleshooting

### "Cannot find module '@prisma/client'"
```bash
npm run db:generate
```

### "Database connection failed"
- Check your DATABASE_URL in `.env`
- Make sure it starts with `postgresql://`
- Check Neon dashboard to verify database exists

### "Google OAuth error: redirect_uri_mismatch"
- Go to Google Cloud Console → APIs & Services → Credentials
- Edit your OAuth client
- Add `http://localhost:3000/api/auth/callback/google` to Authorized redirect URIs

### "Pusher connection failed"
- Verify PUSHER_KEY and PUSHER_CLUSTER match in both regular and NEXT_PUBLIC_ versions
- Check Pusher dashboard to verify app exists

### "Invalid token" after login
- Make sure JWT_SECRET is at least 32 characters
- Clear cookies and try again

---

## Project Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Run production build |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:migrate` | Create migration file |
| `npm run db:studio` | Open database GUI |

---

## Next Steps After Setup

1. **Test all features:**
   - Login/logout
   - Create conversation
   - Send messages
   - Real-time updates
   - Typing indicators
   - AI chat

2. **Deploy to Vercel:**
   - Push to GitHub
   - Connect to Vercel
   - Add environment variables in Vercel dashboard
   - Add production redirect URI to Google OAuth

---

## File Structure Overview

```
shippr-mvp/
├── .env                    # Your secrets (don't commit!)
├── .env.example            # Template for .env
├── prisma/
│   └── schema.prisma       # Database schema
├── src/
│   ├── app/                # Next.js pages & API routes
│   ├── components/         # React components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utilities (auth, db, pusher)
│   ├── stores/             # Zustand state
│   └── types/              # TypeScript types
└── docs/                   # Documentation
```

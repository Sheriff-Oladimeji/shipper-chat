# Authentication

## Overview

This app uses **Google OAuth** for user login and **JWT tokens** for session management.

## How It Works

```
1. User clicks "Sign in with Google"
2. Browser redirects to Google's login page
3. User logs in with their Google account
4. Google redirects back with an authorization code
5. Server exchanges code for user info (name, email, picture)
6. Server creates/finds user in database
7. Server generates JWT tokens and stores in HTTP-only cookies
8. User is authenticated!
```

## Why Google OAuth?

- No password management needed
- Users trust Google login
- Get user profile (name, picture) automatically
- Secure by default

## Why JWT Tokens?

- **Stateless**: No session storage needed on server
- **Fast**: Just verify signature, no database lookup
- **Scalable**: Works with multiple servers

## Token Types

| Token | Lifetime | Purpose |
|-------|----------|---------|
| Access Token | 15 minutes | Authenticate API requests |
| Refresh Token | 7 days | Get new access tokens |

## Files

| File | Purpose |
|------|---------|
| `src/lib/auth/google.ts` | Google OAuth URL and token exchange |
| `src/lib/auth/jwt.ts` | Create and verify JWT tokens |
| `src/lib/auth/index.ts` | Get current user, set/clear cookies |
| `src/app/api/auth/login/route.ts` | Redirect to Google |
| `src/app/api/auth/callback/google/route.ts` | Handle Google's response |
| `src/app/api/auth/refresh/route.ts` | Refresh expired tokens |
| `src/app/api/auth/logout/route.ts` | Clear tokens, logout |
| `src/app/api/auth/me/route.ts` | Get current user info |
| `src/middleware.ts` | Protect routes, verify tokens |

## Environment Variables

```env
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
JWT_SECRET=min-32-characters-random-string
JWT_REFRESH_SECRET=min-32-characters-random-string
```

## Getting Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or select existing)
3. Go to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Select **Web application**
6. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
7. Copy Client ID and Client Secret to your `.env`

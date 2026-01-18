# AI Chat

## Overview

Users can get AI assistance within conversations using Google Gemini.

## How It Works

```
1. User clicks sparkle icon in message input
2. Modal opens with prompt input
3. User types: "Help me write a polite follow-up"
4. API sends prompt + conversation context to Gemini
5. Gemini generates response
6. Response saved as message with AI badge
7. Message appears in chat
```

## Files

| File | Purpose |
|------|---------|
| `src/app/api/ai/chat/route.ts` | AI endpoint |
| `src/hooks/use-ai-chat.ts` | React hook |
| `src/components/chat/input/ai-dialog.tsx` | Prompt modal |

## API Endpoint

`POST /api/ai/chat`

### Request

```json
{
  "prompt": "Help me write a polite follow-up",
  "conversationId": "conv-123"
}
```

### Response

```json
{
  "success": true,
  "data": {
    "response": "Here's a polite follow-up message...",
    "message": {
      "id": "msg-456",
      "content": "Here's a polite follow-up message...",
      "isAiGenerated": true
    }
  }
}
```

## Implementation

```typescript
// src/app/api/ai/chat/route.ts
import { google } from "@ai-sdk/google";
import { generateText } from "ai";

const { text } = await generateText({
  model: google("gemini-1.5-flash"),
  system: "You are a helpful assistant...",
  prompt: userPrompt,
});
```

## Environment Variables

```env
GOOGLE_GENERATIVE_AI_API_KEY=your-api-key
```

## Getting API Key

1. Go to [Google AI Studio](https://aistudio.google.com)
2. Click "Get API key"
3. Create new key or use existing
4. Copy to `.env`

## Usage in Components

```typescript
import { useAIChat } from '@/hooks/use-ai-chat';

function ChatInput({ conversationId }) {
  const { sendAIPrompt, isLoading } = useAIChat(conversationId);

  const handleAI = (prompt: string) => {
    sendAIPrompt(prompt);
  };
}
```

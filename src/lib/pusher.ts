import Pusher from "pusher";
import PusherClient from "pusher-js";

// Server-side Pusher instance
export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

// Client-side Pusher instance (singleton)
let pusherClientInstance: PusherClient | null = null;

export function getPusherClient(): PusherClient {
  if (typeof window === "undefined") {
    throw new Error("Pusher client can only be used in the browser");
  }

  if (!pusherClientInstance) {
    pusherClientInstance = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      authEndpoint: "/api/pusher/auth",
    });
  }

  return pusherClientInstance;
}

// Channel names
export const getConversationChannel = (conversationId: string) =>
  `private-conversation-${conversationId}`;

export const getUserChannel = (userId: string) =>
  `private-user-${userId}`;

export const PRESENCE_CHANNEL = "presence-online";

// Event names
export const PUSHER_EVENTS = {
  NEW_MESSAGE: "new-message",
  MESSAGE_READ: "message-read",
  MESSAGE_DELIVERED: "message-delivered",
  TYPING_START: "typing-start",
  TYPING_STOP: "typing-stop",
  USER_ONLINE: "user-online",
  USER_OFFLINE: "user-offline",
} as const;

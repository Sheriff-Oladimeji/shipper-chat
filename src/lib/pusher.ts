import Pusher from "pusher";
import PusherClient from "pusher-js";

// Server-side Pusher instance (lazy initialization)
let pusherServerInstance: Pusher | null = null;

export function getPusherServer(): Pusher {
  if (!pusherServerInstance) {
    if (!process.env.PUSHER_APP_ID || !process.env.PUSHER_KEY || !process.env.PUSHER_SECRET) {
      throw new Error("Pusher server credentials not configured");
    }
    pusherServerInstance = new Pusher({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.PUSHER_KEY,
      secret: process.env.PUSHER_SECRET,
      cluster: process.env.PUSHER_CLUSTER || "us2",
      useTLS: true,
    });
  }
  return pusherServerInstance;
}

// For backwards compatibility
export const pusherServer = {
  trigger: async (...args: Parameters<Pusher["trigger"]>) => {
    try {
      return await getPusherServer().trigger(...args);
    } catch (error) {
      console.error("Pusher trigger error:", error);
    }
  },
};

// Client-side Pusher instance (singleton)
let pusherClientInstance: PusherClient | null = null;

export function getPusherClient(): PusherClient | null {
  if (typeof window === "undefined") {
    return null;
  }

  if (!process.env.NEXT_PUBLIC_PUSHER_KEY) {
    console.warn("Pusher client key not configured");
    return null;
  }

  if (!pusherClientInstance) {
    pusherClientInstance = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "us2",
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

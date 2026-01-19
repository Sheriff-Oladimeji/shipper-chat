// Base types (will be available after prisma generate)
export interface User {
  id: string;
  email: string;
  name: string;
  image: string | null;
  googleId: string | null;
  isOnline: boolean;
  lastSeenAt: Date | string;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  user1Id: string;
  user2Id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Attachment {
  id: string;
  messageId: string;
  url: string;
  name: string;
  size: number;
  type: string; // image, video, audio, document, other
  mimeType: string;
  createdAt: Date;
}

export interface Reaction {
  id: string;
  emoji: string;
  userId: string;
  messageId: string;
  user?: {
    id: string;
    name: string;
  };
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  conversationId: string;
  isRead: boolean;
  isDelivered: boolean;
  isAiGenerated: boolean;
  createdAt: Date;
  attachments?: Attachment[];
  sender?: {
    id: string;
    name: string;
    image: string | null;
  };
  reactions?: Reaction[];
}

export interface ConversationSettings {
  id: string;
  userId: string;
  conversationId: string;
  isArchived: boolean;
  isMuted: boolean;
  isMarkedUnread: boolean;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithStatus extends User {
  isOnline: boolean;
}

export interface ConversationWithDetails extends Conversation {
  user1: User;
  user2: User;
  messages: Message[];
  lastMessage?: Message;
  unreadCount?: number;
  settings?: ConversationSettings;
}

export interface MessageWithSender extends Message {
  sender: User;
  receiver: User;
  attachments?: Attachment[];
}

export interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PusherAuthResponse {
  auth: string;
  channel_data?: string;
}

export interface TypingEvent {
  userId: string;
  name: string;
  isTyping: boolean;
}

export interface ReadReceiptEvent {
  messageId: string;
  readBy: string;
  readAt: string;
}

export interface OnlineStatusEvent {
  userId: string;
  isOnline: boolean;
}

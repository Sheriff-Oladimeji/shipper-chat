import { create } from "zustand";
import type { User, Message, ConversationWithDetails } from "@/types";

interface ChatState {
  // Current user
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;

  // Conversations
  conversations: ConversationWithDetails[];
  setConversations: (conversations: ConversationWithDetails[]) => void;
  addConversation: (conversation: ConversationWithDetails) => void;
  updateConversation: (id: string, updates: Partial<ConversationWithDetails>) => void;

  // Active conversation
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;

  // Messages (keyed by conversation id)
  messagesByConversation: Record<string, Message[]>;
  setMessages: (conversationId: string, messages: Message[]) => void;
  addMessage: (conversationId: string, message: Message) => void;
  updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => void;

  // Online users
  onlineUsers: Set<string>;
  setUserOnline: (userId: string) => void;
  setUserOffline: (userId: string) => void;

  // Typing indicators
  typingUsers: Record<string, string[]>; // conversationId -> userIds
  typingTimeouts: Record<string, NodeJS.Timeout>; // timeout keys
  setUserTyping: (conversationId: string, userId: string, isTyping: boolean) => void;

  // UI state
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  // Current user
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),

  // Conversations
  conversations: [],
  setConversations: (conversations) => set({ conversations }),
  addConversation: (conversation) =>
    set((state) => ({
      conversations: [conversation, ...state.conversations.filter((c) => c.id !== conversation.id)],
    })),
  updateConversation: (id, updates) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })),

  // Active conversation
  activeConversationId: null,
  setActiveConversationId: (id) => set({ activeConversationId: id }),

  // Messages
  messagesByConversation: {},
  setMessages: (conversationId, messages) =>
    set((state) => ({
      messagesByConversation: {
        ...state.messagesByConversation,
        [conversationId]: messages,
      },
    })),
  addMessage: (conversationId, message) =>
    set((state) => ({
      messagesByConversation: {
        ...state.messagesByConversation,
        [conversationId]: [
          ...(state.messagesByConversation[conversationId] || []),
          message,
        ],
      },
    })),
  updateMessage: (conversationId, messageId, updates) =>
    set((state) => ({
      messagesByConversation: {
        ...state.messagesByConversation,
        [conversationId]: (state.messagesByConversation[conversationId] || []).map(
          (m) => (m.id === messageId ? { ...m, ...updates } : m)
        ),
      },
    })),

  // Online users
  onlineUsers: new Set(),
  setUserOnline: (userId) =>
    set((state) => ({
      onlineUsers: new Set([...state.onlineUsers, userId]),
    })),
  setUserOffline: (userId) =>
    set((state) => {
      const newSet = new Set(state.onlineUsers);
      newSet.delete(userId);
      return { onlineUsers: newSet };
    }),

  // Typing indicators with auto-clear timeouts
  typingUsers: {},
  typingTimeouts: {} as Record<string, NodeJS.Timeout>,
  setUserTyping: (conversationId, userId, isTyping) =>
    set((state) => {
      const current = state.typingUsers[conversationId] || [];
      const timeoutKey = `${conversationId}-${userId}`;

      // Clear existing timeout for this user
      if (state.typingTimeouts[timeoutKey]) {
        clearTimeout(state.typingTimeouts[timeoutKey]);
      }

      let newTimeouts = { ...state.typingTimeouts };

      if (isTyping) {
        // Auto-clear typing after 5 seconds if no stop received
        const timeout = setTimeout(() => {
          const store = get();
          const currentTyping = store.typingUsers[conversationId] || [];
          set({
            typingUsers: {
              ...store.typingUsers,
              [conversationId]: currentTyping.filter((id) => id !== userId),
            },
          });
        }, 5000);
        newTimeouts[timeoutKey] = timeout;
      } else {
        delete newTimeouts[timeoutKey];
      }

      const newTyping = isTyping
        ? [...new Set([...current, userId])]
        : current.filter((id) => id !== userId);
      return {
        typingUsers: {
          ...state.typingUsers,
          [conversationId]: newTyping,
        },
        typingTimeouts: newTimeouts,
      };
    }),

  // UI state
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),

  // Search
  searchQuery: "",
  setSearchQuery: (query) => set({ searchQuery: query }),
}));

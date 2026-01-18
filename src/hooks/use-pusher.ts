"use client";

import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getPusherClient, getConversationChannel, getUserChannel, PUSHER_EVENTS } from "@/lib/pusher";
import { useChatStore } from "@/stores/chat-store";
import type { Message } from "@/types";
import type PusherClient from "pusher-js";
import type { Channel } from "pusher-js";

export function usePusher(userId: string | undefined) {
  const queryClient = useQueryClient();
  const { addMessage, setUserTyping, updateMessage } = useChatStore();
  const pusherRef = useRef<PusherClient | null>(null);
  const userChannelRef = useRef<Channel | null>(null);

  useEffect(() => {
    if (!userId) return;

    const pusher = getPusherClient();
    pusherRef.current = pusher;

    // Subscribe to user's personal channel
    const userChannel = pusher.subscribe(getUserChannel(userId));
    userChannelRef.current = userChannel;

    userChannel.bind(PUSHER_EVENTS.NEW_MESSAGE, (data: Message & { conversationId: string }) => {
      addMessage(data.conversationId, data);
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["messages", data.conversationId] });
    });

    return () => {
      if (userChannelRef.current) {
        userChannelRef.current.unbind_all();
        pusher.unsubscribe(getUserChannel(userId));
      }
    };
  }, [userId, addMessage, queryClient]);

  return {
    pusher: pusherRef.current,
  };
}

export function useConversationChannel(conversationId: string | null) {
  const queryClient = useQueryClient();
  const { addMessage, setUserTyping, updateMessage } = useChatStore();
  const channelRef = useRef<Channel | null>(null);

  useEffect(() => {
    if (!conversationId) return;

    const pusher = getPusherClient();
    const channel = pusher.subscribe(getConversationChannel(conversationId));
    channelRef.current = channel;

    channel.bind(PUSHER_EVENTS.NEW_MESSAGE, (data: Message) => {
      addMessage(conversationId, data);
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
    });

    channel.bind(PUSHER_EVENTS.TYPING_START, (data: { userId: string; name: string }) => {
      setUserTyping(conversationId, data.userId, true);
    });

    channel.bind(PUSHER_EVENTS.TYPING_STOP, (data: { userId: string }) => {
      setUserTyping(conversationId, data.userId, false);
    });

    channel.bind(PUSHER_EVENTS.MESSAGE_READ, (data: { messageId?: string; conversationId?: string; readBy: string }) => {
      if (data.messageId) {
        updateMessage(conversationId, data.messageId, { isRead: true });
      }
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
    });

    return () => {
      if (channelRef.current) {
        channelRef.current.unbind_all();
        pusher.unsubscribe(getConversationChannel(conversationId));
      }
    };
  }, [conversationId, addMessage, setUserTyping, updateMessage, queryClient]);

  const sendTypingIndicator = useCallback(
    async (isTyping: boolean) => {
      if (!conversationId) return;
      await fetch("/api/typing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, isTyping }),
      });
    },
    [conversationId]
  );

  return {
    sendTypingIndicator,
  };
}

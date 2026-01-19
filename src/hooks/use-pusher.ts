"use client";

import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getPusherClient, getConversationChannel, getUserChannel, PUSHER_EVENTS, PRESENCE_CHANNEL } from "@/lib/pusher";
import { useChatStore } from "@/stores/chat-store";
import type { Message } from "@/types";
import type PusherClient from "pusher-js";
import type { Channel, PresenceChannel } from "pusher-js";

export function usePusher(userId: string | undefined) {
  const queryClient = useQueryClient();
  const { addMessage, setOnlineUsers } = useChatStore();
  const pusherRef = useRef<PusherClient | null>(null);
  const userChannelRef = useRef<Channel | null>(null);
  const presenceChannelRef = useRef<PresenceChannel | null>(null);

  useEffect(() => {
    if (!userId) return;

    const pusher = getPusherClient();
    if (!pusher) return; // Pusher not configured

    pusherRef.current = pusher;

    // Subscribe to user's personal channel
    const userChannel = pusher.subscribe(getUserChannel(userId));
    userChannelRef.current = userChannel;

    userChannel.bind(PUSHER_EVENTS.NEW_MESSAGE, (data: Message & { conversationId: string }) => {
      addMessage(data.conversationId, data);
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["messages", data.conversationId] });
    });

    // Subscribe to presence channel for online status
    const presenceChannel = pusher.subscribe(PRESENCE_CHANNEL) as PresenceChannel;
    presenceChannelRef.current = presenceChannel;

    presenceChannel.bind("pusher:subscription_succeeded", (members: { each: (callback: (member: { id: string }) => void) => void }) => {
      const onlineIds: string[] = [];
      members.each((member: { id: string }) => {
        onlineIds.push(member.id);
      });
      setOnlineUsers(onlineIds);
    });

    presenceChannel.bind("pusher:member_added", (member: { id: string }) => {
      setOnlineUsers((prev: string[]) => [...prev.filter(id => id !== member.id), member.id]);
    });

    presenceChannel.bind("pusher:member_removed", (member: { id: string }) => {
      setOnlineUsers((prev: string[]) => prev.filter(id => id !== member.id));
    });

    return () => {
      if (userChannelRef.current && pusher) {
        userChannelRef.current.unbind_all();
        pusher.unsubscribe(getUserChannel(userId));
      }
      if (presenceChannelRef.current && pusher) {
        presenceChannelRef.current.unbind_all();
        pusher.unsubscribe(PRESENCE_CHANNEL);
      }
    };
  }, [userId, addMessage, setOnlineUsers, queryClient]);

  return {
    pusher: pusherRef.current,
  };
}

export function useConversationChannel(conversationId: string | null) {
  const queryClient = useQueryClient();
  const { addMessage, setUserTyping, updateMessage, markAllMessagesRead } = useChatStore();
  const channelRef = useRef<Channel | null>(null);
  const pusherRef = useRef<PusherClient | null>(null);

  useEffect(() => {
    if (!conversationId) return;

    const pusher = getPusherClient();
    if (!pusher) return; // Pusher not configured

    pusherRef.current = pusher;
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
        // Single message read
        updateMessage(conversationId, data.messageId, { isRead: true });
      } else if (data.conversationId) {
        // All messages in conversation marked as read by recipient
        markAllMessagesRead(conversationId, data.readBy);
      }
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
    });

    return () => {
      if (channelRef.current && pusherRef.current) {
        channelRef.current.unbind_all();
        pusherRef.current.unsubscribe(getConversationChannel(conversationId));
      }
    };
  }, [conversationId, addMessage, setUserTyping, updateMessage, markAllMessagesRead, queryClient]);

  const sendTypingIndicator = useCallback(
    async (isTyping: boolean) => {
      if (!conversationId) return;
      try {
        await fetch("/api/typing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId, isTyping }),
        });
      } catch (error) {
        // Ignore typing indicator errors
      }
    },
    [conversationId]
  );

  return {
    sendTypingIndicator,
  };
}

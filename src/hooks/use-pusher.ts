"use client";

import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getPusherClient, getConversationChannel, getUserChannel, PUSHER_EVENTS, PRESENCE_CHANNEL } from "@/lib/realtime";
import { useChatStore } from "@/stores/chat-store";
import type { Message } from "@/types";
import type PusherClient from "pusher-js";
import type { Channel, PresenceChannel } from "pusher-js";

// Play notification sound using Web Audio API
function playNotificationSound() {
  if (typeof window === "undefined") return;

  try {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

    // Create a simple notification sound (two-tone chime)
    const playTone = (frequency: number, startTime: number, duration: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0.3, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };

    const now = audioContext.currentTime;
    playTone(880, now, 0.1); // A5
    playTone(1174.66, now + 0.1, 0.15); // D6
  } catch {
    // Ignore audio errors (user hasn't interacted yet)
  }
}

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

    userChannel.bind(PUSHER_EVENTS.NEW_MESSAGE, (data: Message & { conversationId: string; sender?: { name: string; image?: string } }) => {
      // Get current state from store (avoids stale closures)
      const store = useChatStore.getState();

      addMessage(data.conversationId, data);
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["messages", data.conversationId] });

      // Show notification if message is from someone else and not in active conversation
      const isFromOther = data.senderId !== userId;
      const isInActiveConversation = data.conversationId === store.activeConversationId;

      if (isFromOther && !isInActiveConversation) {
        // Increment unread count
        store.incrementUnreadCount();

        // Play notification sound
        if (store.notificationSettings.soundEnabled) {
          playNotificationSound();
        }

        const senderName = data.sender?.name || "Someone";
        const messagePreview = data.content.length > 50
          ? data.content.substring(0, 50) + "..."
          : data.content || "Sent an attachment";

        // Show toast notification
        if (store.notificationSettings.inAppEnabled) {
          toast.message(senderName, {
            description: messagePreview,
            action: {
              label: "View",
              onClick: () => {
                window.location.href = `/c/${data.conversationId}`;
              },
            },
          });
        }

        // Show desktop notification
        if (store.notificationSettings.desktopEnabled && "Notification" in window && Notification.permission === "granted") {
          const notification = new Notification(senderName, {
            body: messagePreview,
            icon: data.sender?.image || "/logo.svg",
            tag: data.conversationId, // Prevents duplicate notifications
          });

          notification.onclick = () => {
            window.focus();
            window.location.href = `/c/${data.conversationId}`;
            notification.close();
          };
        }
      }
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
      // Update React Query cache directly for instant UI update
      queryClient.setQueryData<Message[]>(
        ["messages", conversationId],
        (oldMessages = []) => oldMessages.map((msg) => {
          if (data.messageId) {
            // Single message read
            return msg.id === data.messageId ? { ...msg, isRead: true } : msg;
          } else {
            // All messages sent to readBy user are now read
            return msg.receiverId === data.readBy ? { ...msg, isRead: true } : msg;
          }
        })
      );
      // Also update store for consistency
      if (data.messageId) {
        updateMessage(conversationId, data.messageId, { isRead: true });
      } else if (data.conversationId) {
        markAllMessagesRead(conversationId, data.readBy);
      }
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

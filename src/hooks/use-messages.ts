"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useChatStore } from "@/stores/chat-store";
import { useEffect } from "react";
import type { Message } from "@/types";

interface MessagesResponse {
  data: Message[];
  nextCursor: string | null;
}

async function fetchMessages(conversationId: string): Promise<Message[]> {
  const response = await fetch(`/api/conversations/${conversationId}/messages`);
  if (!response.ok) {
    throw new Error("Failed to fetch messages");
  }
  const data: { success: boolean; data: Message[] } = await response.json();
  return data.data;
}

async function sendMessage(conversationId: string, content: string): Promise<Message> {
  const response = await fetch(`/api/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!response.ok) {
    throw new Error("Failed to send message");
  }
  const data = await response.json();
  return data.data;
}

async function markAllRead(conversationId: string): Promise<void> {
  await fetch("/api/messages/read-all", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conversationId }),
  });
}

export function useMessages(conversationId: string | null) {
  const queryClient = useQueryClient();
  const { setMessages, addMessage } = useChatStore();

  const {
    data: messages = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => fetchMessages(conversationId!),
    enabled: !!conversationId,
  });

  // Sync with store
  useEffect(() => {
    if (conversationId && messages.length > 0) {
      setMessages(conversationId, messages);
    }
  }, [conversationId, messages, setMessages]);

  const sendMutation = useMutation({
    mutationFn: ({ content }: { content: string }) =>
      sendMessage(conversationId!, content),
    onSuccess: (newMessage) => {
      if (conversationId) {
        addMessage(conversationId, newMessage);
        queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      }
    },
  });

  const markReadMutation = useMutation({
    mutationFn: () => markAllRead(conversationId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  return {
    messages,
    isLoading,
    error,
    refetch,
    sendMessage: (content: string) => sendMutation.mutate({ content }),
    isSending: sendMutation.isPending,
    markAllRead: markReadMutation.mutate,
  };
}

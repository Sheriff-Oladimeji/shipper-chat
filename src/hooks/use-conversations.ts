"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useChatStore } from "@/stores/chat-store";
import { useEffect } from "react";
import type { ConversationWithDetails } from "@/types";

async function fetchConversations(): Promise<ConversationWithDetails[]> {
  const response = await fetch("/api/conversations");
  if (!response.ok) {
    throw new Error("Failed to fetch conversations");
  }
  const data = await response.json();
  return data.data;
}

async function createConversation(userId: string): Promise<ConversationWithDetails> {
  const response = await fetch("/api/conversations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  if (!response.ok) {
    throw new Error("Failed to create conversation");
  }
  const data = await response.json();
  return data.data;
}

export function useConversations() {
  const queryClient = useQueryClient();
  const { setConversations, addConversation } = useChatStore();

  const {
    data: conversations = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["conversations"],
    queryFn: fetchConversations,
  });

  // Sync with store
  useEffect(() => {
    if (conversations.length > 0) {
      setConversations(conversations);
    }
  }, [conversations, setConversations]);

  const createMutation = useMutation({
    mutationFn: createConversation,
    onSuccess: (newConversation) => {
      addConversation(newConversation);
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  return {
    conversations,
    isLoading,
    error,
    refetch,
    createConversation: createMutation.mutate,
    isCreating: createMutation.isPending,
  };
}

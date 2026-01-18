"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useChatStore } from "@/stores/chat-store";

interface AIChatResponse {
  response: string;
  message: any;
}

async function sendAIPrompt(conversationId: string, prompt: string): Promise<AIChatResponse> {
  const response = await fetch("/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conversationId, prompt }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to get AI response");
  }
  const data = await response.json();
  return data.data;
}

export function useAIChat(conversationId: string | null) {
  const queryClient = useQueryClient();
  const { addMessage } = useChatStore();

  const mutation = useMutation({
    mutationFn: ({ prompt }: { prompt: string }) =>
      sendAIPrompt(conversationId!, prompt),
    onSuccess: (data) => {
      if (conversationId && data.message) {
        addMessage(conversationId, data.message);
        queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      }
    },
  });

  return {
    sendAIPrompt: (prompt: string) => mutation.mutate({ prompt }),
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}

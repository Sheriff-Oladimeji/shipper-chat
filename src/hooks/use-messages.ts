"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useChatStore } from "@/stores/chat-store";
import { useEffect, useCallback, useRef } from "react";
import { useUploadThing } from "@/lib/upload/uploadthing-client";
import type { Message, Reaction } from "@/types";

interface SendMessagePayload {
  content: string;
  attachments?: Array<{
    url: string;
    name: string;
    size: number;
    mimeType: string;
  }>;
}

interface VoiceNoteAttachment {
  url: string;
  name: string;
  size: number;
  mimeType: string;
}

// Extended message type for optimistic updates
interface OptimisticMessage extends Message {
  isPending?: boolean;
  tempId?: string;
}

async function fetchMessages(conversationId: string): Promise<Message[]> {
  const response = await fetch(`/api/conversations/${conversationId}/messages`);
  if (!response.ok) {
    throw new Error("Failed to fetch messages");
  }
  const data: { success: boolean; data: Message[] } = await response.json();
  return data.data;
}

async function sendMessage(conversationId: string, payload: SendMessagePayload): Promise<Message> {
  const response = await fetch(`/api/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
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

async function reactToMessage(messageId: string, emoji: string): Promise<{ action: string }> {
  const response = await fetch(`/api/messages/${messageId}/reactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ emoji }),
  });
  if (!response.ok) {
    throw new Error("Failed to react to message");
  }
  const data = await response.json();
  return data;
}

export function useMessages(conversationId: string | null) {
  const queryClient = useQueryClient();
  const { setMessages, addMessage, currentUser } = useChatStore();
  const tempIdCounterRef = useRef(0);
  const { startUpload } = useUploadThing("messageAttachment");

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
    mutationFn: (payload: SendMessagePayload) =>
      sendMessage(conversationId!, payload),
    // Optimistic update - add message immediately
    onMutate: async (newMessagePayload) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["messages", conversationId] });

      // Snapshot previous messages
      const previousMessages = queryClient.getQueryData<Message[]>(["messages", conversationId]);

      // Generate temp ID
      const tempId = `temp-${Date.now()}-${tempIdCounterRef.current++}`;

      // Create optimistic message
      const optimisticMessage: OptimisticMessage = {
        id: tempId,
        tempId,
        content: newMessagePayload.content,
        senderId: currentUser?.id || "",
        receiverId: "", // Will be filled by server
        conversationId: conversationId!,
        isRead: false,
        isDelivered: false,
        isAiGenerated: false,
        isPending: true,
        createdAt: new Date(),
        attachments: newMessagePayload.attachments?.map((att, idx) => ({
          id: `temp-att-${idx}`,
          messageId: tempId,
          url: att.url,
          name: att.name,
          size: att.size,
          type: att.mimeType.startsWith("image/") ? "image" :
                att.mimeType.startsWith("video/") ? "video" :
                att.mimeType.startsWith("audio/") ? "audio" : "document",
          mimeType: att.mimeType,
          createdAt: new Date(),
        })),
      };

      // Optimistically update messages
      queryClient.setQueryData<OptimisticMessage[]>(
        ["messages", conversationId],
        (old = []) => [...old, optimisticMessage]
      );

      return { previousMessages, tempId };
    },
    onError: (err, newMessage, context) => {
      // Rollback on error
      if (context?.previousMessages) {
        queryClient.setQueryData(["messages", conversationId], context.previousMessages);
      }
    },
    onSuccess: (newMessage, variables, context) => {
      // Replace optimistic message with real message
      queryClient.setQueryData<Message[]>(
        ["messages", conversationId],
        (old = []) => old.map((msg) =>
          (msg as OptimisticMessage).tempId === context?.tempId ? newMessage : msg
        )
      );
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["conversation-media", conversationId] });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: () => markAllRead(conversationId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  const reactMutation = useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: string; emoji: string }) =>
      reactToMessage(messageId, emoji),
    // Optimistic update for reactions
    onMutate: async ({ messageId, emoji }) => {
      await queryClient.cancelQueries({ queryKey: ["messages", conversationId] });

      const previousMessages = queryClient.getQueryData<Message[]>(["messages", conversationId]);

      // Optimistically update reaction
      queryClient.setQueryData<Message[]>(
        ["messages", conversationId],
        (old = []) => old.map((msg) => {
          if (msg.id !== messageId) return msg;

          const existingReactions = msg.reactions || [];
          const userId = currentUser?.id || "";
          const existingReaction = existingReactions.find(
            (r) => r.userId === userId && r.emoji === emoji
          );

          if (existingReaction) {
            // Remove reaction
            return {
              ...msg,
              reactions: existingReactions.filter(
                (r) => !(r.userId === userId && r.emoji === emoji)
              ),
            };
          } else {
            // Add reaction
            const newReaction: Reaction = {
              id: `temp-reaction-${Date.now()}`,
              emoji,
              userId,
              messageId,
              user: { id: userId, name: currentUser?.name || "" },
            };
            return {
              ...msg,
              reactions: [...existingReactions, newReaction],
            };
          }
        })
      );

      return { previousMessages };
    },
    onError: (err, variables, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(["messages", conversationId], context.previousMessages);
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
    },
  });

  // Voice note: show immediately in chat, upload in background
  const sendVoiceNote = useCallback(async (file: File) => {
    if (!conversationId || !currentUser) return;

    const tempId = `temp-voice-${Date.now()}-${tempIdCounterRef.current++}`;
    const localUrl = URL.createObjectURL(file);

    // Add optimistic message immediately
    const optimisticMessage: OptimisticMessage = {
      id: tempId,
      tempId,
      content: "",
      senderId: currentUser.id,
      receiverId: "",
      conversationId: conversationId,
      isRead: false,
      isDelivered: false,
      isAiGenerated: false,
      isPending: true,
      createdAt: new Date(),
      attachments: [{
        id: `temp-att-voice`,
        messageId: tempId,
        url: localUrl,
        name: file.name,
        size: file.size,
        type: "audio",
        mimeType: "audio/webm",
        createdAt: new Date(),
      }],
    };

    // Show in chat immediately
    queryClient.setQueryData<OptimisticMessage[]>(
      ["messages", conversationId],
      (old = []) => [...old, optimisticMessage]
    );

    try {
      // Upload in background
      const uploadResult = await startUpload([file]);

      if (uploadResult && uploadResult.length > 0) {
        const uploaded = uploadResult[0];
        const fileUrl = uploaded.ufsUrl || uploaded.url;

        // Send to server with real URL
        const realMessage = await sendMessage(conversationId, {
          content: "",
          attachments: [{
            url: fileUrl,
            name: file.name,
            size: file.size,
            mimeType: "audio/webm",
          }],
        });

        // Replace optimistic with real message
        queryClient.setQueryData<Message[]>(
          ["messages", conversationId],
          (old = []) => old.map((msg) =>
            (msg as OptimisticMessage).tempId === tempId ? realMessage : msg
          )
        );

        // Cleanup local URL
        URL.revokeObjectURL(localUrl);

        // Refresh conversations list
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      }
    } catch (error) {
      console.error("Voice note send failed:", error);
      // Remove failed message
      queryClient.setQueryData<Message[]>(
        ["messages", conversationId],
        (old = []) => old.filter((msg) => (msg as OptimisticMessage).tempId !== tempId)
      );
      URL.revokeObjectURL(localUrl);
    }
  }, [conversationId, currentUser, queryClient, startUpload]);

  return {
    messages: messages as OptimisticMessage[],
    isLoading,
    error,
    refetch,
    sendMessage: useCallback(
      (content: string, attachments?: SendMessagePayload["attachments"]) =>
        sendMutation.mutate({ content, attachments }),
      [sendMutation]
    ),
    sendVoiceNote,
    isSending: sendMutation.isPending,
    markAllRead: markReadMutation.mutate,
    reactToMessage: useCallback(
      (messageId: string, emoji: string) =>
        reactMutation.mutate({ messageId, emoji }),
      [reactMutation]
    ),
  };
}

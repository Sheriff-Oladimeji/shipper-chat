"use client";

import { useState, useEffect } from "react";
import { ConversationHeader } from "./conversation-header";
import { MessageList } from "./message-list";
import { MessageInput } from "../input/message-input";
import { AIDialog } from "../input/ai-dialog";
import { useMessages } from "@/hooks/use-messages";
import { useAIChat } from "@/hooks/use-ai-chat";
import { useConversationChannel } from "@/hooks/use-pusher";
import { useChatStore } from "@/stores/chat-store";
import type { User } from "@/types";

interface ConversationViewProps {
  conversationId: string;
  otherUser: User;
  currentUserId: string;
}

export function ConversationView({
  conversationId,
  otherUser,
  currentUserId,
}: ConversationViewProps) {
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
  const { messages, isLoading, sendMessage, isSending, markAllRead } =
    useMessages(conversationId);
  const { sendAIPrompt, isLoading: isAILoading } = useAIChat(conversationId);
  const { sendTypingIndicator } = useConversationChannel(conversationId);
  const { typingUsers } = useChatStore();

  // Mark messages as read when viewing conversation
  useEffect(() => {
    if (conversationId) {
      markAllRead();
    }
  }, [conversationId, markAllRead]);

  const typingUserNames = (typingUsers[conversationId] || [])
    .filter((id) => id !== currentUserId)
    .map(() => otherUser.name);

  const handleSendMessage = (content: string) => {
    sendMessage(content);
  };

  const handleAISubmit = (prompt: string) => {
    sendAIPrompt(prompt);
    setIsAIDialogOpen(false);
  };

  return (
    <div className="flex h-full flex-col">
      <ConversationHeader
        name={otherUser.name}
        image={otherUser.image}
        isOnline={otherUser.isOnline}
      />
      <MessageList
        messages={messages}
        currentUserId={currentUserId}
        typingUserNames={typingUserNames}
        isLoading={isLoading}
      />
      <MessageInput
        onSend={handleSendMessage}
        onTyping={sendTypingIndicator}
        onAIClick={() => setIsAIDialogOpen(true)}
        isSending={isSending}
      />
      <AIDialog
        open={isAIDialogOpen}
        onOpenChange={setIsAIDialogOpen}
        onSubmit={handleAISubmit}
        isLoading={isAILoading}
      />
    </div>
  );
}

export { ConversationHeader } from "./conversation-header";
export { MessageList } from "./message-list";
export { MessageBubble } from "./message-bubble";
export { DateSeparator } from "./date-separator";
export { TypingIndicator } from "./typing-indicator";

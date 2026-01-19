"use client";

import { useEffect, useState } from "react";
import { ConversationHeader } from "./conversation-header";
import { MessageList } from "./message-list";
import { MessageInput } from "../input/message-input";
import { ContactInfoPanel } from "../contact-info-panel";
import { useMessages } from "@/hooks/use-messages";
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
  const [isContactInfoOpen, setIsContactInfoOpen] = useState(false);
  const { messages, isLoading, sendMessage, sendVoiceNote, isSending, markAllRead, reactToMessage } =
    useMessages(conversationId);
  const { sendTypingIndicator } = useConversationChannel(conversationId);
  const { typingUsers, onlineUsers } = useChatStore();
  const isOtherUserOnline = onlineUsers.has(otherUser.id);

  // Mark messages as read when viewing conversation
  useEffect(() => {
    if (conversationId) {
      markAllRead();
    }
  }, [conversationId, markAllRead]);

  const typingUserNames = (typingUsers[conversationId] || [])
    .filter((id) => id !== currentUserId)
    .map(() => otherUser.name);

  const handleSendMessage = (content: string, attachments?: Array<{ url: string; name: string; size: number; mimeType: string }>) => {
    sendMessage(content, attachments);
  };

  return (
    <div className="flex h-full flex-col bg-card rounded-2xl m-3 overflow-hidden border">
      <ConversationHeader
        name={otherUser.name}
        image={otherUser.image}
        isOnline={isOtherUserOnline}
        lastSeenAt={otherUser.lastSeenAt}
        onOpenContactInfo={() => setIsContactInfoOpen(true)}
      />
      <MessageList
        messages={messages}
        currentUserId={currentUserId}
        typingUserNames={typingUserNames}
        isLoading={isLoading}
        onReact={reactToMessage}
      />
      <MessageInput
        onSend={handleSendMessage}
        onSendVoiceNote={sendVoiceNote}
        onTyping={sendTypingIndicator}
        isSending={isSending}
      />
      <ContactInfoPanel
        open={isContactInfoOpen}
        onOpenChange={setIsContactInfoOpen}
        user={otherUser}
        conversationId={conversationId}
      />
    </div>
  );
}

export { ConversationHeader } from "./conversation-header";
export { MessageList } from "./message-list";
export { MessageBubble } from "./message-bubble";
export { DateSeparator } from "./date-separator";
export { TypingIndicator } from "./typing-indicator";

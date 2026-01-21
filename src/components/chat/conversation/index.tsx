"use client";

import { useEffect, useState, useMemo } from "react";
import { ConversationHeader } from "./conversation-header";
import { MessageList } from "./message-list";
import { MessageInput } from "../input/message-input";
import { ContactInfoPanel } from "../contact-info-panel";
import { useMessages } from "@/hooks/use-messages";
import { useConversationChannel } from "@/hooks/use-pusher";
import { useChatStore } from "@/stores/chat-store";
import { Search, X, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const { messages, isLoading, sendMessage, sendVoiceNote, isSending, markAllRead, reactToMessage } =
    useMessages(conversationId);
  const { sendTypingIndicator } = useConversationChannel(conversationId);
  const { typingUsers, onlineUsers } = useChatStore();
  const isOtherUserOnline = onlineUsers.has(otherUser.id);

  // Find matching messages
  const matchingMessages = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return messages.filter((msg) =>
      msg.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [messages, searchQuery]);

  const handleSearchClose = () => {
    setIsSearchOpen(false);
    setSearchQuery("");
    setCurrentMatchIndex(0);
  };

  const handleNextMatch = () => {
    if (matchingMessages.length > 0) {
      setCurrentMatchIndex((prev) => (prev + 1) % matchingMessages.length);
    }
  };

  const handlePrevMatch = () => {
    if (matchingMessages.length > 0) {
      setCurrentMatchIndex((prev) => (prev - 1 + matchingMessages.length) % matchingMessages.length);
    }
  };

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
        onSearch={() => setIsSearchOpen(true)}
      />

      {/* Message Search Bar - WhatsApp style */}
      {isSearchOpen && (
        <div className="flex items-center gap-3 px-4 py-2 border-b bg-card">
          {/* Back button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={handleSearchClose}
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Search input */}
          <div className="flex-1 flex items-center gap-2 bg-muted rounded-lg px-3 py-1.5">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentMatchIndex(0);
              }}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              autoFocus
            />
          </div>

          {/* Results count */}
          {searchQuery && (
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {matchingMessages.length > 0
                ? `${currentMatchIndex + 1} of ${matchingMessages.length}`
                : "0 results"}
            </span>
          )}

          {/* Navigation arrows */}
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handlePrevMatch}
              disabled={matchingMessages.length === 0}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleNextMatch}
              disabled={matchingMessages.length === 0}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>

          {/* Done button */}
          <Button
            variant="ghost"
            size="sm"
            className="text-primary font-medium"
            onClick={handleSearchClose}
          >
            Done
          </Button>
        </div>
      )}

      <MessageList
        messages={messages}
        currentUserId={currentUserId}
        typingUserNames={typingUserNames}
        isLoading={isLoading}
        onReact={reactToMessage}
        searchQuery={searchQuery}
        highlightedMessageId={matchingMessages[currentMatchIndex]?.id}
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

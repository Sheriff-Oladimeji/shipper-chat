"use client";

import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "./message-bubble";
import { DateSeparator } from "./date-separator";
import { TypingIndicator } from "./typing-indicator";
import { Loader2 } from "lucide-react";
import { format, isSameDay } from "date-fns";
import type { Message } from "@/types";

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  typingUserNames: string[];
  isLoading?: boolean;
}

export function MessageList({
  messages,
  currentUserId,
  typingUserNames,
  isLoading = false,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUserNames]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">No messages yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Start the conversation by sending a message
          </p>
        </div>
      </div>
    );
  }

  // Group messages by date
  let lastDate: Date | null = null;

  return (
    <ScrollArea className="flex-1 px-4">
      <div className="py-4">
        {messages.map((message, index) => {
          const messageDate = new Date(message.createdAt);
          const showDateSeparator =
            !lastDate || !isSameDay(lastDate, messageDate);
          lastDate = messageDate;

          return (
            <div key={message.id}>
              {showDateSeparator && <DateSeparator date={messageDate} />}
              <MessageBubble
                content={message.content}
                timestamp={message.createdAt}
                isOwn={message.senderId === currentUserId}
                isRead={message.isRead}
                isDelivered={message.isDelivered}
                isAiGenerated={message.isAiGenerated}
                attachments={message.attachments}
              />
            </div>
          );
        })}
        <TypingIndicator names={typingUserNames} />
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}

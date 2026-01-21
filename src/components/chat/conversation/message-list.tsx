"use client";

import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageBubble } from "./message-bubble";
import { DateSeparator } from "./date-separator";
import { TypingIndicator } from "./typing-indicator";
import { isSameDay } from "date-fns";
import type { Message } from "@/types";

interface OptimisticMessage extends Message {
  isPending?: boolean;
}

interface MessageListProps {
  messages: OptimisticMessage[];
  currentUserId: string;
  typingUserNames: string[];
  isLoading?: boolean;
  onReact?: (messageId: string, emoji: string) => void;
  searchQuery?: string;
  highlightedMessageId?: string;
}

export function MessageList({
  messages,
  currentUserId,
  typingUserNames,
  isLoading = false,
  onReact,
  searchQuery,
  highlightedMessageId,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUserNames]);

  if (isLoading) {
    return (
      <div className="flex-1 px-4 py-4 space-y-4">
        {/* Skeleton messages - alternating left and right */}
        <div className="flex justify-start">
          <div className="flex gap-2 max-w-[70%]">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="space-y-2">
              <Skeleton className="h-16 w-48 rounded-2xl rounded-tl-sm" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <div className="space-y-2">
            <Skeleton className="h-12 w-56 rounded-2xl rounded-tr-sm bg-primary/20" />
            <Skeleton className="h-3 w-16 ml-auto" />
          </div>
        </div>
        <div className="flex justify-start">
          <div className="flex gap-2 max-w-[70%]">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="space-y-2">
              <Skeleton className="h-10 w-64 rounded-2xl rounded-tl-sm" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <div className="space-y-2">
            <Skeleton className="h-20 w-52 rounded-2xl rounded-tr-sm bg-primary/20" />
            <Skeleton className="h-3 w-16 ml-auto" />
          </div>
        </div>
        <div className="flex justify-start">
          <div className="flex gap-2 max-w-[70%]">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="space-y-2">
              <Skeleton className="h-12 w-40 rounded-2xl rounded-tl-sm" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <div className="space-y-2">
            <Skeleton className="h-10 w-44 rounded-2xl rounded-tr-sm bg-primary/20" />
            <Skeleton className="h-3 w-16 ml-auto" />
          </div>
        </div>
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

  // Check if we should show date separator by comparing with previous message
  const shouldShowDateSeparator = (index: number): boolean => {
    if (index === 0) return true;
    const currentDate = new Date(messages[index].createdAt);
    const prevDate = new Date(messages[index - 1].createdAt);
    return !isSameDay(currentDate, prevDate);
  };

  return (
    <ScrollArea className="flex-1 px-4">
      <div className="py-4">
        {messages.map((message, index) => {
          const messageDate = new Date(message.createdAt);
          const showDateSeparator = shouldShowDateSeparator(index);

          return (
            <div key={message.id}>
              {showDateSeparator && <DateSeparator date={messageDate} />}
              <MessageBubble
                id={message.id}
                content={message.content}
                timestamp={message.createdAt}
                isOwn={message.senderId === currentUserId}
                isRead={message.isRead}
                isDelivered={message.isDelivered}
                isPending={message.isPending}
                isAiGenerated={message.isAiGenerated}
                attachments={message.attachments}
                senderImage={message.sender?.image}
                reactions={message.reactions?.map(r => ({
                  emoji: r.emoji,
                  userId: r.userId,
                  userName: r.user?.name,
                }))}
                onReact={onReact}
                searchQuery={searchQuery}
                isHighlighted={message.id === highlightedMessageId}
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

"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { ConversationItem } from "./conversation-item";
import type { ConversationWithDetails, User } from "@/types";

interface ConversationListProps {
  conversations: ConversationWithDetails[];
  currentUserId: string;
  activeConversationId: string | null;
  searchQuery: string;
  onSelectConversation: (id: string) => void;
}

export function ConversationList({
  conversations,
  currentUserId,
  activeConversationId,
  searchQuery,
  onSelectConversation,
}: ConversationListProps) {
  const filteredConversations = conversations.filter((conv) => {
    const otherUser = conv.user1Id === currentUserId ? conv.user2 : conv.user1;
    return otherUser.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (filteredConversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <p className="text-muted-foreground">
          {searchQuery ? "No conversations found" : "No conversations yet"}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Start a new message to begin chatting
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="divide-y">
        {filteredConversations.map((conversation) => {
          const otherUser =
            conversation.user1Id === currentUserId
              ? conversation.user2
              : conversation.user1;
          const lastMessage = conversation.lastMessage;
          const isSentByMe = lastMessage?.senderId === currentUserId;

          return (
            <ConversationItem
              key={conversation.id}
              id={conversation.id}
              name={otherUser.name}
              image={otherUser.image}
              lastMessage={lastMessage?.content}
              lastMessageTime={lastMessage?.createdAt}
              unreadCount={conversation.unreadCount}
              isOnline={otherUser.isOnline}
              isActive={conversation.id === activeConversationId}
              isRead={lastMessage?.isRead}
              isSentByMe={isSentByMe}
              onClick={() => onSelectConversation(conversation.id)}
            />
          );
        })}
      </div>
    </ScrollArea>
  );
}

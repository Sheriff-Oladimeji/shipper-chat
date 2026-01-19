"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { ConversationItem } from "./conversation-item";
import type { ConversationWithDetails } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useChatStore } from "@/stores/chat-store";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

interface ConversationListProps {
  conversations: ConversationWithDetails[];
  currentUserId: string;
  activeConversationId: string | null;
  searchQuery: string;
  showArchived?: boolean;
  onSelectConversation: (id: string) => void;
  onContactInfo?: (id: string) => void;
}

async function updateConversationSettings(
  conversationId: string,
  settings: {
    isArchived?: boolean;
    isMarkedUnread?: boolean;
    isMuted?: boolean;
    isPinned?: boolean;
  }
) {
  const response = await fetch(`/api/conversations/${conversationId}/settings`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  if (!response.ok) {
    throw new Error("Failed to update settings");
  }
  return response.json();
}

async function deleteConversation(conversationId: string) {
  const response = await fetch(`/api/conversations/${conversationId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete conversation");
  }
  return response.json();
}

export function ConversationList({
  conversations,
  currentUserId,
  activeConversationId,
  searchQuery,
  showArchived = false,
  onSelectConversation,
  onContactInfo,
}: ConversationListProps) {
  const queryClient = useQueryClient();
  const { onlineUsers, chatFilter } = useChatStore();

  // Dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clearChatDialogOpen, setClearChatDialogOpen] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  const settingsMutation = useMutation({
    mutationFn: ({
      id,
      settings,
    }: {
      id: string;
      settings: {
        isArchived?: boolean;
        isMarkedUnread?: boolean;
        isMuted?: boolean;
        isPinned?: boolean;
      };
    }) => updateConversationSettings(id, settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteConversation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      setDeleteDialogOpen(false);
      setSelectedConversationId(null);
    },
  });

  const handleArchive = useCallback(
    (id: string) => {
      const conversation = conversations.find((c) => c.id === id);
      const isCurrentlyArchived = conversation?.settings?.isArchived || false;
      settingsMutation.mutate({
        id,
        settings: { isArchived: !isCurrentlyArchived },
      });
    },
    [conversations, settingsMutation]
  );

  const handleMarkUnread = useCallback(
    (id: string) => {
      const conversation = conversations.find((c) => c.id === id);
      const isCurrentlyMarkedUnread =
        conversation?.settings?.isMarkedUnread || false;
      settingsMutation.mutate({
        id,
        settings: { isMarkedUnread: !isCurrentlyMarkedUnread },
      });
    },
    [conversations, settingsMutation]
  );

  const handleMute = useCallback(
    (id: string, duration?: string) => {
      // If duration is "unmute", unmute the conversation
      const shouldMute = duration !== "unmute";
      settingsMutation.mutate({
        id,
        settings: { isMuted: shouldMute },
      });
    },
    [settingsMutation]
  );

  const handleClearChat = useCallback(
    (id: string) => {
      setSelectedConversationId(id);
      setClearChatDialogOpen(true);
    },
    []
  );

  const handleConfirmClearChat = useCallback(() => {
    if (selectedConversationId) {
      // TODO: Implement clear chat API
    }
    setClearChatDialogOpen(false);
    setSelectedConversationId(null);
  }, [selectedConversationId]);

  const handleDelete = useCallback(
    (id: string) => {
      setSelectedConversationId(id);
      setDeleteDialogOpen(true);
    },
    []
  );

  const handleConfirmDelete = useCallback(() => {
    if (selectedConversationId) {
      deleteMutation.mutate(selectedConversationId);
    }
    // Dialog closes in onSuccess
  }, [selectedConversationId, deleteMutation]);

  const filteredConversations = conversations.filter((conv) => {
    const otherUser = conv.user1Id === currentUserId ? conv.user2 : conv.user1;
    const matchesSearch = otherUser.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const isArchived = conv.settings?.isArchived || false;
    const isMarkedUnread = conv.settings?.isMarkedUnread || false;
    const hasUnreadMessages = (conv.unreadCount || 0) > 0;
    const isUnread = isMarkedUnread || hasUnreadMessages;

    // If showArchived is true (from nav sidebar), only show archived
    if (showArchived) {
      return matchesSearch && isArchived;
    }

    // Apply chat filter from dropdown
    switch (chatFilter) {
      case "archived":
        return matchesSearch && isArchived;
      case "unread":
        return matchesSearch && isUnread && !isArchived;
      case "read":
        return matchesSearch && !isUnread && !isArchived;
      case "all":
      default:
        return matchesSearch && !isArchived;
    }
  });

  if (filteredConversations.length === 0) {
    const getEmptyMessage = () => {
      if (searchQuery) return "No conversations found";
      if (showArchived || chatFilter === "archived") return "No archived conversations";
      if (chatFilter === "unread") return "No unread conversations";
      if (chatFilter === "read") return "No read conversations";
      return "No conversations yet";
    };

    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <p className="text-muted-foreground">{getEmptyMessage()}</p>
        {!searchQuery && !showArchived && chatFilter === "all" && (
          <p className="text-sm text-muted-foreground mt-1">
            Start a new message to begin chatting
          </p>
        )}
      </div>
    );
  }

  return (
    <>
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
                lastMessageAttachments={lastMessage?.attachments}
                lastMessageTime={lastMessage?.createdAt}
                unreadCount={conversation.unreadCount}
                isOnline={onlineUsers.has(otherUser.id)}
                isActive={conversation.id === activeConversationId}
                isRead={lastMessage?.isRead}
                isSentByMe={isSentByMe}
                isArchived={conversation.settings?.isArchived}
                isMarkedUnread={conversation.settings?.isMarkedUnread}
                isMuted={conversation.settings?.isMuted}
                onClick={() => onSelectConversation(conversation.id)}
                onArchive={handleArchive}
                onMarkUnread={handleMarkUnread}
                onMute={handleMute}
                onDelete={handleDelete}
                onClearChat={handleClearChat}
                onContactInfo={onContactInfo}
              />
            );
          })}
        </div>
      </ScrollArea>

      {/* Delete Conversation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => {
        if (!deleteMutation.isPending) setDeleteDialogOpen(open);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this conversation and all its messages. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear Chat Dialog */}
      <AlertDialog open={clearChatDialogOpen} onOpenChange={setClearChatDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear chat?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete all messages in this conversation. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmClearChat}
              className="bg-red-600 hover:bg-red-700"
            >
              Clear
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

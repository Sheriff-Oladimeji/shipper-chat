"use client";

import { useState } from "react";
import { SidebarHeader } from "./sidebar-header";
import { SearchBar } from "./search-bar";
import { ConversationList } from "./conversation-list";
import { NewMessageDialog } from "./new-message-dialog";
import { useChatStore } from "@/stores/chat-store";
import { useConversations } from "@/hooks/use-conversations";
import { useRouter } from "next/navigation";

interface SidebarProps {
  currentUserId: string;
}

export function Sidebar({ currentUserId }: SidebarProps) {
  const router = useRouter();
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);
  const { searchQuery, setSearchQuery, activeConversationId, setActiveConversationId } =
    useChatStore();
  const { conversations, createConversation, isCreating } = useConversations();

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    router.push(`/c/${id}`);
  };

  const handleSelectUser = async (userId: string) => {
    createConversation(userId, {
      onSuccess: (conversation: any) => {
        setIsNewMessageOpen(false);
        setActiveConversationId(conversation.id);
        router.push(`/c/${conversation.id}`);
      },
    });
  };

  return (
    <aside className="flex h-full w-80 flex-col border-r bg-card">
      <SidebarHeader onNewMessage={() => setIsNewMessageOpen(true)} />
      <SearchBar value={searchQuery} onChange={setSearchQuery} />
      <ConversationList
        conversations={conversations}
        currentUserId={currentUserId}
        activeConversationId={activeConversationId}
        searchQuery={searchQuery}
        onSelectConversation={handleSelectConversation}
      />
      <NewMessageDialog
        open={isNewMessageOpen}
        onOpenChange={setIsNewMessageOpen}
        onSelectUser={handleSelectUser}
        isCreating={isCreating}
      />
    </aside>
  );
}

export { SidebarHeader } from "./sidebar-header";
export { SearchBar } from "./search-bar";
export { ConversationList } from "./conversation-list";
export { ConversationItem } from "./conversation-item";

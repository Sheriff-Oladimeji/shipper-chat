"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { SidebarHeader } from "./sidebar-header";
import { SearchBar } from "./search-bar";
import { ConversationList } from "./conversation-list";
import { NewMessageDropdown } from "./new-message-dropdown";
import { useChatStore } from "@/stores/chat-store";
import { useConversations } from "@/hooks/use-conversations";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  currentUserId: string;
}

export function Sidebar({ currentUserId }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);
  const newMessageButtonRef = useRef<HTMLButtonElement>(null);
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

  const handleSelectShipperAI = () => {
    setIsNewMessageOpen(false);
    router.push("/ai");
  };

  const isAIActive = pathname === "/ai";

  // Check if Shipper AI matches search
  const showShipperAI =
    searchQuery === "" ||
    "shipper ai".includes(searchQuery.toLowerCase());

  return (
    <aside className="relative flex h-full w-80 flex-col border-r bg-card">
      <SidebarHeader
        onNewMessage={() => setIsNewMessageOpen(!isNewMessageOpen)}
        isOpen={isNewMessageOpen}
        buttonRef={newMessageButtonRef}
      />
      <SearchBar value={searchQuery} onChange={setSearchQuery} />

      {/* Shipper AI conversation item */}
      {showShipperAI && (
        <button
          onClick={() => router.push("/ai")}
          className={cn(
            "flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-muted/50 border-b",
            isAIActive && "bg-muted"
          )}
        >
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-600">
            <Sparkles className="h-6 w-6 text-white" />
            <span className="absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full border-2 border-white bg-green-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground">Shipper AI</span>
              <span className="text-xs text-muted-foreground">Online</span>
            </div>
            <p className="text-sm text-muted-foreground truncate">
              Ask me anything...
            </p>
          </div>
        </button>
      )}

      <ConversationList
        conversations={conversations}
        currentUserId={currentUserId}
        activeConversationId={activeConversationId}
        searchQuery={searchQuery}
        onSelectConversation={handleSelectConversation}
      />

      <NewMessageDropdown
        open={isNewMessageOpen}
        onOpenChange={setIsNewMessageOpen}
        onSelectUser={handleSelectUser}
        onSelectShipperAI={handleSelectShipperAI}
        isCreating={isCreating}
        anchorRef={newMessageButtonRef}
      />
    </aside>
  );
}

export { SidebarHeader } from "./sidebar-header";
export { SearchBar } from "./search-bar";
export { ConversationList } from "./conversation-list";
export { ConversationItem } from "./conversation-item";

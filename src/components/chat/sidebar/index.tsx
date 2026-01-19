"use client";

import { useState, useRef, useMemo, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { SidebarHeader } from "./sidebar-header";
import { SearchBar } from "./search-bar";
import { ConversationList } from "./conversation-list";
import { NewMessageDropdown } from "./new-message-dropdown";
import { ContactInfoPanel } from "../contact-info-panel";
import { useChatStore } from "@/stores/chat-store";
import { useConversations } from "@/hooks/use-conversations";
import { Sparkles, Archive, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import type { User } from "@/types";

interface SidebarProps {
  currentUserId: string;
}

export function Sidebar({ currentUserId }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);
  const [contactInfoConversationId, setContactInfoConversationId] = useState<string | null>(null);
  const newMessageButtonRef = useRef<HTMLButtonElement>(null);
  const { searchQuery, setSearchQuery, activeConversationId, setActiveConversationId, showArchived, setShowArchived } =
    useChatStore();
  const { conversations, createConversation, isCreating } = useConversations();

  // Get the user and conversation for contact info panel
  const contactInfoData = useMemo(() => {
    if (!contactInfoConversationId) return null;
    const conversation = conversations.find(c => c.id === contactInfoConversationId);
    if (!conversation) return null;
    const otherUser = conversation.user1Id === currentUserId ? conversation.user2 : conversation.user1;
    return { user: otherUser as User, conversationId: contactInfoConversationId };
  }, [contactInfoConversationId, conversations, currentUserId]);

  const handleContactInfo = useCallback((conversationId: string) => {
    setContactInfoConversationId(conversationId);
  }, []);

  // Count archived conversations
  const archivedCount = useMemo(() => {
    return conversations.filter((c) => c.settings?.isArchived).length;
  }, [conversations]);

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

      {/* Archived header when viewing archived chats */}
      {showArchived ? (
        <button
          onClick={() => setShowArchived(false)}
          className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 border-b"
        >
          <ChevronLeft className="h-5 w-5 text-muted-foreground" />
          <span className="font-medium text-foreground">Archived</span>
        </button>
      ) : (
        <>
          {/* Archived chats link - only show if there are archived conversations */}
          {archivedCount > 0 && !searchQuery && (
            <button
              onClick={() => setShowArchived(true)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 border-b"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                <Archive className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-medium text-foreground">Archived</span>
              </div>
              <span className="text-sm text-muted-foreground">{archivedCount}</span>
            </button>
          )}

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
        </>
      )}

      <ConversationList
        conversations={conversations}
        currentUserId={currentUserId}
        activeConversationId={activeConversationId}
        searchQuery={searchQuery}
        showArchived={showArchived}
        onSelectConversation={handleSelectConversation}
        onContactInfo={handleContactInfo}
      />

      <NewMessageDropdown
        open={isNewMessageOpen}
        onOpenChange={setIsNewMessageOpen}
        onSelectUser={handleSelectUser}
        onSelectShipperAI={handleSelectShipperAI}
        isCreating={isCreating}
        anchorRef={newMessageButtonRef}
      />

      {/* Contact Info Panel */}
      {contactInfoData && (
        <ContactInfoPanel
          open={!!contactInfoConversationId}
          onOpenChange={(open) => !open && setContactInfoConversationId(null)}
          user={contactInfoData.user}
          conversationId={contactInfoData.conversationId}
        />
      )}
    </aside>
  );
}

export { SidebarHeader } from "./sidebar-header";
export { SearchBar } from "./search-bar";
export { ConversationList } from "./conversation-list";
export { ConversationItem } from "./conversation-item";

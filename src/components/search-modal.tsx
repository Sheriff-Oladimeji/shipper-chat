"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { useConversations } from "@/hooks/use-conversations";
import { useRouter } from "next/navigation";

interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchModal({ open, onOpenChange }: SearchModalProps) {
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { conversations } = useConversations();
  const router = useRouter();

  // Focus input when modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setSearch("");
    }
  }, [open]);

  // Handle keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  const filteredConversations = conversations.filter((conv) => {
    const otherUser = conv.user1?.name || conv.user2?.name || "";
    return otherUser.toLowerCase().includes(search.toLowerCase());
  });

  const handleSelectConversation = (id: string) => {
    router.push(`/c/${id}`);
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/4 z-50 w-full max-w-lg -translate-x-1/2 rounded-lg border bg-card shadow-lg">
        {/* Search input */}
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <Search className="h-5 w-5 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="border-0 p-0 focus-visible:ring-0 text-base"
            autoComplete="off"
          />
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-lg p-1 hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {search ? "No conversations found" : "Type to search conversations"}
            </div>
          ) : (
            <div className="py-2">
              {filteredConversations.map((conv) => {
                const otherUser = conv.user1 || conv.user2;
                return (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv.id)}
                    className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-muted transition-colors"
                  >
                    <Avatar
                      src={otherUser?.image}
                      fallback={otherUser?.name || "U"}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{otherUser?.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {conv.lastMessage?.content || "No messages yet"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t px-4 py-2 text-xs text-muted-foreground">
          <span>Press <kbd className="rounded border px-1.5 py-0.5 font-mono">ESC</kbd> to close</span>
          <span><kbd className="rounded border px-1.5 py-0.5 font-mono">⌘K</kbd> to toggle</span>
        </div>
      </div>
    </>
  );
}

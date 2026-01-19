"use client";

import { useState, useEffect, useRef, RefObject } from "react";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Search, Loader2, Sparkles } from "lucide-react";
import { useUsers } from "@/hooks/use-users";

interface NewMessageDropdownProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectUser: (userId: string) => void;
  onSelectShipperAI: () => void;
  isCreating?: boolean;
  anchorRef?: RefObject<HTMLButtonElement | null>;
}

export function NewMessageDropdown({
  open,
  onOpenChange,
  onSelectUser,
  onSelectShipperAI,
  isCreating = false,
  anchorRef,
}: NewMessageDropdownProps) {
  const [search, setSearch] = useState("");
  const { users, isLoading } = useUsers();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
  );

  const showShipperAI =
    search === "" || "shipper ai".toLowerCase().includes(search.toLowerCase());

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        anchorRef?.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open, onOpenChange, anchorRef]);

  // Reset search when closing
  useEffect(() => {
    if (!open) {
      setSearch("");
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute left-0 top-14 z-50 w-64 rounded-lg border bg-background shadow-lg ml-4"
    >
      <div className="p-2.5 border-b">
        <h3 className="font-semibold text-sm mb-2">New Message</h3>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
            autoFocus
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            data-form-type="other"
          />
        </div>
      </div>

      <div className="max-h-[240px] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="py-1">
            {/* Shipper AI option */}
            {showShipperAI && (
              <button
                onClick={onSelectShipperAI}
                className="flex w-full items-center gap-2.5 px-2.5 py-2 text-left transition-colors hover:bg-muted"
              >
                <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/80 to-primary">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">Shipper AI</p>
                  <p className="text-xs text-muted-foreground truncate">
                    AI Assistant
                  </p>
                </div>
              </button>
            )}
            {/* Regular users */}
            {filteredUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => onSelectUser(user.id)}
                disabled={isCreating}
                className="flex w-full items-center gap-2.5 px-2.5 py-2 text-left transition-colors hover:bg-muted disabled:opacity-50"
              >
                <Avatar
                  src={user.image}
                  fallback={user.name}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
                {isCreating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              </button>
            ))}
            {filteredUsers.length === 0 && !showShipperAI && (
              <div className="text-center py-6 text-sm text-muted-foreground">
                No users found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

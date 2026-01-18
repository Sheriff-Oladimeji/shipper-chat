"use client";

import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Check, CheckCheck } from "lucide-react";

interface ConversationItemProps {
  id: string;
  name: string;
  image?: string | null;
  lastMessage?: string;
  lastMessageTime?: Date | string;
  unreadCount?: number;
  isOnline?: boolean;
  isActive?: boolean;
  isRead?: boolean;
  isSentByMe?: boolean;
  onClick: () => void;
}

export function ConversationItem({
  id,
  name,
  image,
  lastMessage,
  lastMessageTime,
  unreadCount = 0,
  isOnline = false,
  isActive = false,
  isRead = false,
  isSentByMe = false,
  onClick,
}: ConversationItemProps) {
  const timeAgo = lastMessageTime
    ? formatDistanceToNow(new Date(lastMessageTime), { addSuffix: false })
    : "";

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-muted/50",
        isActive && "bg-muted"
      )}
    >
      <Avatar
        src={image}
        fallback={name}
        size="lg"
        showOnlineStatus
        isOnline={isOnline}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="font-medium text-foreground truncate">{name}</span>
          {lastMessageTime && (
            <span className="text-xs text-muted-foreground shrink-0">
              {timeAgo}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <div className="flex items-center gap-1 min-w-0">
            {isSentByMe && (
              <span className="shrink-0">
                {isRead ? (
                  <CheckCheck className="h-4 w-4 text-blue-500" />
                ) : (
                  <Check className="h-4 w-4 text-muted-foreground" />
                )}
              </span>
            )}
            <span className="text-sm text-muted-foreground truncate">
              {lastMessage || "No messages yet"}
            </span>
          </div>
          {unreadCount > 0 && (
            <span className="shrink-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-green-500 px-1.5 text-xs font-medium text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

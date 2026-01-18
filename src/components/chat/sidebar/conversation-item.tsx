"use client";

import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import {
  Check,
  CheckCheck,
  Archive,
  Mail,
  MailOpen,
  BellOff,
  Bell,
  Pin,
  PinOff,
  Trash2,
} from "lucide-react";
import { useState, useRef, useCallback } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";

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
  isArchived?: boolean;
  isMarkedUnread?: boolean;
  isMuted?: boolean;
  isPinned?: boolean;
  onClick: () => void;
  onArchive?: (id: string) => void;
  onMarkUnread?: (id: string) => void;
  onMute?: (id: string) => void;
  onPin?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const SWIPE_THRESHOLD = 80;

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
  isArchived = false,
  isMarkedUnread = false,
  isMuted = false,
  isPinned = false,
  onClick,
  onArchive,
  onMarkUnread,
  onMute,
  onPin,
  onDelete,
}: ConversationItemProps) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const timeAgo = lastMessageTime
    ? formatDistanceToNow(new Date(lastMessageTime), { addSuffix: false })
    : "";

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setIsSwiping(false);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const deltaX = e.touches[0].clientX - touchStartX.current;
    const deltaY = e.touches[0].clientY - touchStartY.current;

    // Only swipe if horizontal movement is greater than vertical
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      setIsSwiping(true);
      // Clamp swipe offset between -SWIPE_THRESHOLD and SWIPE_THRESHOLD
      const clampedOffset = Math.max(
        -SWIPE_THRESHOLD,
        Math.min(SWIPE_THRESHOLD, deltaX)
      );
      setSwipeOffset(clampedOffset);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (swipeOffset >= SWIPE_THRESHOLD && onArchive) {
      // Swipe right - archive
      onArchive(id);
    } else if (swipeOffset <= -SWIPE_THRESHOLD && onMarkUnread) {
      // Swipe left - mark unread
      onMarkUnread(id);
    }
    setSwipeOffset(0);
    setIsSwiping(false);
  }, [swipeOffset, id, onArchive, onMarkUnread]);

  const handleClick = useCallback(() => {
    if (!isSwiping) {
      onClick();
    }
  }, [isSwiping, onClick]);

  const contextMenuContent = (
    <ContextMenuContent>
      <ContextMenuItem onClick={() => onMarkUnread?.(id)}>
        {isMarkedUnread || unreadCount > 0 ? (
          <>
            <MailOpen className="h-4 w-4" />
            Mark as read
          </>
        ) : (
          <>
            <Mail className="h-4 w-4" />
            Mark as unread
          </>
        )}
      </ContextMenuItem>
      <ContextMenuItem onClick={() => onPin?.(id)}>
        {isPinned ? (
          <>
            <PinOff className="h-4 w-4" />
            Unpin
          </>
        ) : (
          <>
            <Pin className="h-4 w-4" />
            Pin
          </>
        )}
      </ContextMenuItem>
      <ContextMenuItem onClick={() => onMute?.(id)}>
        {isMuted ? (
          <>
            <Bell className="h-4 w-4" />
            Unmute
          </>
        ) : (
          <>
            <BellOff className="h-4 w-4" />
            Mute
          </>
        )}
      </ContextMenuItem>
      <ContextMenuItem onClick={() => onArchive?.(id)}>
        <Archive className="h-4 w-4" />
        {isArchived ? "Unarchive" : "Archive"}
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem destructive onClick={() => onDelete?.(id)}>
        <Trash2 className="h-4 w-4" />
        Delete
      </ContextMenuItem>
    </ContextMenuContent>
  );

  return (
    <ContextMenu menu={contextMenuContent}>
      <div ref={containerRef} className="relative overflow-hidden">
        {/* Archive action (right swipe) */}
        <div
          className={cn(
            "absolute inset-y-0 left-0 flex items-center justify-center bg-yellow-500 transition-all",
            swipeOffset > 0 ? "opacity-100" : "opacity-0"
          )}
          style={{ width: Math.max(0, swipeOffset) }}
        >
          <Archive className="h-5 w-5 text-white" />
        </div>

        {/* Mark unread action (left swipe) */}
        <div
          className={cn(
            "absolute inset-y-0 right-0 flex items-center justify-center bg-blue-500 transition-all",
            swipeOffset < 0 ? "opacity-100" : "opacity-0"
          )}
          style={{ width: Math.max(0, -swipeOffset) }}
        >
          {isMarkedUnread || unreadCount > 0 ? (
            <MailOpen className="h-5 w-5 text-white" />
          ) : (
            <Mail className="h-5 w-5 text-white" />
          )}
        </div>

        {/* Main content */}
        <button
          onClick={handleClick}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={cn(
            "flex w-full items-center gap-3 p-4 text-left transition-all hover:bg-muted/50 bg-background",
            isActive && "bg-muted",
            isArchived && "opacity-60"
          )}
          style={{
            transform: `translateX(${swipeOffset}px)`,
            transition: isSwiping ? "none" : "transform 0.2s ease-out",
          }}
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
              <div className="flex items-center gap-1.5 min-w-0">
                {isPinned && (
                  <Pin className="h-3 w-3 text-muted-foreground shrink-0" />
                )}
                <span
                  className={cn(
                    "font-medium text-foreground truncate",
                    (isMarkedUnread || unreadCount > 0) && "font-semibold"
                  )}
                >
                  {name}
                </span>
                {isMuted && (
                  <BellOff className="h-3 w-3 text-muted-foreground shrink-0" />
                )}
              </div>
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
                <span
                  className={cn(
                    "text-sm text-muted-foreground truncate",
                    (isMarkedUnread || unreadCount > 0) &&
                      "text-foreground font-medium"
                  )}
                >
                  {lastMessage || "No messages yet"}
                </span>
              </div>
              {(unreadCount > 0 || isMarkedUnread) && (
                <span className="shrink-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-green-500 px-1.5 text-xs font-medium text-white">
                  {unreadCount > 0 ? (unreadCount > 99 ? "99+" : unreadCount) : ""}
                </span>
              )}
            </div>
          </div>
        </button>
      </div>
    </ContextMenu>
  );
}

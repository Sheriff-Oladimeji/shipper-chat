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
  Trash2,
  MessageCircle,
  Volume2,
  UserCircle,
  Upload,
  X,
} from "lucide-react";
import { useState, useCallback } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
} from "@/components/ui/context-menu";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";

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
  onClick: () => void;
  onArchive?: (id: string) => void;
  onMarkUnread?: (id: string) => void;
  onMute?: (id: string, duration?: string) => void;
  onDelete?: (id: string) => void;
  onContactInfo?: (id: string) => void;
  onClearChat?: (id: string) => void;
}

const SWIPE_THRESHOLD = 80;
const ACTION_WIDTH = 80;

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
  onClick,
  onArchive,
  onMarkUnread,
  onMute,
  onDelete,
  onContactInfo,
  onClearChat,
}: ConversationItemProps) {
  const [isDragging, setIsDragging] = useState(false);
  const x = useMotionValue(0);

  // Transform for left action (Unread) - appears when swiping right
  const leftActionOpacity = useTransform(x, [0, ACTION_WIDTH / 2, ACTION_WIDTH], [0, 0.5, 1]);
  const leftActionScale = useTransform(x, [0, ACTION_WIDTH], [0.8, 1]);

  // Transform for right action (Archive) - appears when swiping left
  const rightActionOpacity = useTransform(x, [-ACTION_WIDTH, -ACTION_WIDTH / 2, 0], [1, 0.5, 0]);
  const rightActionScale = useTransform(x, [-ACTION_WIDTH, 0], [1, 0.8]);

  const timeAgo = lastMessageTime
    ? formatDistanceToNow(new Date(lastMessageTime), { addSuffix: false })
    : "";

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    // Determine if swipe should trigger action
    const shouldTriggerRight = offset > SWIPE_THRESHOLD || (offset > 40 && velocity > 500);
    const shouldTriggerLeft = offset < -SWIPE_THRESHOLD || (offset < -40 && velocity < -500);

    if (shouldTriggerRight && onMarkUnread) {
      // Swipe right = Mark unread
      onMarkUnread(id);
    } else if (shouldTriggerLeft && onArchive) {
      // Swipe left = Archive
      onArchive(id);
    }

    // Always snap back to center using x.set for immediate response
    x.set(0);

    // Small delay before re-enabling clicks
    setTimeout(() => setIsDragging(false), 50);
  };

  const handleClick = useCallback(() => {
    if (!isDragging) {
      onClick();
    }
  }, [isDragging, onClick]);

  const contextMenuContent = (
    <ContextMenuContent>
      <ContextMenuItem onClick={() => onMarkUnread?.(id)}>
        <MessageCircle className="h-4 w-4" />
        {isMarkedUnread || unreadCount > 0 ? "Mark as read" : "Mark as unread"}
      </ContextMenuItem>
      <ContextMenuItem onClick={() => onArchive?.(id)}>
        <Archive className="h-4 w-4" />
        {isArchived ? "Unarchive" : "Archive"}
      </ContextMenuItem>
      <ContextMenuSub>
        <ContextMenuSubTrigger>
          <Volume2 className="h-4 w-4" />
          {isMuted ? "Unmute" : "Mute"}
        </ContextMenuSubTrigger>
        <ContextMenuSubContent>
          {isMuted ? (
            <ContextMenuItem onClick={() => onMute?.(id, "unmute")}>
              Unmute notifications
            </ContextMenuItem>
          ) : (
            <>
              <ContextMenuItem onClick={() => onMute?.(id, "8hours")}>
                8 hours
              </ContextMenuItem>
              <ContextMenuItem onClick={() => onMute?.(id, "1week")}>
                1 week
              </ContextMenuItem>
              <ContextMenuItem onClick={() => onMute?.(id, "always")}>
                Always
              </ContextMenuItem>
            </>
          )}
        </ContextMenuSubContent>
      </ContextMenuSub>
      <ContextMenuSeparator />
      <ContextMenuItem onClick={() => onContactInfo?.(id)}>
        <UserCircle className="h-4 w-4" />
        Contact info
      </ContextMenuItem>
      <ContextMenuItem>
        <Upload className="h-4 w-4" />
        Export chat
      </ContextMenuItem>
      <ContextMenuItem onClick={() => onClearChat?.(id)}>
        <X className="h-4 w-4" />
        Clear chat
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem destructive onClick={() => onDelete?.(id)}>
        <Trash2 className="h-4 w-4" />
        Delete chat
      </ContextMenuItem>
    </ContextMenuContent>
  );

  return (
    <ContextMenu menu={contextMenuContent}>
      <div className="relative overflow-hidden">
        {/* Left action - Unread (swipe right) */}
        <motion.div
          className="absolute inset-y-0 left-0 flex items-center justify-center bg-green-500"
          style={{
            width: ACTION_WIDTH,
            opacity: leftActionOpacity,
          }}
        >
          <motion.div
            className="flex flex-col items-center gap-1"
            style={{ scale: leftActionScale }}
          >
            {isMarkedUnread || unreadCount > 0 ? (
              <>
                <MailOpen className="h-5 w-5 text-white" />
                <span className="text-xs font-medium text-white">Read</span>
              </>
            ) : (
              <>
                <Mail className="h-5 w-5 text-white" />
                <span className="text-xs font-medium text-white">Unread</span>
              </>
            )}
          </motion.div>
        </motion.div>

        {/* Right action - Archive (swipe left) */}
        <motion.div
          className="absolute inset-y-0 right-0 flex items-center justify-center bg-green-500"
          style={{
            width: ACTION_WIDTH,
            opacity: rightActionOpacity,
          }}
        >
          <motion.div
            className="flex flex-col items-center gap-1"
            style={{ scale: rightActionScale }}
          >
            <Archive className="h-5 w-5 text-white" />
            <span className="text-xs font-medium text-white">Archive</span>
          </motion.div>
        </motion.div>

        {/* Main content - draggable */}
        <motion.button
          drag="x"
          dragConstraints={{ left: -ACTION_WIDTH, right: ACTION_WIDTH }}
          dragElastic={0.1}
          dragMomentum={false}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          style={{ x }}
          onClick={handleClick}
          className={cn(
            "flex w-full items-center gap-3 p-4 text-left hover:bg-muted/50 bg-background cursor-grab active:cursor-grabbing",
            isActive && "bg-muted",
            isArchived && "opacity-60"
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
              <div className="flex items-center gap-1.5 min-w-0">
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
        </motion.button>
      </div>
    </ContextMenu>
  );
}

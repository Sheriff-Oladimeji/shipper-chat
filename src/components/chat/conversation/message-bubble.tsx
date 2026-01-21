"use client";

import React, { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Check, CheckCheck, Sparkles, Download, Play, Pause, Volume2, Clock } from "lucide-react";
import type { Attachment } from "@/types";
import {
  ContextMenu,
  ContextMenuContent,
} from "@/components/ui/context-menu";
import { Avatar } from "@/components/ui/avatar";

interface Reaction {
  emoji: string;
  userId: string;
  userName?: string;
}

interface MessageBubbleProps {
  id?: string;
  content: string;
  timestamp: Date | string;
  isOwn: boolean;
  isRead?: boolean;
  isDelivered?: boolean;
  isPending?: boolean;
  isAiGenerated?: boolean;
  senderName?: string;
  senderImage?: string | null;
  attachments?: Attachment[];
  reactions?: Reaction[];
  onReact?: (messageId: string, emoji: string) => void;
  searchQuery?: string;
  isHighlighted?: boolean;
}

// Quick reaction emojis
const quickReactions = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function getFileExtension(name: string): string {
  return name.split(".").pop()?.toUpperCase() || "FILE";
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// URL regex to detect links in messages
const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`\[\]]+|www\.[^\s<>"{}|\\^`\[\]]+)/gi;

// Parse message content and convert URLs to clickable links
function parseMessageContent(content: string, isOwn: boolean): React.ReactNode {
  const matches = content.match(urlRegex);

  if (!matches || matches.length === 0) {
    return content;
  }

  const parts = content.split(urlRegex);
  const result: React.ReactNode[] = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part) {
      // Check if this part is a URL
      if (matches.includes(part)) {
        const href = part.startsWith("http") ? part : `https://${part}`;
        result.push(
          <a
            key={`link-${i}`}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "underline hover:no-underline",
              isOwn ? "text-white" : "text-blue-500"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      } else {
        result.push(<span key={`text-${i}`}>{part}</span>);
      }
    }
  }

  return result;
}

// Voice note player component
function VoiceNotePlayer({
  attachment,
  isOwn,
  senderImage
}: {
  attachment: Attachment;
  isOwn: boolean;
  senderImage?: string | null;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-2 min-w-[200px]">
      <audio
        ref={audioRef}
        src={attachment.url}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      {/* Avatar */}
      <div className="relative shrink-0">
        <Avatar
          src={senderImage}
          fallback="U"
          size="md"
        />
        {/* Mic icon overlay */}
        <div className={cn(
          "absolute -bottom-1 -right-1 rounded-full p-0.5",
          isOwn ? "bg-primary" : "bg-gray-500"
        )}>
          <Volume2 className="h-2.5 w-2.5 text-white" />
        </div>
      </div>

      {/* Play button */}
      <button
        onClick={togglePlay}
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isOwn ? "bg-white/20 hover:bg-white/30" : "bg-primary hover:bg-primary"
        )}
      >
        {isPlaying ? (
          <Pause className={cn("h-4 w-4", isOwn ? "text-white" : "text-white")} />
        ) : (
          <Play className={cn("h-4 w-4 ml-0.5", isOwn ? "text-white" : "text-white")} />
        )}
      </button>

      {/* Waveform / Progress */}
      <div className="flex-1 flex flex-col gap-1">
        <div className="relative h-6 flex items-center">
          {/* Waveform bars */}
          <div className="flex items-center gap-0.5 w-full">
            {[...Array(25)].map((_, i) => {
              const barProgress = (i / 25) * 100;
              const isActive = barProgress <= progress;
              return (
                <div
                  key={i}
                  className={cn(
                    "w-1 rounded-full transition-colors",
                    isActive
                      ? isOwn ? "bg-white" : "bg-primary"
                      : isOwn ? "bg-white/40" : "bg-gray-300"
                  )}
                  style={{
                    height: `${Math.sin(i * 0.5) * 8 + 10}px`,
                  }}
                />
              );
            })}
          </div>
        </div>
        {/* Duration */}
        <span className={cn(
          "text-xs",
          isOwn ? "text-white/70" : "text-muted-foreground"
        )}>
          {formatDuration(isPlaying ? currentTime : duration || 0)}
        </span>
      </div>
    </div>
  );
}

function AttachmentPreview({
  attachment,
  isOwn,
  senderImage
}: {
  attachment: Attachment;
  isOwn: boolean;
  senderImage?: string | null;
}) {
  const isImage = attachment.type === "image";
  const isVideo = attachment.type === "video";
  const isAudio = attachment.type === "audio";

  if (isImage) {
    return (
      <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="block">
        <img
          src={attachment.url}
          alt={attachment.name}
          className="rounded-lg max-w-full max-h-64 object-cover"
        />
      </a>
    );
  }

  if (isVideo) {
    return (
      <video
        src={attachment.url}
        controls
        className="rounded-lg max-w-full max-h-64"
      />
    );
  }

  if (isAudio) {
    return (
      <VoiceNotePlayer
        attachment={attachment}
        isOwn={isOwn}
        senderImage={senderImage}
      />
    );
  }

  // Document or other file type - WhatsApp style
  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex items-center gap-3 p-2 rounded-lg transition-colors min-w-[200px]",
        isOwn ? "bg-white/10 hover:bg-white/20" : "bg-black/5 hover:bg-black/10"
      )}
    >
      <div className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded text-white text-xs font-bold",
        attachment.mimeType.includes("pdf") ? "bg-red-500" :
        attachment.mimeType.includes("word") || attachment.mimeType.includes("document") ? "bg-blue-500" :
        attachment.mimeType.includes("excel") || attachment.mimeType.includes("spreadsheet") ? "bg-primary" :
        attachment.mimeType.includes("video") ? "bg-purple-500" :
        "bg-gray-500"
      )}>
        {getFileExtension(attachment.name)}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm font-medium truncate",
          isOwn ? "text-white" : "text-foreground"
        )}>{attachment.name}</p>
        <p className={cn(
          "text-xs",
          isOwn ? "text-white/60" : "text-muted-foreground"
        )}>
          {formatFileSize(attachment.size)} • {getFileExtension(attachment.name).toLowerCase()}
        </p>
      </div>
      <Download className={cn(
        "h-5 w-5 shrink-0",
        isOwn ? "text-white/60" : "text-muted-foreground"
      )} />
    </a>
  );
}

export function MessageBubble({
  id,
  content,
  timestamp,
  isOwn,
  isRead = false,
  isDelivered = false,
  isPending = false,
  isAiGenerated = false,
  senderName,
  senderImage,
  attachments = [],
  reactions = [],
  onReact,
  searchQuery,
  isHighlighted = false,
}: MessageBubbleProps) {
  const time = format(new Date(timestamp), "h:mm a");
  const messageRef = useRef<HTMLDivElement>(null);

  // Scroll to highlighted message
  React.useEffect(() => {
    if (isHighlighted && messageRef.current) {
      messageRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [isHighlighted]);

  // Highlight search matches in content
  const renderHighlightedContent = (text: string) => {
    if (!searchQuery || !text) return parseMessageContent(text, isOwn);

    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-300 text-black px-0.5 rounded">{part}</mark>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };
  const hasAttachments = attachments && attachments.length > 0;
  const hasContent = content && content.trim().length > 0;
  const hasReactions = reactions && reactions.length > 0;

  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {} as Record<string, Reaction[]>);

  const handleReact = (emoji: string) => {
    if (onReact && id) {
      onReact(id, emoji);
    }
  };

  const contextMenuContent = (
    <ContextMenuContent>
      <div className="flex gap-1 p-2">
        {quickReactions.map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleReact(emoji)}
            className="text-xl hover:scale-125 transition-transform p-1 rounded hover:bg-muted"
          >
            {emoji}
          </button>
        ))}
      </div>
    </ContextMenuContent>
  );

  return (
    <div
      ref={messageRef}
      className={cn(
        "flex w-full mb-2 transition-colors",
        isOwn ? "justify-end" : "justify-start",
        isHighlighted && "bg-yellow-100/50 -mx-2 px-2 py-1 rounded-lg"
      )}
    >
      <div className={cn(
        "relative max-w-[75%]",
        hasReactions && "mb-3" // Extra space for reactions
      )}>
        <ContextMenu menu={contextMenuContent}>
          <div
            className={cn(
              "rounded-2xl",
              hasAttachments && !hasContent ? "p-1.5" : "px-3 py-2",
              isOwn
                ? "bg-primary text-white rounded-br-sm"
                : "bg-muted text-foreground rounded-bl-sm",
              isAiGenerated && "border-2 border-purple-400"
            )}
            onDoubleClick={() => handleReact("❤️")}
          >
            {isAiGenerated && (
              <div className="flex items-center gap-1 text-xs opacity-80 mb-1 px-2 pt-1">
                <Sparkles className="h-3 w-3" />
                <span>AI Generated</span>
              </div>
            )}

            {/* Attachments */}
            {hasAttachments && (
              <div className={cn(
                "space-y-2",
                hasContent && "mb-2"
              )}>
                {attachments.map((attachment) => (
                  <AttachmentPreview
                    key={attachment.id}
                    attachment={attachment}
                    isOwn={isOwn}
                    senderImage={senderImage}
                  />
                ))}
              </div>
            )}

            {/* Message content */}
            {hasContent && (
              <p className={cn(
                "text-sm whitespace-pre-wrap break-words",
                hasAttachments && "px-2"
              )}>{searchQuery ? renderHighlightedContent(content) : parseMessageContent(content, isOwn)}</p>
            )}

            {/* Timestamp and read status */}
            <div
              className={cn(
                "flex items-center justify-end gap-1 mt-1",
                isOwn ? "text-white/70" : "text-muted-foreground",
                hasAttachments && !hasContent && "px-2 pb-1"
              )}
            >
              <span className="text-[10px]">{time}</span>
              {isOwn && (
                <span className="ml-0.5">
                  {isPending ? (
                    <Clock className="h-3.5 w-3.5" />
                  ) : isRead ? (
                    <CheckCheck className="h-3.5 w-3.5 text-[#53bdeb]" />
                  ) : isDelivered ? (
                    <CheckCheck className="h-3.5 w-3.5" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                </span>
              )}
            </div>
          </div>
        </ContextMenu>

        {/* Reactions display - positioned below and slightly overlapping */}
        {hasReactions && (
          <div
            className={cn(
              "absolute -bottom-4 flex flex-wrap gap-0.5",
              isOwn ? "right-2" : "left-2"
            )}
          >
            {Object.entries(groupedReactions).map(([emoji, reactionList]) => (
              <button
                key={emoji}
                onClick={() => handleReact(emoji)}
                className={cn(
                  "flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs",
                  "bg-background shadow-sm border",
                  "hover:bg-muted transition-colors"
                )}
                title={reactionList.map((r) => r.userName || "Someone").join(", ")}
              >
                <span className="text-sm">{emoji}</span>
                {reactionList.length > 1 && (
                  <span className="text-xs text-muted-foreground">{reactionList.length}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Check, CheckCheck, Sparkles, FileText, Download, Play } from "lucide-react";
import type { Attachment } from "@/types";

interface MessageBubbleProps {
  content: string;
  timestamp: Date | string;
  isOwn: boolean;
  isRead?: boolean;
  isDelivered?: boolean;
  isAiGenerated?: boolean;
  senderName?: string;
  senderImage?: string | null;
  attachments?: Attachment[];
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function getFileExtension(name: string): string {
  return name.split(".").pop()?.toUpperCase() || "FILE";
}

function AttachmentPreview({ attachment, isOwn }: { attachment: Attachment; isOwn: boolean }) {
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
      <div className="flex items-center gap-3 p-2 rounded-lg bg-black/10">
        <div className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full",
          isOwn ? "bg-white/20" : "bg-primary/10"
        )}>
          <Play className="h-5 w-5" />
        </div>
        <audio src={attachment.url} controls className="flex-1 h-8" />
      </div>
    );
  }

  // Document or other file type
  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg transition-colors",
        isOwn ? "bg-white/10 hover:bg-white/20" : "bg-black/5 hover:bg-black/10"
      )}
    >
      <div className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white text-xs font-bold",
        attachment.mimeType.includes("pdf") ? "bg-red-500" :
        attachment.mimeType.includes("word") || attachment.mimeType.includes("document") ? "bg-blue-500" :
        attachment.mimeType.includes("excel") || attachment.mimeType.includes("spreadsheet") ? "bg-green-600" :
        "bg-gray-500"
      )}>
        {getFileExtension(attachment.name)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{attachment.name}</p>
        <p className={cn(
          "text-xs",
          isOwn ? "text-white/60" : "text-muted-foreground"
        )}>
          {formatFileSize(attachment.size)}
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
  content,
  timestamp,
  isOwn,
  isRead = false,
  isDelivered = false,
  isAiGenerated = false,
  senderName,
  attachments = [],
}: MessageBubbleProps) {
  const time = format(new Date(timestamp), "h:mm a");
  const hasAttachments = attachments && attachments.length > 0;
  const hasContent = content && content.trim().length > 0;

  return (
    <div
      className={cn(
        "flex w-full mb-4",
        isOwn ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[70%] rounded-2xl",
          hasAttachments && !hasContent ? "p-1" : "px-4 py-2",
          isOwn
            ? "bg-green-500 text-white rounded-br-md"
            : "bg-muted text-foreground rounded-bl-md",
          isAiGenerated && "border-2 border-purple-400"
        )}
      >
        {isAiGenerated && (
          <div className="flex items-center gap-1 text-xs opacity-80 mb-1 px-3 pt-1">
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
              />
            ))}
          </div>
        )}

        {/* Message content */}
        {hasContent && (
          <p className={cn(
            "text-sm whitespace-pre-wrap break-words",
            hasAttachments && "px-3"
          )}>{content}</p>
        )}

        {/* Timestamp and read status */}
        <div
          className={cn(
            "flex items-center justify-end gap-1 mt-1",
            isOwn ? "text-white/70" : "text-muted-foreground",
            hasAttachments && !hasContent && "px-3 pb-1"
          )}
        >
          <span className="text-xs">{time}</span>
          {isOwn && (
            <span className="ml-1">
              {isRead ? (
                <CheckCheck className="h-4 w-4 text-blue-300" />
              ) : isDelivered ? (
                <CheckCheck className="h-4 w-4" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

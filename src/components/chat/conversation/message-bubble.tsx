"use client";

import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Check, CheckCheck, Sparkles } from "lucide-react";

interface MessageBubbleProps {
  content: string;
  timestamp: Date | string;
  isOwn: boolean;
  isRead?: boolean;
  isDelivered?: boolean;
  isAiGenerated?: boolean;
  senderName?: string;
  senderImage?: string | null;
}

export function MessageBubble({
  content,
  timestamp,
  isOwn,
  isRead = false,
  isDelivered = false,
  isAiGenerated = false,
  senderName,
}: MessageBubbleProps) {
  const time = format(new Date(timestamp), "h:mm a");

  return (
    <div
      className={cn(
        "flex w-full mb-4",
        isOwn ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[70%] rounded-2xl px-4 py-2",
          isOwn
            ? "bg-green-500 text-white rounded-br-md"
            : "bg-muted text-foreground rounded-bl-md",
          isAiGenerated && "border-2 border-purple-400"
        )}
      >
        {isAiGenerated && (
          <div className="flex items-center gap-1 text-xs opacity-80 mb-1">
            <Sparkles className="h-3 w-3" />
            <span>AI Generated</span>
          </div>
        )}
        <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
        <div
          className={cn(
            "flex items-center justify-end gap-1 mt-1",
            isOwn ? "text-white/70" : "text-muted-foreground"
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

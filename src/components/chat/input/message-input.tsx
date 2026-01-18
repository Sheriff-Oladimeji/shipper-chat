"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Smile, Paperclip, Mic, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageInputProps {
  onSend: (message: string) => void;
  onTyping?: (isTyping: boolean) => void;
  isSending?: boolean;
  disabled?: boolean;
}

export function MessageInput({
  onSend,
  onTyping,
  isSending = false,
  disabled = false,
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTyping = useCallback(() => {
    if (onTyping) {
      onTyping(true);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
      }, 2000);
    }
  }, [onTyping]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!message.trim() || isSending || disabled) return;

    onSend(message.trim());
    setMessage("");
    if (onTyping) {
      onTyping(false);
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [message]);

  // Cleanup timeout on unmount and send stop typing
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      // Send stop typing when leaving the conversation
      if (onTyping) {
        onTyping(false);
      }
    };
  }, [onTyping]);

  return (
    <form onSubmit={handleSubmit} className="border-t bg-card p-4">
      <div className="flex items-end gap-2">
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="icon" className="shrink-0">
            <Paperclip className="h-5 w-5 text-muted-foreground" />
          </Button>
        </div>
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              handleTyping();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={disabled || isSending}
            rows={1}
            className={cn(
              "w-full resize-none rounded-2xl border bg-muted/50 px-4 py-3 pr-24 text-sm",
              "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
          />
          <div className="absolute bottom-2 right-2 flex items-center gap-1">
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
              <Smile className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
              <Mic className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
        <Button
          type="submit"
          variant="success"
          size="icon"
          disabled={!message.trim() || isSending || disabled}
          className="shrink-0 h-11 w-11 rounded-full"
        >
          {isSending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>
    </form>
  );
}

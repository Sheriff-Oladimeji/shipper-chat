"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Smile, Paperclip, Mic, Send, Loader2, X, FileText, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUploadThing } from "@/lib/uploadthing-client";

interface UploadedFile {
  url: string;
  name: string;
  size: number;
  mimeType: string;
}

interface MessageInputProps {
  onSend: (message: string, attachments?: UploadedFile[]) => void;
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
  const [pendingFiles, setPendingFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { startUpload } = useUploadThing("messageAttachment", {
    onClientUploadComplete: (res) => {
      if (res) {
        const newFiles = res.map((file) => ({
          url: file.ufsUrl,
          name: file.name,
          size: file.size,
          mimeType: file.type,
        }));
        setPendingFiles((prev) => [...prev, ...newFiles]);
      }
      setIsUploading(false);
    },
    onUploadError: (error) => {
      console.error("Upload error:", error);
      setIsUploading(false);
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    await startUpload(Array.from(files));

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

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
    if ((!message.trim() && pendingFiles.length === 0) || isSending || disabled || isUploading) return;

    onSend(message.trim(), pendingFiles.length > 0 ? pendingFiles : undefined);
    setMessage("");
    setPendingFiles([]);
    if (onTyping) {
      onTyping(false);
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const isImage = (mimeType: string) => mimeType.startsWith("image/");

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
    <form onSubmit={handleSubmit} className="border-t bg-card">
      {/* File previews */}
      {pendingFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 pt-3">
          {pendingFiles.map((file, index) => (
            <div
              key={index}
              className="relative flex items-center gap-2 rounded-lg border bg-muted/50 p-2 pr-8"
            >
              {isImage(file.mimeType) ? (
                <div className="h-10 w-10 rounded overflow-hidden bg-muted">
                  <img
                    src={file.url}
                    alt={file.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-medium truncate max-w-[120px]">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="absolute right-1 top-1 rounded-full p-1 hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload progress */}
      {isUploading && (
        <div className="flex items-center gap-2 px-4 pt-3">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Uploading...</span>
        </div>
      )}

      <div className="flex items-end gap-2 p-4">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || disabled}
          >
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
          disabled={(!message.trim() && pendingFiles.length === 0) || isSending || disabled || isUploading}
          className="shrink-0 h-11 w-11 rounded-full"
        >
          {isSending || isUploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>
    </form>
  );
}

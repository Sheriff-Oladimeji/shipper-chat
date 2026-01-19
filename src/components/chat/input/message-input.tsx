"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Smile, Paperclip, Mic, Send, Loader2, X, FileText, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUploadThing } from "@/lib/uploadthing-client";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { startUpload } = useUploadThing("messageAttachment", {
    onClientUploadComplete: (res) => {
      if (res && res.length > 0) {
        const newFiles = res.map((file) => {
          const fileUrl = file.ufsUrl || file.url;
          return {
            url: fileUrl,
            name: file.name,
            size: file.size,
            mimeType: file.type || "application/octet-stream",
          };
        });
        setPendingFiles((prev) => [...prev, ...newFiles]);
      }
      setIsUploading(false);
    },
    onUploadError: (error) => {
      console.error("Upload error:", error);
      setIsUploading(false);
    },
  });

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showEmojiPicker]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    await startUpload(Array.from(files));

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

  const handleEmojiSelect = (emoji: { native: string }) => {
    setMessage((prev) => prev + emoji.native);
    textareaRef.current?.focus();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const file = new File([audioBlob], `voice-note-${Date.now()}.webm`, { type: "audio/webm" });

        // Upload the voice note
        setIsUploading(true);
        await startUpload([file]);

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      audioChunksRef.current = [];
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      // Stop all tracks without uploading
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
  };

  const formatRecordingTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
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

      {/* Recording indicator */}
      {isRecording && (
        <div className="flex items-center gap-3 px-4 pt-3">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm text-muted-foreground">Recording {formatRecordingTime(recordingTime)}</span>
          </div>
          <button
            type="button"
            onClick={cancelRecording}
            className="text-sm text-red-500 hover:text-red-600"
          >
            Cancel
          </button>
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

        {/* Attachment button - left side */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 h-10 w-10"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || disabled || isRecording}
        >
          <Paperclip className="h-5 w-5 text-muted-foreground" />
        </Button>

        {/* Input area with inline icons */}
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
            disabled={disabled || isSending || isRecording}
            rows={1}
            className={cn(
              "w-full resize-none rounded-full border bg-muted/50 px-4 py-3 pr-28 text-sm",
              "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
          />

          {/* Icons inside input - right side */}
          <div className="absolute bottom-1.5 right-2 flex items-center gap-0.5">
            {/* Emoji picker */}
            <div className="relative" ref={emojiPickerRef}>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                disabled={disabled || isRecording}
              >
                <Smile className="h-5 w-5 text-muted-foreground" />
              </Button>
              {showEmojiPicker && (
                <div className="absolute bottom-full right-0 mb-2 z-50">
                  <Picker
                    data={data}
                    onEmojiSelect={handleEmojiSelect}
                    theme="light"
                    previewPosition="none"
                    skinTonePosition="none"
                  />
                </div>
              )}
            </div>

            {/* Voice note button */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8", isRecording && "text-red-500")}
              onClick={isRecording ? stopRecording : startRecording}
              disabled={disabled || isUploading}
            >
              {isRecording ? (
                <Square className="h-4 w-4 fill-current" />
              ) : (
                <Mic className="h-5 w-5 text-muted-foreground" />
              )}
            </Button>
          </div>
        </div>

        {/* Send button */}
        <Button
          type="submit"
          size="icon"
          disabled={(!message.trim() && pendingFiles.length === 0) || isSending || disabled || isUploading || isRecording}
          className="shrink-0 h-10 w-10 rounded-full bg-green-500 hover:bg-green-600 text-white"
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

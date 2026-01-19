"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Smile, Paperclip, Mic, Send, Loader2, X, Trash2, Image, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUploadThing } from "@/lib/uploadthing-client";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

interface PendingFile {
  id: string;
  file: File;
  url?: string; // Local preview URL or uploaded URL
  name: string;
  size: number;
  mimeType: string;
  status: "uploading" | "uploaded" | "error";
  progress?: number;
}

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
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaFileInputRef = useRef<HTMLInputElement>(null);
  const documentFileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const attachmentMenuRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { startUpload } = useUploadThing("messageAttachment", {
    onClientUploadComplete: (res) => {
      if (res && res.length > 0) {
        // Update pending files with uploaded URLs
        setPendingFiles((prev) => {
          const updated = [...prev];
          res.forEach((uploadedFile) => {
            const fileUrl = uploadedFile.ufsUrl || uploadedFile.url;
            const index = updated.findIndex(
              (f) => f.name === uploadedFile.name && f.status === "uploading"
            );
            if (index !== -1) {
              updated[index] = {
                ...updated[index],
                url: fileUrl,
                status: "uploaded",
              };
            }
          });
          return updated;
        });
      }
    },
    onUploadError: (error) => {
      console.error("Upload error:", error);
      // Mark files as error
      setPendingFiles((prev) =>
        prev.map((f) =>
          f.status === "uploading" ? { ...f, status: "error" as const } : f
        )
      );
    },
  });

  // Close emoji picker and attachment menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
      if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(e.target as Node)) {
        setShowAttachmentMenu(false);
      }
    };
    if (showEmojiPicker || showAttachmentMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showEmojiPicker, showAttachmentMenu]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Create pending file entries with local preview URLs
    const newPendingFiles: PendingFile[] = Array.from(files).map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      url: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
      name: file.name,
      size: file.size,
      mimeType: file.type || "application/octet-stream",
      status: "uploading" as const,
    }));

    setPendingFiles((prev) => [...prev, ...newPendingFiles]);

    // Start upload in background
    startUpload(Array.from(files));

    // Reset the file inputs
    if (mediaFileInputRef.current) {
      mediaFileInputRef.current.value = "";
    }
    if (documentFileInputRef.current) {
      documentFileInputRef.current.value = "";
    }

    // Close the attachment menu
    setShowAttachmentMenu(false);
  };

  const removeFile = (id: string) => {
    setPendingFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      // Revoke object URL if it was a local preview
      if (file?.url?.startsWith("blob:")) {
        URL.revokeObjectURL(file.url);
      }
      return prev.filter((f) => f.id !== id);
    });
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

    const uploadedFiles = pendingFiles.filter((f) => f.status === "uploaded");
    const stillUploading = pendingFiles.some((f) => f.status === "uploading");

    if ((!message.trim() && uploadedFiles.length === 0) || isSending || disabled || stillUploading) return;

    const attachments = uploadedFiles.map((f) => ({
      url: f.url!,
      name: f.name,
      size: f.size,
      mimeType: f.mimeType,
    }));

    onSend(message.trim(), attachments.length > 0 ? attachments : undefined);
    setMessage("");

    // Clean up object URLs
    pendingFiles.forEach((f) => {
      if (f.url?.startsWith("blob:")) {
        URL.revokeObjectURL(f.url);
      }
    });
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

        // Add to pending files with uploading state
        const pendingFile: PendingFile = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file,
          name: file.name,
          size: file.size,
          mimeType: "audio/webm",
          status: "uploading",
        };
        setPendingFiles((prev) => [...prev, pendingFile]);

        // Upload the voice note
        startUpload([file]);

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
  const isAudio = (mimeType: string) => mimeType.startsWith("audio/");

  const getFileExtension = (name: string) => {
    return name.split(".").pop()?.toUpperCase() || "FILE";
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
      // Clean up object URLs
      pendingFiles.forEach((f) => {
        if (f.url?.startsWith("blob:")) {
          URL.revokeObjectURL(f.url);
        }
      });
    };
  }, [onTyping, pendingFiles]);

  const stillUploading = pendingFiles.some((f) => f.status === "uploading");
  const canSend = (message.trim() || pendingFiles.some((f) => f.status === "uploaded")) && !stillUploading;

  return (
    <form onSubmit={handleSubmit} className="border-t bg-card">
      {/* File previews */}
      {pendingFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 pt-3">
          {pendingFiles.map((file) => (
            <div
              key={file.id}
              className={cn(
                "relative flex items-center gap-2 rounded-lg border p-2 pr-8",
                file.status === "uploading" && "bg-muted/30 border-dashed",
                file.status === "uploaded" && "bg-muted/50",
                file.status === "error" && "bg-red-50 border-red-200"
              )}
            >
              {isImage(file.mimeType) ? (
                <div className="relative h-12 w-12 rounded overflow-hidden bg-muted">
                  {file.url && (
                    <img
                      src={file.url}
                      alt={file.name}
                      className={cn(
                        "h-full w-full object-cover",
                        file.status === "uploading" && "opacity-50"
                      )}
                    />
                  )}
                  {file.status === "uploading" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                    </div>
                  )}
                </div>
              ) : isAudio(file.mimeType) ? (
                <div className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-full",
                  file.status === "uploading" ? "bg-green-400" : "bg-green-500"
                )}>
                  {file.status === "uploading" ? (
                    <Loader2 className="h-5 w-5 animate-spin text-white" />
                  ) : (
                    <Mic className="h-5 w-5 text-white" />
                  )}
                </div>
              ) : (
                <div className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-lg text-white text-xs font-bold",
                  file.mimeType.includes("pdf") ? "bg-red-500" :
                  file.mimeType.includes("word") || file.mimeType.includes("document") ? "bg-blue-500" :
                  file.mimeType.includes("excel") || file.mimeType.includes("spreadsheet") ? "bg-green-600" :
                  "bg-gray-500",
                  file.status === "uploading" && "opacity-70"
                )}>
                  {file.status === "uploading" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    getFileExtension(file.name)
                  )}
                </div>
              )}
              <div className="min-w-0 max-w-32">
                <p className="text-xs font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {file.status === "uploading" ? "Uploading..." :
                   file.status === "error" ? "Failed" :
                   formatFileSize(file.size)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeFile(file.id)}
                className="absolute right-1 top-1 rounded-full p-1 hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Recording indicator */}
      {isRecording && (
        <div className="flex items-center justify-between gap-3 px-4 pt-3">
          <button
            type="button"
            onClick={cancelRecording}
            className="p-2 rounded-full hover:bg-muted"
          >
            <Trash2 className="h-5 w-5 text-red-500" />
          </button>
          <div className="flex-1 flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-medium">{formatRecordingTime(recordingTime)}</span>
            <div className="flex-1 flex items-center gap-0.5">
              {/* Waveform visualization */}
              {[...Array(30)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-gray-400 rounded-full animate-pulse"
                  style={{
                    height: `${Math.random() * 16 + 4}px`,
                    animationDelay: `${i * 50}ms`,
                  }}
                />
              ))}
            </div>
          </div>
          <Button
            type="button"
            size="icon"
            onClick={stopRecording}
            className="shrink-0 h-10 w-10 rounded-full bg-green-500 hover:bg-green-600 text-white"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Main input area */}
      {!isRecording && (
        <div className="flex items-end gap-2 p-3">
          {/* Hidden file inputs */}
          <input
            ref={mediaFileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <input
            ref={documentFileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.ppt,.pptx,.zip,.rar"
            onChange={handleFileSelect}
            className="hidden"
          />

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
              disabled={disabled || isSending}
              rows={1}
              className={cn(
                "w-full resize-none rounded-full border bg-muted/50 pl-4 pr-28 py-3 text-sm",
                "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring",
                "disabled:cursor-not-allowed disabled:opacity-50"
              )}
            />

            {/* Icons inside input - right side */}
            <div className="absolute bottom-1.5 right-2 flex items-center gap-0.5">
              {/* Mic button */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={startRecording}
                disabled={disabled || stillUploading}
              >
                <Mic className="h-5 w-5 text-muted-foreground" />
              </Button>

              {/* Emoji picker */}
              <div className="relative" ref={emojiPickerRef}>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  disabled={disabled}
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

              {/* Attachment button with dropdown */}
              <div className="relative" ref={attachmentMenuRef}>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                  disabled={stillUploading || disabled}
                >
                  <Paperclip className="h-5 w-5 text-muted-foreground" />
                </Button>
                {showAttachmentMenu && (
                  <div className="absolute bottom-full right-0 mb-2 z-50 bg-background border rounded-lg shadow-lg overflow-hidden min-w-[180px]">
                    <button
                      type="button"
                      onClick={() => mediaFileInputRef.current?.click()}
                      className="flex items-center gap-3 w-full px-4 py-3 hover:bg-muted text-left transition-colors"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500">
                        <Image className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm font-medium">Photos & videos</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => documentFileInputRef.current?.click()}
                      className="flex items-center gap-3 w-full px-4 py-3 hover:bg-muted text-left transition-colors"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500">
                        <FileText className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm font-medium">Document</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Send button */}
          <Button
            type="submit"
            size="icon"
            disabled={!canSend || isSending || disabled}
            className="shrink-0 h-10 w-10 rounded-full bg-green-500 hover:bg-green-600 text-white"
          >
            {isSending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      )}
    </form>
  );
}

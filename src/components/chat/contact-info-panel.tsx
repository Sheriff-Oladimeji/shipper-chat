"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Phone, Video, FileText, Image, Link2, X, Loader2, ExternalLink } from "lucide-react";
import type { User } from "@/types";
import { cn } from "@/lib/utils";

interface ContactInfoPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
  conversationId: string;
}

interface MediaItem {
  id: string;
  url: string;
  name: string;
  type: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

interface LinkItem {
  id: string;
  url: string;
  messageId: string;
  createdAt: string;
}

interface DocItem {
  id: string;
  url: string;
  name: string;
  size: number;
  mimeType: string;
  createdAt: string;
}

interface ConversationMediaResponse {
  success: boolean;
  data: {
    media: Record<string, MediaItem[]>;
    documents: DocItem[];
    links: LinkItem[];
  };
}

function getFileIcon(mimeType: string) {
  if (mimeType.includes("pdf")) return "bg-red-500";
  if (mimeType.includes("word") || mimeType.includes("document")) return "bg-blue-500";
  if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) return "bg-green-500";
  if (mimeType.includes("powerpoint") || mimeType.includes("presentation")) return "bg-orange-500";
  return "bg-gray-500";
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function getFileExtension(name: string): string {
  return name.split(".").pop()?.toUpperCase() || "FILE";
}

function extractDomain(url: string): string {
  try {
    // Add protocol if missing for URL parsing
    const urlWithProtocol = url.startsWith("http") ? url : `https://${url}`;
    return new URL(urlWithProtocol).hostname;
  } catch {
    // Fallback: extract domain from the URL string
    const match = url.match(/^(?:https?:\/\/)?(?:www\.)?([^\/\s]+)/i);
    return match ? match[1] : url;
  }
}

function getFullUrl(url: string): string {
  // Ensure URL has protocol for proper linking
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return `https://${url}`;
}

async function fetchConversationMedia(conversationId: string): Promise<ConversationMediaResponse["data"]> {
  const response = await fetch(`/api/conversations/${conversationId}/media`);
  if (!response.ok) {
    throw new Error("Failed to fetch media");
  }
  const data: ConversationMediaResponse = await response.json();
  return data.data;
}

export function ContactInfoPanel({
  open,
  onOpenChange,
  user,
  conversationId,
}: ContactInfoPanelProps) {
  const [activeTab, setActiveTab] = useState("media");

  const { data, isLoading } = useQuery({
    queryKey: ["conversation-media", conversationId],
    queryFn: () => fetchConversationMedia(conversationId),
    enabled: open && !!conversationId,
    staleTime: 0, // Always fetch fresh data when panel opens
    refetchOnMount: "always",
  });

  const groupedMedia = data?.media || {};
  const links = data?.links || [];
  const docs = data?.documents || [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        transparent
        className="w-[360px] sm:max-w-[360px] p-0 gap-0 [&>button]:hidden"
        side="right"
      >
        {/* Custom Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <SheetTitle className="text-base">Contact Info</SheetTitle>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-full p-1.5 hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* User Info */}
        <div className="flex flex-col items-center py-6 border-b">
          <Avatar
            src={user.image}
            fallback={user.name}
            size="xl"
            className="mb-3"
          />
          <h3 className="font-semibold text-lg">{user.name}</h3>
          <p className="text-sm text-muted-foreground">{user.email}</p>

          {/* Action buttons */}
          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 rounded-full px-4"
            >
              <Phone className="h-4 w-4" />
              Audio
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 rounded-full px-4"
            >
              <Video className="h-4 w-4" />
              Video
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="grid w-full grid-cols-3 rounded-none border-b bg-transparent h-auto p-0">
            <TabsTrigger
              value="media"
              className={cn(
                "rounded-none py-3 text-sm font-medium border-b-2 border-transparent data-[state=active]:border-green-500 data-[state=active]:bg-transparent data-[state=active]:text-green-500"
              )}
            >
              <Image className="h-4 w-4 mr-1.5" />
              Media
            </TabsTrigger>
            <TabsTrigger
              value="link"
              className={cn(
                "rounded-none py-3 text-sm font-medium border-b-2 border-transparent data-[state=active]:border-green-500 data-[state=active]:bg-transparent data-[state=active]:text-green-500"
              )}
            >
              <Link2 className="h-4 w-4 mr-1.5" />
              Link
            </TabsTrigger>
            <TabsTrigger
              value="docs"
              className={cn(
                "rounded-none py-3 text-sm font-medium border-b-2 border-transparent data-[state=active]:border-green-500 data-[state=active]:bg-transparent data-[state=active]:text-green-500"
              )}
            >
              <FileText className="h-4 w-4 mr-1.5" />
              Docs
            </TabsTrigger>
          </TabsList>

          {/* Media Tab */}
          <TabsContent
            value="media"
            className="flex-1 overflow-y-auto mt-0 p-0"
          >
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : Object.keys(groupedMedia).length > 0 ? (
              Object.entries(groupedMedia).map(([month, items]) => (
                <div key={month}>
                  <h4 className="text-xs font-medium text-muted-foreground px-4 py-2 bg-muted/50">
                    {month}
                  </h4>
                  <div className="grid grid-cols-3 gap-0.5 p-0.5">
                    {items.map((item) => (
                      <a
                        key={item.id}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="aspect-square bg-muted cursor-pointer hover:opacity-80 transition-opacity overflow-hidden"
                      >
                        {item.type === "image" ? (
                          <img
                            src={item.url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : item.type === "video" ? (
                          <video
                            src={item.url}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                            <Image className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Image className="h-12 w-12 mb-3 opacity-50" />
                <p className="text-sm">No media shared yet</p>
              </div>
            )}
          </TabsContent>

          {/* Links Tab */}
          <TabsContent
            value="link"
            className="flex-1 overflow-y-auto mt-0 p-0"
          >
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : links.length > 0 ? (
              <div className="divide-y">
                {links.map((link) => (
                  <a
                    key={link.id}
                    href={getFullUrl(link.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <Link2 className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{extractDomain(link.url)}</p>
                      <p className="text-xs text-green-500 truncate mt-0.5">
                        {link.url}
                      </p>
                    </div>
                    <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </a>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Link2 className="h-12 w-12 mb-3 opacity-50" />
                <p className="text-sm">No links shared yet</p>
              </div>
            )}
          </TabsContent>

          {/* Docs Tab */}
          <TabsContent
            value="docs"
            className="flex-1 overflow-y-auto mt-0 p-0"
          >
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : docs.length > 0 ? (
              <div className="divide-y">
                {docs.map((doc) => (
                  <a
                    key={doc.id}
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left"
                  >
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white text-xs font-bold",
                        getFileIcon(doc.mimeType)
                      )}
                    >
                      {getFileExtension(doc.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(doc.size)}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mb-3 opacity-50" />
                <p className="text-sm">No documents shared yet</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

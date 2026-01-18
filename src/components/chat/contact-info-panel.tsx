"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Phone, Video, FileText, Image, Link2, X } from "lucide-react";
import type { User } from "@/types";
import { cn } from "@/lib/utils";

interface ContactInfoPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
}

// Dummy data for demonstration
const dummyMedia = [
  { id: "1", url: "/placeholder.jpg", month: "May" },
  { id: "2", url: "/placeholder.jpg", month: "May" },
  { id: "3", url: "/placeholder.jpg", month: "May" },
  { id: "4", url: "/placeholder.jpg", month: "May" },
  { id: "5", url: "/placeholder.jpg", month: "April 2025" },
  { id: "6", url: "/placeholder.jpg", month: "April 2025" },
  { id: "7", url: "/placeholder.jpg", month: "April 2025" },
  { id: "8", url: "/placeholder.jpg", month: "April 2025" },
];

const dummyLinks = [
  {
    id: "1",
    title: "Google Drive",
    url: "https://drive.google.com",
    description: "Shared folder with project files",
    favicon: "https://www.google.com/favicon.ico",
  },
  {
    id: "2",
    title: "Figma Design",
    url: "https://figma.com",
    description: "UI/UX design mockups",
    favicon: "https://www.figma.com/favicon.ico",
  },
  {
    id: "3",
    title: "GitHub Repository",
    url: "https://github.com",
    description: "Project source code",
    favicon: "https://github.com/favicon.ico",
  },
];

const dummyDocs = [
  {
    id: "1",
    name: "Project Proposal.pdf",
    size: "2.4 MB",
    type: "pdf",
  },
  {
    id: "2",
    name: "Meeting Notes.docx",
    size: "156 KB",
    type: "docx",
  },
  {
    id: "3",
    name: "Budget Spreadsheet.xlsx",
    size: "890 KB",
    type: "xlsx",
  },
  {
    id: "4",
    name: "Contract.pdf",
    size: "1.2 MB",
    type: "pdf",
  },
];

function getFileIcon(type: string) {
  const colors: Record<string, string> = {
    pdf: "bg-red-500",
    docx: "bg-blue-500",
    xlsx: "bg-green-500",
    doc: "bg-blue-500",
    xls: "bg-green-500",
    ppt: "bg-orange-500",
    pptx: "bg-orange-500",
  };
  return colors[type] || "bg-gray-500";
}

// Group media by month
function groupByMonth(
  items: { id: string; url: string; month: string }[]
): Record<string, typeof items> {
  return items.reduce(
    (acc, item) => {
      if (!acc[item.month]) {
        acc[item.month] = [];
      }
      acc[item.month].push(item);
      return acc;
    },
    {} as Record<string, typeof items>
  );
}

export function ContactInfoPanel({
  open,
  onOpenChange,
  user,
}: ContactInfoPanelProps) {
  const [activeTab, setActiveTab] = useState("media");
  const groupedMedia = groupByMonth(dummyMedia);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        transparent
        className="w-80 p-0 gap-0 [&>button]:hidden"
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
            {Object.entries(groupedMedia).map(([month, items]) => (
              <div key={month}>
                <h4 className="text-xs font-medium text-muted-foreground px-4 py-2 bg-muted/50">
                  {month}
                </h4>
                <div className="grid grid-cols-3 gap-0.5 p-0.5">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="aspect-square bg-muted cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                        <Image className="h-6 w-6 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {Object.keys(groupedMedia).length === 0 && (
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
            <div className="divide-y">
              {dummyLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    {link.favicon ? (
                      <img
                        src={link.favicon}
                        alt=""
                        className="h-5 w-5"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <Link2 className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{link.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {link.description}
                    </p>
                    <p className="text-xs text-green-500 truncate mt-0.5">
                      {link.url}
                    </p>
                  </div>
                </a>
              ))}
              {dummyLinks.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Link2 className="h-12 w-12 mb-3 opacity-50" />
                  <p className="text-sm">No links shared yet</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Docs Tab */}
          <TabsContent
            value="docs"
            className="flex-1 overflow-y-auto mt-0 p-0"
          >
            <div className="divide-y">
              {dummyDocs.map((doc) => (
                <button
                  key={doc.id}
                  className="flex w-full items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left"
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white",
                      getFileIcon(doc.type)
                    )}
                  >
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {doc.size} • {doc.type.toUpperCase()}
                    </p>
                  </div>
                </button>
              ))}
              {dummyDocs.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mb-3 opacity-50" />
                  <p className="text-sm">No documents shared yet</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

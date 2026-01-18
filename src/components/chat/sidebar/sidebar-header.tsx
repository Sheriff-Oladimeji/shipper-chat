"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SidebarHeaderProps {
  onNewMessage: () => void;
}

export function SidebarHeader({ onNewMessage }: SidebarHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b">
      <h1 className="text-xl font-semibold text-foreground">All Message</h1>
      <Button
        variant="success"
        size="sm"
        onClick={onNewMessage}
        className="gap-1"
      >
        <Plus className="h-4 w-4" />
        New Message
      </Button>
    </div>
  );
}

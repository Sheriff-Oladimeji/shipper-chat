"use client";

import { PenSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RefObject } from "react";

interface SidebarHeaderProps {
  onNewMessage: () => void;
  isOpen?: boolean;
  buttonRef?: RefObject<HTMLButtonElement | null>;
}

export function SidebarHeader({ onNewMessage, isOpen, buttonRef }: SidebarHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b">
      <h1 className="text-xl font-semibold text-foreground">All Message</h1>
      <Button
        ref={buttonRef}
        variant="success"
        size="sm"
        onClick={onNewMessage}
        className="gap-1.5"
      >
        <PenSquare className="h-4 w-4" />
        New Message
      </Button>
    </div>
  );
}

"use client";

import { MessageSquare } from "lucide-react";

export default function ChatPage() {
  return (
    <div className="flex h-full items-center justify-center bg-muted/30">
      <div className="text-center max-w-md px-4">
        <div className="flex justify-center mb-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <MessageSquare className="h-10 w-10 text-primary" />
          </div>
        </div>
        <h2 className="text-2xl font-semibold mb-2">Welcome to Shippr Chat</h2>
        <p className="text-muted-foreground">
          Select a conversation from the sidebar or start a new message to begin chatting.
        </p>
      </div>
    </div>
  );
}

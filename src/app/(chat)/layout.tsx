"use client";

import { useEffect } from "react";
import { Sidebar } from "@/components/chat/sidebar";
import { QueryProvider } from "@/components/providers/query-provider";
import { useAuth } from "@/hooks/use-auth";
import { usePusher } from "@/hooks/use-pusher";
import { useChatStore } from "@/stores/chat-store";
import { Loader2 } from "lucide-react";
import { redirect } from "next/navigation";

function ChatLayoutInner({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { isSidebarOpen } = useChatStore();

  // Set up Pusher for real-time updates
  usePusher(user?.id);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen bg-background">
      <div className={`${isSidebarOpen ? "block" : "hidden"} md:block`}>
        <Sidebar currentUserId={user.id} />
      </div>
      <main className="flex-1 flex flex-col min-w-0">{children}</main>
    </div>
  );
}

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <ChatLayoutInner>{children}</ChatLayoutInner>
    </QueryProvider>
  );
}

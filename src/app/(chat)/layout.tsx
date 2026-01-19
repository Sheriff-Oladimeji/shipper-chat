"use client";

import { Sidebar } from "@/components/chat/sidebar";
import { NavSidebar } from "@/components/nav-sidebar";
import { TopNavbar } from "@/components/top-navbar";
import { QueryProvider } from "@/components/providers/query-provider";
import { useAuth } from "@/hooks/use-auth";
import { usePusher } from "@/hooks/use-pusher";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

function ChatLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();

  // Set up Pusher for real-time updates
  usePusher(user?.id);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Left navigation sidebar */}
      <NavSidebar />
      {/* Conversations sidebar */}
      <div className="hidden md:block">
        <Sidebar currentUserId={user.id} />
      </div>
      {/* Main content area with top navbar */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopNavbar />
        <main className="flex-1 flex flex-col min-w-0">{children}</main>
      </div>
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

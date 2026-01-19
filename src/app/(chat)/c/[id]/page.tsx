"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ConversationView } from "@/components/chat/conversation";
import { useAuth } from "@/hooks/use-auth";
import { useChatStore } from "@/stores/chat-store";
import { Skeleton } from "@/components/ui/skeleton";

async function fetchConversation(id: string) {
  const response = await fetch(`/api/conversations/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch conversation");
  }
  const data = await response.json();
  return data.data;
}

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id as string;
  const { user } = useAuth();
  const { setActiveConversationId } = useChatStore();

  const { data: conversation, isLoading, error } = useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: () => fetchConversation(conversationId),
    enabled: !!conversationId,
  });

  useEffect(() => {
    if (conversationId) {
      setActiveConversationId(conversationId);
    }
    return () => {
      setActiveConversationId(null);
    };
  }, [conversationId, setActiveConversationId]);

  if (isLoading) {
    return (
      <div className="flex h-full flex-col">
        {/* Header skeleton */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-card">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-9 w-9 rounded-lg" />
          </div>
        </div>

        {/* Messages skeleton */}
        <div className="flex-1 px-4 py-4 space-y-4">
          <div className="flex justify-start">
            <div className="flex gap-2 max-w-[70%]">
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <div className="space-y-2">
                <Skeleton className="h-16 w-48 rounded-2xl rounded-tl-sm" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <div className="space-y-2">
              <Skeleton className="h-12 w-56 rounded-2xl rounded-tr-sm bg-primary/20" />
              <Skeleton className="h-3 w-16 ml-auto" />
            </div>
          </div>
          <div className="flex justify-start">
            <div className="flex gap-2 max-w-[70%]">
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <div className="space-y-2">
                <Skeleton className="h-10 w-64 rounded-2xl rounded-tl-sm" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <div className="space-y-2">
              <Skeleton className="h-20 w-52 rounded-2xl rounded-tr-sm bg-primary/20" />
              <Skeleton className="h-3 w-16 ml-auto" />
            </div>
          </div>
        </div>

        {/* Input skeleton */}
        <div className="border-t p-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 flex-1 rounded-lg" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !conversation) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Conversation not found</p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 text-primary hover:underline"
          >
            Go back to conversations
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const otherUser =
    conversation.user1Id === user.id ? conversation.user2 : conversation.user1;

  return (
    <ConversationView
      conversationId={conversationId}
      otherUser={otherUser}
      currentUserId={user.id}
    />
  );
}

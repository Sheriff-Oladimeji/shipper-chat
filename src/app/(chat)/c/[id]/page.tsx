"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ConversationView } from "@/components/chat/conversation";
import { useAuth } from "@/hooks/use-auth";
import { useChatStore } from "@/stores/chat-store";
import { Loader2 } from "lucide-react";

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
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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

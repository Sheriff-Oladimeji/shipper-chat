import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { pusherServer, getConversationChannel, PUSHER_EVENTS } from "@/lib/pusher";

export async function POST(request: NextRequest) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401 }
    );
  }

  const body = await request.json();
  const { conversationId, isTyping } = body;

  if (!conversationId) {
    return NextResponse.json(
      { success: false, error: "Conversation ID is required" },
      { status: 400 }
    );
  }

  const event = isTyping ? PUSHER_EVENTS.TYPING_START : PUSHER_EVENTS.TYPING_STOP;

  await pusherServer.trigger(getConversationChannel(conversationId), event, {
    userId: currentUser.id,
    name: currentUser.name,
    isTyping,
  });

  return NextResponse.json({ success: true });
}

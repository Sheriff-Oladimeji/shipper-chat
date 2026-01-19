import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/db";
import { pusherServer, getConversationChannel, PUSHER_EVENTS } from "@/lib/realtime";

export async function POST(request: NextRequest) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401 }
    );
  }

  const body = await request.json();
  const { conversationId } = body;

  if (!conversationId) {
    return NextResponse.json(
      { success: false, error: "Conversation ID is required" },
      { status: 400 }
    );
  }

  // Verify user is part of conversation
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) {
    return NextResponse.json(
      { success: false, error: "Conversation not found" },
      { status: 404 }
    );
  }

  if (conversation.user1Id !== currentUser.id && conversation.user2Id !== currentUser.id) {
    return NextResponse.json(
      { success: false, error: "Not authorized" },
      { status: 403 }
    );
  }

  // Mark all unread messages in conversation as read
  const result = await prisma.message.updateMany({
    where: {
      conversationId,
      receiverId: currentUser.id,
      isRead: false,
    },
    data: { isRead: true },
  });

  // Trigger Pusher event
  await pusherServer.trigger(
    getConversationChannel(conversationId),
    PUSHER_EVENTS.MESSAGE_READ,
    {
      conversationId,
      readBy: currentUser.id,
      readAt: new Date().toISOString(),
      count: result.count,
    }
  );

  return NextResponse.json({
    success: true,
    data: { count: result.count },
  });
}

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/db";
import { pusherServer, getConversationChannel, PUSHER_EVENTS } from "@/lib/realtime";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await getCurrentUser();
  const { id } = await params;

  if (!currentUser) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401 }
    );
  }

  const message = await prisma.message.findUnique({
    where: { id },
    include: { conversation: true },
  });

  if (!message) {
    return NextResponse.json(
      { success: false, error: "Message not found" },
      { status: 404 }
    );
  }

  // Only the receiver can mark as read
  if (message.receiverId !== currentUser.id) {
    return NextResponse.json(
      { success: false, error: "Not authorized" },
      { status: 403 }
    );
  }

  // Mark as read
  const updatedMessage = await prisma.message.update({
    where: { id },
    data: { isRead: true },
  });

  // Trigger Pusher event
  await pusherServer.trigger(
    getConversationChannel(message.conversationId),
    PUSHER_EVENTS.MESSAGE_READ,
    {
      messageId: id,
      readBy: currentUser.id,
      readAt: new Date().toISOString(),
    }
  );

  return NextResponse.json({
    success: true,
    data: updatedMessage,
  });
}

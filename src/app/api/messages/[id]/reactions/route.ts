import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/db";
import { pusherServer, getConversationChannel, PUSHER_EVENTS } from "@/lib/realtime";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await getCurrentUser();
  const { id: messageId } = await params;

  if (!currentUser) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401 }
    );
  }

  const body = await request.json();
  const { emoji } = body;

  if (!emoji) {
    return NextResponse.json(
      { success: false, error: "Emoji is required" },
      { status: 400 }
    );
  }

  // Get message to verify it exists and get conversation ID
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: { conversation: true },
  });

  if (!message) {
    return NextResponse.json(
      { success: false, error: "Message not found" },
      { status: 404 }
    );
  }

  // Verify user is part of the conversation
  if (message.conversation.user1Id !== currentUser.id && message.conversation.user2Id !== currentUser.id) {
    return NextResponse.json(
      { success: false, error: "Not authorized" },
      { status: 403 }
    );
  }

  // Toggle reaction - if exists, remove; if not, add
  const existingReaction = await prisma.reaction.findUnique({
    where: {
      userId_messageId_emoji: {
        userId: currentUser.id,
        messageId,
        emoji,
      },
    },
  });

  if (existingReaction) {
    // Remove reaction
    await prisma.reaction.delete({
      where: { id: existingReaction.id },
    });

    // Notify via Pusher
    await pusherServer.trigger(
      getConversationChannel(message.conversationId),
      PUSHER_EVENTS.REACTION_REMOVED,
      {
        messageId,
        emoji,
        userId: currentUser.id,
      }
    );

    return NextResponse.json({
      success: true,
      action: "removed",
    });
  } else {
    // Add reaction
    const reaction = await prisma.reaction.create({
      data: {
        emoji,
        userId: currentUser.id,
        messageId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Notify via Pusher
    await pusherServer.trigger(
      getConversationChannel(message.conversationId),
      PUSHER_EVENTS.REACTION_ADDED,
      {
        messageId,
        emoji,
        userId: currentUser.id,
        userName: currentUser.name,
      }
    );

    return NextResponse.json({
      success: true,
      action: "added",
      data: reaction,
    });
  }
}

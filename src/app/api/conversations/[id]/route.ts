import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/db";

// Consider a user online if they were active in the last 5 minutes
const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;

function isUserOnline(lastSeenAt: Date | null): boolean {
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() < ONLINE_THRESHOLD_MS;
}

export async function GET(
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

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      user1: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          isOnline: true,
          lastSeenAt: true,
        },
      },
      user2: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          isOnline: true,
          lastSeenAt: true,
        },
      },
      messages: {
        orderBy: { createdAt: "asc" },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      },
    },
  });

  if (!conversation) {
    return NextResponse.json(
      { success: false, error: "Conversation not found" },
      { status: 404 }
    );
  }

  // Verify user is part of conversation
  if (conversation.user1Id !== currentUser.id && conversation.user2Id !== currentUser.id) {
    return NextResponse.json(
      { success: false, error: "Not authorized" },
      { status: 403 }
    );
  }

  // Update current user's lastSeenAt
  await prisma.user.update({
    where: { id: currentUser.id },
    data: { lastSeenAt: new Date() },
  });

  // Compute online status dynamically
  const conversationWithOnlineStatus = {
    ...conversation,
    user1: {
      ...conversation.user1,
      isOnline: isUserOnline(conversation.user1.lastSeenAt),
    },
    user2: {
      ...conversation.user2,
      isOnline: isUserOnline(conversation.user2.lastSeenAt),
    },
  };

  return NextResponse.json({
    success: true,
    data: conversationWithOnlineStatus,
  });
}

export async function DELETE(
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

  const conversation = await prisma.conversation.findUnique({
    where: { id },
  });

  if (!conversation) {
    return NextResponse.json(
      { success: false, error: "Conversation not found" },
      { status: 404 }
    );
  }

  // Verify user is part of conversation
  if (conversation.user1Id !== currentUser.id && conversation.user2Id !== currentUser.id) {
    return NextResponse.json(
      { success: false, error: "Not authorized" },
      { status: 403 }
    );
  }

  await prisma.conversation.delete({
    where: { id },
  });

  return NextResponse.json({
    success: true,
  });
}

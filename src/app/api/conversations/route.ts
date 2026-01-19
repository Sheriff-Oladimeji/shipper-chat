import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Consider a user online if they were active in the last 5 minutes
const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;

function isUserOnline(lastSeenAt: Date | null): boolean {
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() < ONLINE_THRESHOLD_MS;
}

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401 }
    );
  }

  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [
        { user1Id: currentUser.id },
        { user2Id: currentUser.id },
      ],
    },
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
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          attachments: true,
        },
      },
      settings: {
        where: {
          userId: currentUser.id,
        },
        take: 1,
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  // Map conversations with last message, settings, and computed online status
  const conversationsWithDetails = conversations.map((conv) => ({
    ...conv,
    user1: {
      ...conv.user1,
      isOnline: isUserOnline(conv.user1.lastSeenAt),
    },
    user2: {
      ...conv.user2,
      isOnline: isUserOnline(conv.user2.lastSeenAt),
    },
    lastMessage: conv.messages[0] || null,
    unreadCount: 0, // TODO: Optimize with a single query
    settings: conv.settings[0] || null,
  }));

  return NextResponse.json({
    success: true,
    data: conversationsWithDetails,
  });
}

export async function POST(request: NextRequest) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401 }
    );
  }

  const body = await request.json();
  const { userId } = body;

  if (!userId) {
    return NextResponse.json(
      { success: false, error: "User ID is required" },
      { status: 400 }
    );
  }

  // Check if user exists
  const otherUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!otherUser) {
    return NextResponse.json(
      { success: false, error: "User not found" },
      { status: 404 }
    );
  }

  // Check if conversation already exists (in either direction)
  const existingConversation = await prisma.conversation.findFirst({
    where: {
      OR: [
        { user1Id: currentUser.id, user2Id: userId },
        { user1Id: userId, user2Id: currentUser.id },
      ],
    },
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
    },
  });

  if (existingConversation) {
    return NextResponse.json({
      success: true,
      data: existingConversation,
    });
  }

  // Create new conversation
  const conversation = await prisma.conversation.create({
    data: {
      user1Id: currentUser.id,
      user2Id: userId,
    },
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
    },
  });

  return NextResponse.json({
    success: true,
    data: conversation,
  });
}

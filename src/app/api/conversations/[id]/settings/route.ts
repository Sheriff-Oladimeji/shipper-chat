import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

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

  const settings = await prisma.conversationSettings.findUnique({
    where: {
      userId_conversationId: {
        userId: currentUser.id,
        conversationId: id,
      },
    },
  });

  return NextResponse.json({
    success: true,
    data: settings || {
      isArchived: false,
      isMuted: false,
      isMarkedUnread: false,
      isPinned: false,
    },
  });
}

export async function PATCH(
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

  const body = await request.json();
  const { isArchived, isMuted, isMarkedUnread, isPinned } = body;

  // Verify conversation exists and user is part of it
  const conversation = await prisma.conversation.findFirst({
    where: {
      id,
      OR: [
        { user1Id: currentUser.id },
        { user2Id: currentUser.id },
      ],
    },
  });

  if (!conversation) {
    return NextResponse.json(
      { success: false, error: "Conversation not found" },
      { status: 404 }
    );
  }

  // Upsert settings
  const settings = await prisma.conversationSettings.upsert({
    where: {
      userId_conversationId: {
        userId: currentUser.id,
        conversationId: id,
      },
    },
    update: {
      ...(isArchived !== undefined && { isArchived }),
      ...(isMuted !== undefined && { isMuted }),
      ...(isMarkedUnread !== undefined && { isMarkedUnread }),
      ...(isPinned !== undefined && { isPinned }),
    },
    create: {
      userId: currentUser.id,
      conversationId: id,
      isArchived: isArchived || false,
      isMuted: isMuted || false,
      isMarkedUnread: isMarkedUnread || false,
      isPinned: isPinned || false,
    },
  });

  return NextResponse.json({
    success: true,
    data: settings,
  });
}

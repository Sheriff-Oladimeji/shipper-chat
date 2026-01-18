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

  return NextResponse.json({
    success: true,
    data: conversation,
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

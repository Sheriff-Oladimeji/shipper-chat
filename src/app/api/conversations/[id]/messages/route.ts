import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { pusherServer, getConversationChannel, getUserChannel, PUSHER_EVENTS } from "@/lib/pusher";

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

  const searchParams = request.nextUrl.searchParams;
  const cursor = searchParams.get("cursor");
  const limit = parseInt(searchParams.get("limit") || "50", 10);

  const messages = await prisma.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor && {
      cursor: { id: cursor },
      skip: 1,
    }),
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });

  const hasMore = messages.length > limit;
  const data = hasMore ? messages.slice(0, limit) : messages;

  return NextResponse.json({
    success: true,
    data: data.reverse(), // Return in chronological order
    nextCursor: hasMore ? data[0].id : null,
  });
}

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

  const body = await request.json();
  const { content } = body;

  if (!content?.trim()) {
    return NextResponse.json(
      { success: false, error: "Message content is required" },
      { status: 400 }
    );
  }

  const receiverId = conversation.user1Id === currentUser.id
    ? conversation.user2Id
    : conversation.user1Id;

  const message = await prisma.message.create({
    data: {
      content: content.trim(),
      senderId: currentUser.id,
      receiverId,
      conversationId: id,
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });

  // Update conversation timestamp
  await prisma.conversation.update({
    where: { id },
    data: { updatedAt: new Date() },
  });

  // Trigger Pusher events
  await Promise.all([
    // Notify conversation channel
    pusherServer.trigger(getConversationChannel(id), PUSHER_EVENTS.NEW_MESSAGE, message),
    // Notify receiver's personal channel
    pusherServer.trigger(getUserChannel(receiverId), PUSHER_EVENTS.NEW_MESSAGE, {
      ...message,
      conversationId: id,
    }),
  ]);

  return NextResponse.json({
    success: true,
    data: message,
  });
}

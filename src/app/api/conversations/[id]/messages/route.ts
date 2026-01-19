import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/db";
import { pusherServer, getConversationChannel, getUserChannel, PUSHER_EVENTS } from "@/lib/realtime";

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
      attachments: true,
      reactions: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
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
  const { content, attachments } = body;

  // Allow messages with either content or attachments (or both)
  if (!content?.trim() && (!attachments || attachments.length === 0)) {
    return NextResponse.json(
      { success: false, error: "Message content or attachments required" },
      { status: 400 }
    );
  }

  const receiverId = conversation.user1Id === currentUser.id
    ? conversation.user2Id
    : conversation.user1Id;

  // Determine attachment type from mimeType
  const getAttachmentType = (mimeType: string): string => {
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType.startsWith("video/")) return "video";
    if (mimeType.startsWith("audio/")) return "audio";
    if (mimeType === "application/pdf" ||
        mimeType.includes("document") ||
        mimeType.includes("spreadsheet") ||
        mimeType.includes("word") ||
        mimeType.includes("excel") ||
        mimeType === "text/plain") return "document";
    return "other";
  };

  const message = await prisma.message.create({
    data: {
      content: content?.trim() || "",
      senderId: currentUser.id,
      receiverId,
      conversationId: id,
      ...(attachments && attachments.length > 0 && {
        attachments: {
          create: attachments.map((att: { url: string; name: string; size: number; mimeType: string }) => ({
            url: att.url,
            name: att.name,
            size: att.size,
            mimeType: att.mimeType,
            type: getAttachmentType(att.mimeType),
          })),
        },
      }),
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      attachments: true,
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

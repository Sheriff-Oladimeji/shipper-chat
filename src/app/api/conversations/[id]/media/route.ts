import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/db";

// URL regex pattern to extract links from message content
// Matches: http://, https://, www., or domain.tld patterns
const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`\[\]]+|www\.[^\s<>"{}|\\^`\[\]]+|[a-zA-Z0-9][-a-zA-Z0-9]*\.[a-zA-Z]{2,}(?:\/[^\s<>"{}|\\^`\[\]]*)?)/gi;

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

  // Fetch all attachments for this conversation
  const attachments = await prisma.attachment.findMany({
    where: {
      message: {
        conversationId: id,
      },
    },
    orderBy: { createdAt: "desc" },
    include: {
      message: {
        select: {
          createdAt: true,
        },
      },
    },
  });

  // Fetch messages that might contain links
  // We search for common link patterns: http, www, .com, .org, .net, .io, etc.
  const messages = await prisma.message.findMany({
    where: {
      conversationId: id,
      OR: [
        { content: { contains: "http" } },
        { content: { contains: "www." } },
        { content: { contains: ".com" } },
        { content: { contains: ".org" } },
        { content: { contains: ".net" } },
        { content: { contains: ".io" } },
        { content: { contains: ".co" } },
        { content: { contains: ".dev" } },
        { content: { contains: ".app" } },
      ],
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      content: true,
      createdAt: true,
    },
  });

  // Extract links from messages
  const extractedLinks: Array<{
    id: string;
    url: string;
    messageId: string;
    createdAt: Date;
  }> = [];

  messages.forEach((message) => {
    const matches = message.content.match(urlRegex);
    if (matches) {
      matches.forEach((url, index) => {
        extractedLinks.push({
          id: `${message.id}-${index}`,
          url,
          messageId: message.id,
          createdAt: message.createdAt,
        });
      });
    }
  });

  // Separate attachments by type
  const media = attachments.filter(
    (a) => a.type === "image" || a.type === "video"
  );
  const documents = attachments.filter((a) => a.type === "document");
  const audio = attachments.filter((a) => a.type === "audio");
  const other = attachments.filter((a) => a.type === "other");

  // Group media by month/year
  type MediaItemType = {
    id: string;
    url: string;
    name: string;
    type: string;
    mimeType: string;
    size: number;
    createdAt: Date;
  };

  const groupedMedia = media.reduce(
    (acc, item) => {
      const date = new Date(item.createdAt);
      const monthYear = date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
      if (!acc[monthYear]) {
        acc[monthYear] = [];
      }
      acc[monthYear].push({
        id: item.id,
        url: item.url,
        name: item.name,
        type: item.type,
        mimeType: item.mimeType,
        size: item.size,
        createdAt: item.createdAt,
      });
      return acc;
    },
    {} as Record<string, MediaItemType[]>
  );

  return NextResponse.json({
    success: true,
    data: {
      media: groupedMedia,
      documents: documents.map((d) => ({
        id: d.id,
        url: d.url,
        name: d.name,
        size: d.size,
        mimeType: d.mimeType,
        createdAt: d.createdAt,
      })),
      links: extractedLinks,
      audio: audio.map((a) => ({
        id: a.id,
        url: a.url,
        name: a.name,
        size: a.size,
        mimeType: a.mimeType,
        createdAt: a.createdAt,
      })),
      other: other.map((o) => ({
        id: o.id,
        url: o.url,
        name: o.name,
        size: o.size,
        mimeType: o.mimeType,
        createdAt: o.createdAt,
      })),
    },
  });
}

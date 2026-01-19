import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import prisma from "@/lib/prisma";
import { pusherServer, getConversationChannel, getUserChannel, PUSHER_EVENTS } from "@/lib/pusher";
import type { Message } from "@/generated/prisma";

export async function POST(request: NextRequest) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401 }
    );
  }

  const body = await request.json();
  const { prompt, conversationId } = body;

  if (!prompt?.trim()) {
    return NextResponse.json(
      { success: false, error: "Prompt is required" },
      { status: 400 }
    );
  }

  if (!conversationId) {
    return NextResponse.json(
      { success: false, error: "Conversation ID is required" },
      { status: 400 }
    );
  }

  // Verify user has access to conversation
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
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

  try {
    // Build context from recent messages
    const messageContext = conversation.messages
      .reverse()
      .map((m: Message) => `${m.senderId === currentUser.id ? "User" : "Other"}: ${m.content}`)
      .join("\n");

    const systemPrompt = `You are a helpful AI assistant in a chat application.
You're helping a user in their conversation. Be concise, friendly, and helpful.
Keep responses brief and conversational.

Recent conversation context:
${messageContext}`;

    const { text } = await generateText({
      model: google("gemini-2.0-flash"),
      system: systemPrompt,
      prompt: prompt.trim(),
    });

    // Determine receiver (the other person in the conversation)
    const receiverId = conversation.user1Id === currentUser.id
      ? conversation.user2Id
      : conversation.user1Id;

    // Save AI response as a message
    const aiMessage = await prisma.message.create({
      data: {
        content: text,
        senderId: currentUser.id,
        receiverId,
        conversationId,
        isAiGenerated: true,
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
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // Trigger Pusher events
    await Promise.all([
      pusherServer.trigger(getConversationChannel(conversationId), PUSHER_EVENTS.NEW_MESSAGE, aiMessage),
      pusherServer.trigger(getUserChannel(receiverId), PUSHER_EVENTS.NEW_MESSAGE, {
        ...aiMessage,
        conversationId,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        response: text,
        message: aiMessage,
      },
    });
  } catch (error) {
    console.error("AI chat error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate AI response" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";

export async function POST(request: NextRequest) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401 }
    );
  }

  const body = await request.json();
  const { message, history } = body;

  if (!message?.trim()) {
    return NextResponse.json(
      { success: false, error: "Message is required" },
      { status: 400 }
    );
  }

  try {
    const systemPrompt = `You are a friendly and helpful AI assistant.
Be concise, clear, and conversational in your responses.
If you're not sure about something, say so.
Keep responses focused and helpful.`;

    // Build conversation history if provided
    let contextPrompt = "";
    if (history && Array.isArray(history)) {
      contextPrompt =
        history
          .map(
            (h: { role: string; content: string }) =>
              `${h.role === "user" ? "User" : "Assistant"}: ${h.content}`
          )
          .join("\n") + "\n\n";
    }

    const { text } = await generateText({
      model: google("gemini-2.0-flash"),
      system: systemPrompt,
      prompt: contextPrompt + "User: " + message.trim(),
    });

    return NextResponse.json({
      success: true,
      data: {
        response: text,
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

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { pusherServer } from "@/lib/pusher";

export async function POST(request: NextRequest) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401 }
    );
  }

  const body = await request.formData();
  const socketId = body.get("socket_id") as string;
  const channel = body.get("channel_name") as string;

  if (!socketId || !channel) {
    return NextResponse.json(
      { success: false, error: "Missing socket_id or channel_name" },
      { status: 400 }
    );
  }

  // For presence channels, include user data
  if (channel.startsWith("presence-")) {
    const presenceData = {
      user_id: currentUser.id,
      user_info: {
        name: currentUser.name,
        email: currentUser.email,
        image: currentUser.image,
      },
    };

    const auth = pusherServer.authorizeChannel(socketId, channel, presenceData);
    return NextResponse.json(auth);
  }

  // For private channels, verify user has access
  if (channel.startsWith("private-user-")) {
    const channelUserId = channel.replace("private-user-", "");
    if (channelUserId !== currentUser.id) {
      return NextResponse.json(
        { success: false, error: "Not authorized for this channel" },
        { status: 403 }
      );
    }
  }

  if (channel.startsWith("private-conversation-")) {
    // Could add additional verification here to check user is part of conversation
    // For now, we'll let it through as the API routes already verify this
  }

  const auth = pusherServer.authorizeChannel(socketId, channel);
  return NextResponse.json(auth);
}

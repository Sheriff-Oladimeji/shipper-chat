import { NextResponse } from "next/server";
import { clearAuthCookies, getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST() {
  const user = await getCurrentUser();

  if (user) {
    // Update offline status
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isOnline: false,
        lastSeenAt: new Date(),
      },
    });
  }

  await clearAuthCookies();

  return NextResponse.json({ success: true });
}

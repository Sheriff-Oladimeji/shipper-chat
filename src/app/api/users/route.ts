import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401 }
    );
  }

  const users = await prisma.user.findMany({
    where: {
      id: { not: currentUser.id },
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      isOnline: true,
      lastSeenAt: true,
    },
    orderBy: [
      { isOnline: "desc" },
      { lastSeenAt: "desc" },
    ],
  });

  return NextResponse.json({
    success: true,
    data: users,
  });
}

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  verifyRefreshToken,
  createTokens,
  setAuthCookies,
  REFRESH_TOKEN_COOKIE,
} from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;

  if (!refreshToken) {
    return NextResponse.json(
      { success: false, error: "No refresh token" },
      { status: 401 }
    );
  }

  const payload = await verifyRefreshToken(refreshToken);
  if (!payload) {
    return NextResponse.json(
      { success: false, error: "Invalid refresh token" },
      { status: 401 }
    );
  }

  // Verify user still exists
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });

  if (!user) {
    return NextResponse.json(
      { success: false, error: "User not found" },
      { status: 401 }
    );
  }

  // Create new tokens
  const tokens = await createTokens(user.id, user.email);
  await setAuthCookies(tokens.accessToken, tokens.refreshToken);

  return NextResponse.json({ success: true });
}

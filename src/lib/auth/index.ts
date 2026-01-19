import { cookies } from "next/headers";
import { verifyAccessToken, verifyRefreshToken, createTokens } from "./jwt";
import prisma from "@/lib/db";
import type { User } from "@/generated/prisma";

export const ACCESS_TOKEN_COOKIE = "access_token";
export const REFRESH_TOKEN_COOKIE = "refresh_token";

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

  if (!accessToken) {
    return null;
  }

  const payload = await verifyAccessToken(accessToken);
  if (!payload) {
    // Try refresh token
    const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
    if (!refreshToken) return null;

    const refreshPayload = await verifyRefreshToken(refreshToken);
    if (!refreshPayload) return null;

    // Refresh tokens would need to be set via API route
    // For now, just return null if access token is invalid
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });

  return user;
}

export async function setAuthCookies(accessToken: string, refreshToken: string) {
  const cookieStore = await cookies();

  cookieStore.set(ACCESS_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 15 * 60, // 15 minutes
    path: "/",
  });

  cookieStore.set(REFRESH_TOKEN_COOKIE, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: "/",
  });
}

export async function clearAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_TOKEN_COOKIE);
  cookieStore.delete(REFRESH_TOKEN_COOKIE);
}

export { createTokens, verifyAccessToken, verifyRefreshToken } from "./jwt";
export { getGoogleAuthUrl, getGoogleTokens, getGoogleUserInfo } from "./google";

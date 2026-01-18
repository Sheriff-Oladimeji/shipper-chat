import { NextRequest, NextResponse } from "next/server";
import { getGoogleTokens, getGoogleUserInfo, createTokens, setAuthCookies } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error)}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=No+code+provided", request.url)
    );
  }

  try {
    // Exchange code for tokens
    const tokens = await getGoogleTokens(code);

    // Get user info
    const googleUser = await getGoogleUserInfo(tokens.access_token);

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { googleId: googleUser.id },
    });

    if (!user) {
      // Check if user exists with same email
      user = await prisma.user.findUnique({
        where: { email: googleUser.email },
      });

      if (user) {
        // Link Google account to existing user
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: googleUser.id,
            image: googleUser.picture,
          },
        });
      } else {
        // Create new user
        user = await prisma.user.create({
          data: {
            email: googleUser.email,
            name: googleUser.name,
            image: googleUser.picture,
            googleId: googleUser.id,
          },
        });
      }
    }

    // Update online status
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isOnline: true,
        lastSeenAt: new Date(),
      },
    });

    // Create JWT tokens
    const { accessToken, refreshToken } = await createTokens(user.id, user.email);

    // Set cookies
    await setAuthCookies(accessToken, refreshToken);

    // Redirect to chat
    return NextResponse.redirect(new URL("/", request.url));
  } catch (err) {
    console.error("Google OAuth error:", err);
    return NextResponse.redirect(
      new URL("/login?error=Authentication+failed", request.url)
    );
  }
}

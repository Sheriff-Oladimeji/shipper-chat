import { NextRequest, NextResponse } from "next/server";
import { getGoogleTokens, getGoogleUserInfo, createTokens } from "@/lib/auth";
import prisma from "@/lib/db";

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
    } else {
      // Existing user - update profile picture if it changed
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          image: googleUser.picture,
          name: googleUser.name, // Also update name in case it changed
        },
      });
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

    // Redirect to chat with cookies set on response
    const response = NextResponse.redirect(new URL("/", request.url));

    response.cookies.set("access_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60, // 15 minutes
      path: "/",
    });

    response.cookies.set("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("Google OAuth error:", err);
    return NextResponse.redirect(
      new URL("/login?error=Authentication+failed", request.url)
    );
  }
}

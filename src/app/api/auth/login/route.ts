import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { attachSessionCookie, issueSession } from "@/lib/session";
import { toPublicUser } from "@/lib/auth-types";

const FAILURE_WINDOW_MS = 15 * 60 * 1000;
const LOCK_THRESHOLD = 5;

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();
  const cleanEmail = String(email || "").toLowerCase().trim();
  const cleanPassword = String(password || "");

  if (!cleanEmail || !cleanPassword) {
    return NextResponse.json({ message: "Email and password are required." }, { status: 400 });
  }

  const attempts = await prisma.loginAttempt.count({
    where: {
      email: cleanEmail,
      success: false,
      createdAt: { gte: new Date(Date.now() - FAILURE_WINDOW_MS) },
    },
  });

  if (attempts >= LOCK_THRESHOLD) {
    return NextResponse.json({ message: "Too many login attempts. Please wait a moment and try again." }, { status: 429 });
  }

  const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
  const passwordOk = user ? await bcrypt.compare(cleanPassword, user.passwordHash) : false;

  await prisma.loginAttempt.create({
    data: {
      id: crypto.randomUUID(),
      email: cleanEmail,
      userId: user?.id,
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null,
      success: Boolean(passwordOk),
    },
  });

  if (!user || !passwordOk) {
    return NextResponse.json({ message: "Invalid email or password." }, { status: 401 });
  }

  const { token, expiresAt } = await issueSession(user.id, user.communityId);
  const response = NextResponse.json({ user: toPublicUser(user) });
  attachSessionCookie(response, token, expiresAt);
  return response;
}

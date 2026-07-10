import "server-only";

import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, toPublicUser, type SessionUser } from "@/lib/auth-types";

export async function issueSession(userId: string, activeCommunityId: string | null = null) {
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  await prisma.session.create({
    data: {
      id: randomUUID(),
      token,
      userId,
      activeCommunityId,
      expiresAt,
      lastSeenAt: new Date(),
    },
  });

  return { token, expiresAt };
}

export function attachSessionCookie(response: NextResponse, token: string, expiresAt: Date) {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function getSessionFromRequest(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true, activeCommunity: true },
  });

  if (!session) return null;
  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.session.delete({ where: { token } }).catch(() => undefined);
    return null;
  }

  await prisma.session.update({
    where: { token },
    data: { lastSeenAt: new Date() },
  }).catch(() => undefined);

  return {
    session,
    user: toPublicUser(session.user),
    activeCommunityId: session.activeCommunityId ?? session.user.communityId,
  };
}

export async function getSessionFromCookiesStore() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true, activeCommunity: true },
  });

  if (!session || session.expiresAt.getTime() <= Date.now()) return null;

  return {
    session,
    user: toPublicUser(session.user),
    activeCommunityId: session.activeCommunityId ?? session.user.communityId,
  } satisfies { session: NonNullable<Awaited<ReturnType<typeof prisma.session.findUnique>>>; user: SessionUser; activeCommunityId: string };
}

export async function requireSession(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return { errorResponse: NextResponse.json({ message: "Authentication required." }, { status: 401 }) };
  }

  return session;
}

export async function setActiveCommunity(token: string, activeCommunityId: string) {
  await prisma.session.update({
    where: { token },
    data: { activeCommunityId },
  });
}

export async function deleteSession(token: string) {
  await prisma.session.delete({ where: { token } }).catch(() => undefined);
}

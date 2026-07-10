import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clearSessionCookie, getSessionFromRequest } from "@/lib/session";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ session: null }, { status: 200 });
  }

  return NextResponse.json({
    session: {
      user: session.user,
      activeCommunityId: session.activeCommunityId,
      expiresAt: session.session.expiresAt.toISOString(),
    },
  });
}

export async function PATCH(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const { activeCommunityId } = await request.json();
  const cleanCommunityId = String(activeCommunityId || "").trim();

  if (session.user.role !== "super-admin") {
    return NextResponse.json({ message: "Only super admins can switch communities." }, { status: 403 });
  }

  const community = await prisma.community.findUnique({ where: { id: cleanCommunityId } });
  if (!community) {
    return NextResponse.json({ message: "Community not found." }, { status: 404 });
  }

  await prisma.session.update({
    where: { token: session.session.token },
    data: { activeCommunityId: cleanCommunityId },
  });

  return NextResponse.json({ ok: true, activeCommunityId: cleanCommunityId });
}

export async function DELETE(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  const response = NextResponse.json({ ok: true });

  if (session) {
    await prisma.session.delete({ where: { token: session.session.token } }).catch(() => undefined);
  }

  clearSessionCookie(response);
  return response;
}

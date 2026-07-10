import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { attachSessionCookie, issueSession } from "@/lib/session";
import { toPublicUser } from "@/lib/auth-types";

export async function POST(request: NextRequest) {
  const { name, email, password, communityId, address } = await request.json();
  const cleanName = String(name || "").trim();
  const cleanEmail = String(email || "").toLowerCase().trim();
  const cleanPassword = String(password || "");
  const cleanCommunityId = String(communityId || "").trim();

  if (!cleanName || !cleanEmail || !cleanPassword || !cleanCommunityId) {
    return NextResponse.json({ message: "Name, email, password, and community are required." }, { status: 400 });
  }

  if (cleanPassword.length < 6) {
    return NextResponse.json({ message: "Password must be at least 6 characters long." }, { status: 400 });
  }

  const community = await prisma.community.findUnique({ where: { id: cleanCommunityId } });
  if (!community) {
    return NextResponse.json({ message: "Selected community was not found." }, { status: 404 });
  }

  const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
  if (existing) {
    return NextResponse.json({ message: "An account already exists for this email." }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: {
      id: crypto.randomUUID(),
      name: cleanName,
      email: cleanEmail,
      passwordHash: await bcrypt.hash(cleanPassword, 10),
      role: "RESIDENT",
      communityId: cleanCommunityId,
      address: JSON.stringify(address || {}),
      createdAt: new Date(),
      residentProfile: {
        create: {
          communityId: cleanCommunityId,
          name: cleanName,
          visible: false,
          area: "",
          contactPreference: "",
          updatedAt: new Date(),
        },
      },
    },
  });

  const { token, expiresAt } = await issueSession(user.id, user.communityId);
  const response = NextResponse.json({ user: toPublicUser(user) }, { status: 201 });
  attachSessionCookie(response, token, expiresAt);
  return response;
}

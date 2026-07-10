import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/session";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const contacts = await prisma.emergencyContact.findMany({
    where: { communityId: session.activeCommunityId },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ contacts });
}

export async function PATCH(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  if (session.user.role !== "admin" && session.user.role !== "super-admin") {
    return NextResponse.json({ message: "Only admins can update contacts." }, { status: 403 });
  }

  const { id, name, phone, detail } = await request.json();
  const contact = await prisma.emergencyContact.findUnique({ where: { id } });

  if (!contact || contact.communityId !== session.activeCommunityId) {
    return NextResponse.json({ message: "Contact not found." }, { status: 404 });
  }

  const updated = await prisma.emergencyContact.update({
    where: { id },
    data: {
      name: String(name || contact.name).trim(),
      phone: String(phone || contact.phone).trim(),
      detail: String(detail || contact.detail).trim(),
    },
  });

  return NextResponse.json({ contact: updated });
}

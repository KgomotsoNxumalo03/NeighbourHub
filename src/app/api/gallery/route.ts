import { NextRequest, NextResponse } from "next/server";
import { galleryCategories } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/session";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const url = new URL(request.url);
  const category = url.searchParams.get("category");
  const items = await prisma.galleryItem.findMany({
    where: {
      communityId: session.activeCommunityId,
      deletedAt: null,
      ...(category ? { category } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const body = await request.json();
  if (!galleryCategories.includes(body.category)) {
    return NextResponse.json({ message: "Invalid category." }, { status: 400 });
  }

  const title = String(body.title || "").trim();
  const imageName = String(body.imageName || "").trim();
  const description = String(body.description || "").trim();

  if (!title || !imageName) {
    return NextResponse.json({ message: "Title and image placeholder are required." }, { status: 400 });
  }

  const item = await prisma.galleryItem.create({
    data: {
      id: crypto.randomUUID(),
      communityId: session.activeCommunityId,
      title,
      category: body.category,
      imageName,
      description,
      uploadedBy: session.user.name,
    },
  });

  return NextResponse.json({ item }, { status: 201 });
}

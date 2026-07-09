import { NextRequest, NextResponse } from "next/server";
import { galleryCategories } from "@/lib/constants";
import { readData, writeData } from "@/lib/data-store";
import type { GalleryCategory, GalleryItem } from "@/lib/types";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const communityId = url.searchParams.get("communityId");
  const category = url.searchParams.get("category");
  const items = await readData("gallery");
  return NextResponse.json({ items: items.filter((item) => (communityId ? item.communityId === communityId : true)).filter((item) => (category ? item.category === category : true)).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)) });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (!galleryCategories.includes(body.category as GalleryCategory)) return NextResponse.json({ message: "Invalid category." }, { status: 400 });
  const item: GalleryItem = {
    id: crypto.randomUUID(),
    communityId: body.communityId || "community-oakridge",
    title: String(body.title || "").trim(),
    category: body.category,
    imageName: String(body.imageName || "").trim(),
    description: String(body.description || "").trim(),
    uploadedBy: body.uploadedBy || "Resident",
    createdAt: new Date().toISOString(),
  };
  if (!item.title || !item.imageName) return NextResponse.json({ message: "Title and image placeholder are required." }, { status: 400 });
  const items = await readData("gallery");
  items.push(item);
  await writeData("gallery", items);
  return NextResponse.json({ item }, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { businessCategories } from "@/lib/constants";
import { readData, writeData } from "@/lib/data-store";
import type { BusinessCategory, BusinessListing } from "@/lib/types";

export async function GET(request: NextRequest) {
  const communityId = new URL(request.url).searchParams.get("communityId");
  const includePending = new URL(request.url).searchParams.get("includePending") === "true";
  const businesses = await readData("businesses");
  return NextResponse.json({ businesses: businesses.filter((item) => (communityId ? item.communityId === communityId : true)).filter((item) => includePending || item.approved) });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (!businessCategories.includes(body.category as BusinessCategory)) return NextResponse.json({ message: "Invalid category." }, { status: 400 });
  const now = new Date().toISOString();
  const listing: BusinessListing = {
    id: crypto.randomUUID(),
    communityId: body.communityId || "community-oakridge",
    name: String(body.name || "").trim(),
    category: body.category,
    description: String(body.description || "").trim(),
    contact: String(body.contact || "").trim(),
    area: String(body.area || "").trim(),
    rating: 0,
    recommendedBy: [],
    approved: false,
    createdAt: now,
    updatedAt: now,
  };
  if (!listing.name || !listing.description || !listing.contact) return NextResponse.json({ message: "Name, description and contact are required." }, { status: 400 });
  const businesses = await readData("businesses");
  businesses.push(listing);
  await writeData("businesses", businesses);
  return NextResponse.json({ listing }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const { id, action, userId } = await request.json();
  const businesses = await readData("businesses");
  const listing = businesses.find((item) => item.id === id);
  if (!listing) return NextResponse.json({ message: "Listing not found." }, { status: 404 });
  if (action === "recommend" && !listing.recommendedBy.includes(userId)) listing.recommendedBy.push(userId);
  if (action === "approve") listing.approved = true;
  if (action === "remove") listing.approved = false;
  listing.updatedAt = new Date().toISOString();
  await writeData("businesses", businesses);
  return NextResponse.json({ listing });
}

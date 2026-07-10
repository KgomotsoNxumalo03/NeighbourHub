import { NextRequest, NextResponse } from "next/server";
import { businessCategories } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/session";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const includePending = new URL(request.url).searchParams.get("includePending") === "true";
  const businesses = await prisma.business.findMany({
    where: {
      communityId: session.activeCommunityId,
      deletedAt: null,
      ...(includePending ? {} : { approved: true }),
    },
    include: { recommendations: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    businesses: businesses.map((business) => ({
      id: business.id,
      communityId: business.communityId,
      name: business.name,
      category: business.category,
      description: business.description,
      contact: business.contact,
      area: business.area,
      rating: business.rating,
      recommendedBy: business.recommendations.map((item) => item.userId),
      approved: business.approved,
      createdAt: business.createdAt.toISOString(),
      updatedAt: business.updatedAt.toISOString(),
    })),
  });
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const body = await request.json();
  if (!businessCategories.includes(body.category)) {
    return NextResponse.json({ message: "Invalid category." }, { status: 400 });
  }

  const name = String(body.name || "").trim();
  const description = String(body.description || "").trim();
  const contact = String(body.contact || "").trim();
  const area = String(body.area || "").trim();

  if (!name || !description || !contact) {
    return NextResponse.json({ message: "Name, description and contact are required." }, { status: 400 });
  }

  const listing = await prisma.business.create({
    data: {
      id: crypto.randomUUID(),
      communityId: session.activeCommunityId,
      name,
      category: body.category,
      description,
      contact,
      area,
      rating: 0,
      approved: false,
    },
  });

  return NextResponse.json({
    listing: {
      ...listing,
      recommendedBy: [],
      createdAt: listing.createdAt.toISOString(),
      updatedAt: listing.updatedAt.toISOString(),
    },
  }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const { id, action } = await request.json();
  const listing = await prisma.business.findUnique({
    where: { id },
    include: { recommendations: true },
  });

  if (!listing || listing.communityId !== session.activeCommunityId) {
    return NextResponse.json({ message: "Listing not found." }, { status: 404 });
  }

  if (action === "recommend") {
    await prisma.businessRecommendation.upsert({
      where: {
        businessId_userId: {
          businessId: listing.id,
          userId: session.user.id,
        },
      },
      create: {
        id: crypto.randomUUID(),
        businessId: listing.id,
        userId: session.user.id,
      },
      update: {},
    });
  }

  if (action === "approve" || action === "remove") {
    if (session.user.role !== "admin" && session.user.role !== "super-admin") {
      return NextResponse.json({ message: "Only admins can approve or remove businesses." }, { status: 403 });
    }

    await prisma.business.update({
      where: { id: listing.id },
      data: { approved: action === "approve" },
    });
  }

  const updated = await prisma.business.findUnique({
    where: { id: listing.id },
    include: { recommendations: true },
  });

  return NextResponse.json({
    listing: {
      ...updated!,
      recommendedBy: updated?.recommendations.map((item) => item.userId) || [],
      createdAt: updated?.createdAt.toISOString() || new Date().toISOString(),
      updatedAt: updated?.updatedAt.toISOString() || new Date().toISOString(),
    },
  });
}

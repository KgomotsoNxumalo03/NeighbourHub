import { NextRequest, NextResponse } from "next/server";
import { lostFoundTypes, lostFoundStatuses } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/session";
import { toAppLostFoundStatus, toDbLostFoundStatus } from "@/lib/db-maps";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const reports = await prisma.lostFoundReport.findMany({
    where: { communityId: session.activeCommunityId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    reports: reports.map((report) => ({
      ...report,
      status: toAppLostFoundStatus(report.status),
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
    })),
  });
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const body = await request.json();
  const title = String(body.title || "").trim();
  const description = String(body.description || "").trim();
  const location = String(body.location || "").trim();
  const contactPreference = String(body.contactPreference || "").trim();

  if (!title || !description || !location || !contactPreference) {
    return NextResponse.json({ message: "Please complete all required fields." }, { status: 400 });
  }

  if (!lostFoundTypes.includes(body.type)) {
    return NextResponse.json({ message: "Invalid lost and found type." }, { status: 400 });
  }

  const report = await prisma.lostFoundReport.create({
    data: {
      id: crypto.randomUUID(),
      communityId: session.activeCommunityId,
      type: body.type,
      title,
      description,
      location,
      imageName: String(body.imageName || "").trim(),
      contactPreference,
      status: "OPEN",
      reporterId: session.user.id,
      reporterName: session.user.name,
    },
  });

  return NextResponse.json({
    report: {
      ...report,
      status: toAppLostFoundStatus(report.status),
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
    },
  }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  if (session.user.role !== "admin" && session.user.role !== "super-admin") {
    return NextResponse.json({ message: "Only admins can update lost and found items." }, { status: 403 });
  }

  const { id, status } = await request.json();
  const report = await prisma.lostFoundReport.findUnique({ where: { id } });

  if (!report || report.communityId !== session.activeCommunityId) {
    return NextResponse.json({ message: "Report not found." }, { status: 404 });
  }

  if (!lostFoundStatuses.includes(status)) {
    return NextResponse.json({ message: "Invalid status." }, { status: 400 });
  }

  const updated = await prisma.lostFoundReport.update({
    where: { id },
    data: { status: toDbLostFoundStatus(status) },
  });

  return NextResponse.json({
    report: {
      ...updated,
      status: toAppLostFoundStatus(updated.status),
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    },
  });
}

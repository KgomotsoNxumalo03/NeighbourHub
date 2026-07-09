import { NextRequest, NextResponse } from "next/server";
import { lostFoundStatuses, lostFoundTypes } from "@/lib/constants";
import { readData, writeData } from "@/lib/data-store";
import type { LostFoundReport, LostFoundStatus, LostFoundType } from "@/lib/types";

export async function GET(request: NextRequest) {
  const communityId = new URL(request.url).searchParams.get("communityId");
  const reports = await readData("lostFound");
  return NextResponse.json({ reports: reports.filter((report) => (communityId ? report.communityId === communityId : true)).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)) });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const title = String(body.title || "").trim();
  const description = String(body.description || "").trim();
  const location = String(body.location || "").trim();
  const contactPreference = String(body.contactPreference || "").trim();

  if (!title || !description || !location || !contactPreference) {
    return NextResponse.json({ message: "Please complete all required fields." }, { status: 400 });
  }

  if (!lostFoundTypes.includes(body.type as LostFoundType)) {
    return NextResponse.json({ message: "Invalid lost and found type." }, { status: 400 });
  }

  const now = new Date().toISOString();
  const report: LostFoundReport = {
    id: crypto.randomUUID(),
    communityId: body.communityId || "community-oakridge",
    type: body.type,
    title,
    description,
    location,
    imageName: String(body.imageName || "").trim(),
    contactPreference,
    status: "Open",
    reporterId: body.reporterId,
    reporterName: body.reporterName,
    createdAt: now,
    updatedAt: now,
  };

  const reports = await readData("lostFound");
  reports.push(report);
  await writeData("lostFound", reports);
  return NextResponse.json({ report }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const { id, status } = await request.json();
  const reports = await readData("lostFound");
  const report = reports.find((item) => item.id === id);

  if (!report) return NextResponse.json({ message: "Report not found." }, { status: 404 });
  if (!lostFoundStatuses.includes(status as LostFoundStatus)) {
    return NextResponse.json({ message: "Invalid status." }, { status: 400 });
  }

  report.status = status;
  report.updatedAt = new Date().toISOString();
  await writeData("lostFound", reports);
  return NextResponse.json({ report });
}

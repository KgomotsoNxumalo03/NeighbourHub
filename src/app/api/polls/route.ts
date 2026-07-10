import { NextRequest, NextResponse } from "next/server";
import { pollStatuses } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/session";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const polls = await prisma.poll.findMany({
    where: { communityId: session.activeCommunityId, deletedAt: null },
    include: { options: { include: { votes: true }, orderBy: { sortOrder: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    polls: polls.map((poll) => ({
      id: poll.id,
      communityId: poll.communityId,
      question: poll.question,
      options: poll.options.map((option) => ({
        id: option.id,
        label: option.label,
        votes: option.votes.map((vote) => vote.userId),
      })),
      status: poll.status === "ACTIVE" ? "Active" : "Closed",
      createdBy: poll.createdBy,
      createdAt: poll.createdAt.toISOString(),
      updatedAt: poll.updatedAt.toISOString(),
    })),
  });
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  if (session.user.role !== "admin" && session.user.role !== "super-admin") {
    return NextResponse.json({ message: "Only admins can create polls." }, { status: 403 });
  }

  const body = await request.json();
  const question = String(body.question || "").trim();
  const options = String(body.options || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

  if (!question || options.length < 2) {
    return NextResponse.json({ message: "A question and at least two options are required." }, { status: 400 });
  }

  const poll = await prisma.poll.create({
    data: {
      id: crypto.randomUUID(),
      communityId: session.activeCommunityId,
      question,
      status: "ACTIVE",
      createdBy: session.user.id,
      options: {
        create: options.map((label, index) => ({
          id: crypto.randomUUID(),
          label,
          sortOrder: index,
        })),
      },
    },
    include: { options: true },
  });

  return NextResponse.json({
    poll: {
      id: poll.id,
      communityId: poll.communityId,
      question: poll.question,
      options: poll.options.map((option) => ({ id: option.id, label: option.label, votes: [] })),
      status: "Active",
      createdBy: poll.createdBy,
      createdAt: poll.createdAt.toISOString(),
      updatedAt: poll.updatedAt.toISOString(),
    },
  }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const { id, optionId, status } = await request.json();
  const poll = await prisma.poll.findUnique({
    where: { id },
    include: { options: { include: { votes: true }, orderBy: { sortOrder: "asc" } } },
  });

  if (!poll || poll.communityId !== session.activeCommunityId) {
    return NextResponse.json({ message: "Poll not found." }, { status: 404 });
  }

  if (status) {
    if (session.user.role !== "admin" && session.user.role !== "super-admin") {
      return NextResponse.json({ message: "Only admins can update poll status." }, { status: 403 });
    }

    if (!pollStatuses.includes(status)) {
      return NextResponse.json({ message: "Invalid poll status." }, { status: 400 });
    }

    await prisma.poll.update({
      where: { id: poll.id },
      data: { status: status === "Active" ? "ACTIVE" : "CLOSED" },
    });
  }

  if (optionId && poll.status === "ACTIVE") {
    const selectedOption = poll.options.find((option) => option.id === optionId);
    if (!selectedOption) {
      return NextResponse.json({ message: "Invalid poll option." }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.pollVote.deleteMany({
        where: { pollId: poll.id, userId: session.user.id },
      });

      await tx.pollVote.create({
        data: {
          id: crypto.randomUUID(),
          pollId: poll.id,
          pollOptionId: optionId,
          userId: session.user.id,
        },
      });
    });
  }

  const updatedPoll = await prisma.poll.findUnique({
    where: { id: poll.id },
    include: { options: { include: { votes: true }, orderBy: { sortOrder: "asc" } } },
  });

  return NextResponse.json({
    poll: {
      id: updatedPoll!.id,
      communityId: updatedPoll!.communityId,
      question: updatedPoll!.question,
      options: updatedPoll!.options.map((option) => ({
        id: option.id,
        label: option.label,
        votes: option.votes.map((vote) => vote.userId),
      })),
      status: updatedPoll!.status === "ACTIVE" ? "Active" : "Closed",
      createdBy: updatedPoll!.createdBy,
      createdAt: updatedPoll!.createdAt.toISOString(),
      updatedAt: updatedPoll!.updatedAt.toISOString(),
    },
  });
}

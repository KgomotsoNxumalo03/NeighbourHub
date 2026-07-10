import { NextRequest, NextResponse } from "next/server";
import { ticketCategories, ticketPriorities, ticketStatuses } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/session";
import {
  toAppTicketActivityType,
  toAppTicketPriority,
  toAppTicketStatus,
  toDbTicketPriority,
  toDbTicketStatus,
} from "@/lib/db-maps";
import { formatTicketReference, sortTickets } from "@/lib/tickets";
import type { Ticket } from "@/lib/types";

function serializeTicket(ticket: {
  id: string;
  communityId: string;
  reference: string;
  userId: string;
  residentName: string;
  title: string;
  description: string;
  category: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "EMERGENCY";
  location: string;
  imageName: string;
  imagePreview: string;
  status: "NEW" | "ACKNOWLEDGED" | "ASSIGNED" | "OPEN" | "IN_PROGRESS" | "WAITING_ON_RESIDENT" | "WAITING_ON_CONTRACTOR" | "RESOLVED" | "CLOSED" | "REOPENED";
  ownerName: string;
  estimatedCompletionAt: Date | null;
  resolutionNotes: string;
  adminNotes: string;
  createdAt: Date;
  updatedAt: Date;
  comments: {
    id: string;
    authorId: string | null;
    authorName: string;
    authorRole: "RESIDENT" | "ADMIN" | "SUPER_ADMIN";
    body: string;
    createdAt: Date;
  }[];
  activities: {
    id: string;
    type: "CREATED" | "STATUS" | "COMMENT" | "ADMIN_NOTE" | "REOPENED";
    message: string;
    actor: string;
    createdAt: Date;
  }[];
  supports: { userId: string }[];
  adminNotesHistory: {
    id: string;
    note: string;
    actor: string;
    createdAt: Date;
  }[];
}): Ticket {
  return {
    id: ticket.id,
    communityId: ticket.communityId,
    reference: ticket.reference,
    userId: ticket.userId,
    residentName: ticket.residentName,
    title: ticket.title,
    description: ticket.description,
    category: ticket.category as Ticket["category"],
    priority: toAppTicketPriority(ticket.priority),
    location: ticket.location,
    imageName: ticket.imageName,
    imagePreview: ticket.imagePreview,
    status: toAppTicketStatus(ticket.status),
    ownerName: ticket.ownerName,
    supporters: ticket.supports.map((support) => support.userId),
    estimatedCompletionAt: ticket.estimatedCompletionAt ? ticket.estimatedCompletionAt.toISOString() : "",
    resolutionNotes: ticket.resolutionNotes,
    adminNotes: ticket.adminNotes,
    adminNotesHistory: ticket.adminNotesHistory.map((note) => ({
      id: note.id,
      note: note.note,
      actor: note.actor,
      createdAt: note.createdAt.toISOString(),
    })),
    comments: ticket.comments.map((comment) => ({
      id: comment.id,
      authorId: comment.authorId || "",
      authorName: comment.authorName,
      authorRole: comment.authorRole === "ADMIN" ? "admin" : comment.authorRole === "SUPER_ADMIN" ? "super-admin" : "resident",
      body: comment.body,
      createdAt: comment.createdAt.toISOString(),
    })),
    timeline: ticket.activities.map((activity) => ({
      id: activity.id,
      type: toAppTicketActivityType(activity.type),
      message: activity.message,
      actor: activity.actor,
      createdAt: activity.createdAt.toISOString(),
    })),
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
  };
}

function ticketInclude() {
  return {
    comments: { orderBy: { createdAt: "asc" as const } },
    activities: { orderBy: { createdAt: "asc" as const } },
    supports: true,
    adminNotesHistory: { orderBy: { createdAt: "asc" as const } },
  };
}

async function getTicketOrNull(ticketId: string, communityId: string, userRole: string, userId: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: ticketInclude(),
  });

  if (!ticket || ticket.communityId !== communityId) return null;
  if (userRole === "resident" && ticket.userId !== userId) return null;
  return serializeTicket(ticket as Parameters<typeof serializeTicket>[0]);
}

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const category = searchParams.get("category");
  const priority = searchParams.get("priority");
  const search = searchParams.get("search")?.toLowerCase().trim();
  const sortBy = searchParams.get("sort") || "updated";
  const ticketId = searchParams.get("id");

  if (ticketId) {
    const ticket = await getTicketOrNull(ticketId, session.activeCommunityId, session.user.role, session.user.id);
    return NextResponse.json({ tickets: ticket ? [ticket] : [] });
  }

  const tickets = await prisma.ticket.findMany({
    where: {
      communityId: session.activeCommunityId,
      deletedAt: null,
      ...(session.user.role === "resident" ? { userId: session.user.id } : {}),
    },
    include: ticketInclude(),
    orderBy: { updatedAt: "desc" },
  });

  const mapped = tickets
    .map((ticket) => serializeTicket(ticket as Parameters<typeof serializeTicket>[0]))
    .filter((ticket) => (status ? ticket.status === status : true))
    .filter((ticket) => (category ? ticket.category === category : true))
    .filter((ticket) => (priority ? ticket.priority === priority : true))
    .filter((ticket) => {
      if (!search) return true;
      return [
        ticket.reference,
        ticket.title,
        ticket.description,
        ticket.location,
        ticket.category,
        ticket.residentName,
        ticket.status,
        ticket.priority,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search);
    });

  return NextResponse.json({ tickets: sortTickets(mapped, sortBy) });
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

  if (!title || !description || !location) {
    return NextResponse.json({ message: "Please complete all required ticket fields." }, { status: 400 });
  }

  if (!ticketCategories.includes(body.category)) {
    return NextResponse.json({ message: "Invalid ticket category." }, { status: 400 });
  }

  if (!ticketPriorities.includes(body.priority)) {
    return NextResponse.json({ message: "Invalid ticket priority." }, { status: 400 });
  }

  const referenceCount = await prisma.ticket.count({
    where: { communityId: session.activeCommunityId },
  });
  const now = new Date();

  const ticket = await prisma.$transaction(async (tx) => {
    const created = await tx.ticket.create({
      data: {
        id: crypto.randomUUID(),
        communityId: session.activeCommunityId,
        reference: formatTicketReference(referenceCount),
        userId: session.user.id,
        residentName: session.user.name,
        title,
        description,
        category: body.category,
        priority: toDbTicketPriority(body.priority),
        location,
        imageName: String(body.imageName || "").trim(),
        imagePreview: String(body.imagePreview || body.imageName || "").trim(),
        status: "NEW",
        ownerName: "Unassigned",
        resolutionNotes: "",
        adminNotes: "",
      },
    });

    await tx.ticketActivity.create({
      data: {
        id: crypto.randomUUID(),
        ticketId: created.id,
        type: "CREATED",
        message: `Ticket ${created.reference} created`,
        actor: session.user.name,
      },
    });

    return created;
  });

  const fullTicket = await prisma.ticket.findUnique({
    where: { id: ticket.id },
    include: ticketInclude(),
  });

  return NextResponse.json({ ticket: serializeTicket(fullTicket as Parameters<typeof serializeTicket>[0]) }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const {
    id,
    status,
    adminNotes,
    action,
    comment,
    actorName,
    actorRole,
    actorId,
    ownerName,
    estimatedCompletionAt,
    resolutionNotes,
  } = await request.json();

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: ticketInclude(),
  });

  if (!ticket || ticket.communityId !== session.activeCommunityId) {
    return NextResponse.json({ message: "Ticket not found." }, { status: 404 });
  }

  const actor = String(actorName || session.user.name || "NeighbourHub");
  const isAdmin = session.user.role === "admin" || session.user.role === "super-admin";
  const isOwner = ticket.userId === session.user.id;
  const currentStatus = toAppTicketStatus(ticket.status);

  if (status && !ticketStatuses.includes(status)) {
    return NextResponse.json({ message: "Invalid ticket status." }, { status: 400 });
  }

  const updatedTicket = await prisma.$transaction(async (tx) => {
    if (action === "comment") {
      const bodyText = String(comment || "").trim();
      if (!bodyText) {
        throw new Error("Comment cannot be blank.");
      }

      if (!isAdmin && !isOwner) {
        throw new Error("Not authorized.");
      }

      await tx.ticketComment.create({
        data: {
          id: crypto.randomUUID(),
          ticketId: ticket.id,
          authorId: actorId || session.user.id,
          authorName: actor,
          authorRole: session.user.role === "admin" ? "ADMIN" : session.user.role === "super-admin" ? "SUPER_ADMIN" : "RESIDENT",
          body: bodyText,
        },
      });

      await tx.ticketActivity.create({
        data: {
          id: crypto.randomUUID(),
          ticketId: ticket.id,
          type: "COMMENT",
          message: "Comment added",
          actor,
        },
      });

      if (isAdmin) {
        await tx.notification.create({
          data: {
            id: crypto.randomUUID(),
            communityId: ticket.communityId,
            userId: ticket.userId,
            type: "ADMIN_COMMENT",
            title: `${ticket.reference}: new admin comment`,
            body: bodyText,
            href: `/tickets/${ticket.id}`,
          },
        });
      }

      await tx.ticket.update({
        where: { id: ticket.id },
        data: { ownerName: ticket.ownerName },
      });
    }

    if (action === "reopen") {
      if (!isOwner) {
        throw new Error("Not authorized.");
      }
      if (ticket.status !== "RESOLVED" && ticket.status !== "CLOSED") {
        throw new Error("Only resolved or closed tickets can be reopened.");
      }

      await tx.ticket.update({
        where: { id: ticket.id },
        data: { status: "REOPENED" },
      });

      await tx.ticketActivity.create({
        data: {
          id: crypto.randomUUID(),
          ticketId: ticket.id,
          type: "REOPENED",
          message: "Ticket reopened by resident",
          actor,
        },
      });

      await tx.ticket.update({
        where: { id: ticket.id },
        data: { ownerName: ticket.ownerName },
      });
    }

    if (action === "support") {
      if (!session.user.id) {
        throw new Error("Not authorized.");
      }

      const existingSupport = await tx.ticketSupport.findUnique({
        where: {
          ticketId_userId: {
            ticketId: ticket.id,
            userId: session.user.id,
          },
        },
      });

      if (existingSupport) {
        await tx.ticketSupport.delete({
          where: {
            ticketId_userId: {
              ticketId: ticket.id,
              userId: session.user.id,
            },
          },
        });
      } else {
        await tx.ticketSupport.create({
          data: {
            id: crypto.randomUUID(),
            ticketId: ticket.id,
            userId: session.user.id,
          },
        });
      }

      await tx.ticketActivity.create({
        data: {
          id: crypto.randomUUID(),
          ticketId: ticket.id,
          type: "COMMENT",
          message: "Resident marked as affected",
          actor,
        },
      });

      await tx.ticket.update({
        where: { id: ticket.id },
        data: { ownerName: ticket.ownerName },
      });
    }

    if (action === "confirm-resolution") {
      if (!isOwner) {
        throw new Error("Not authorized.");
      }

      await tx.ticket.update({
        where: { id: ticket.id },
        data: { status: "CLOSED" },
      });

      await tx.ticketActivity.create({
        data: {
          id: crypto.randomUUID(),
          ticketId: ticket.id,
          type: "STATUS",
          message: "Resident confirmed resolution",
          actor,
        },
      });

      await tx.ticket.update({
        where: { id: ticket.id },
        data: { ownerName: ticket.ownerName },
      });
    }

    if (isAdmin && typeof ownerName === "string" && ownerName.trim() && ownerName.trim() !== ticket.ownerName) {
      await tx.ticket.update({
        where: { id: ticket.id },
        data: { ownerName: ownerName.trim() },
      });

      await tx.ticketActivity.create({
        data: {
          id: crypto.randomUUID(),
          ticketId: ticket.id,
          type: "STATUS",
          message: `Assigned to ${ownerName.trim()}`,
          actor,
        },
      });

      await tx.auditLog.create({
        data: {
          id: crypto.randomUUID(),
          userId: session.user.id,
          communityId: ticket.communityId,
          action: "ticket.assignment",
          entityType: "Ticket",
          entityId: ticket.id,
          details: JSON.stringify({ ownerName: ownerName.trim() }),
        },
      });
    }

    if (isAdmin && typeof estimatedCompletionAt === "string") {
      await tx.ticket.update({
        where: { id: ticket.id },
        data: { estimatedCompletionAt: estimatedCompletionAt ? new Date(estimatedCompletionAt) : null },
      });
    }

    if (isAdmin && typeof resolutionNotes === "string") {
      await tx.ticket.update({
        where: { id: ticket.id },
        data: { resolutionNotes: resolutionNotes.trim() },
      });
    }

    if (status && status !== currentStatus) {
      if (!isAdmin) {
        throw new Error("Not authorized.");
      }

      const previous = currentStatus;
      await tx.ticket.update({
        where: { id: ticket.id },
        data: { status: toDbTicketStatus(status) },
      });

      await tx.ticketActivity.create({
        data: {
          id: crypto.randomUUID(),
          ticketId: ticket.id,
          type: "STATUS",
          message: `Status changed from ${toAppTicketStatus(previous)} to ${status}`,
          actor,
        },
      });

      await tx.notification.create({
        data: {
          id: crypto.randomUUID(),
          communityId: ticket.communityId,
          userId: ticket.userId,
          type: "TICKET_STATUS_UPDATE",
          title: `${ticket.reference}: status updated`,
          body: `Your ticket is now ${status}.`,
          href: `/tickets/${ticket.id}`,
        },
      });

      await tx.auditLog.create({
        data: {
          id: crypto.randomUUID(),
          userId: session.user.id,
          communityId: ticket.communityId,
          action: "ticket.status",
          entityType: "Ticket",
          entityId: ticket.id,
          details: JSON.stringify({ previous, next: status }),
        },
      });
    }

    if (isAdmin && typeof adminNotes === "string") {
      const note = adminNotes.trim();
      if (note && note !== ticket.adminNotes) {
        await tx.ticketAdminNote.create({
          data: {
            id: crypto.randomUUID(),
            ticketId: ticket.id,
            note,
            actor,
          },
        });

        await tx.ticketActivity.create({
          data: {
            id: crypto.randomUUID(),
            ticketId: ticket.id,
            type: "ADMIN_NOTE",
            message: "Admin note added",
            actor,
          },
        });
      }

      await tx.ticket.update({
        where: { id: ticket.id },
        data: { adminNotes: note },
      });
    }

    return tx.ticket.findUnique({
      where: { id: ticket.id },
      include: ticketInclude(),
    });
  }).catch((error) => {
    if (error instanceof Error) {
      return error;
    }
    return null;
  });

  if (updatedTicket instanceof Error) {
    return NextResponse.json({ message: updatedTicket.message }, { status: updatedTicket.message === "Not authorized." ? 403 : 400 });
  }

  if (!updatedTicket) {
    return NextResponse.json({ message: "Unable to update ticket." }, { status: 400 });
  }

  return NextResponse.json({ ticket: serializeTicket(updatedTicket as Parameters<typeof serializeTicket>[0]) });
}

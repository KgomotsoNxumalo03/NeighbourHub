const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const dataDir = path.join(process.cwd(), "data");

function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(dataDir, name), "utf8"));
}

function toDate(value, fallback = new Date()) {
  if (!value) return new Date(fallback);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date(fallback) : date;
}

function toCommunityType(value) {
  return {
    "General Neighbourhood": "GENERAL_NEIGHBOURHOOD",
    "Residential Estate": "RESIDENTIAL_ESTATE",
    "Gated Community": "GATED_COMMUNITY",
    "Apartment Complex": "APARTMENT_COMPLEX",
    "Townhouse Complex": "TOWNHOUSE_COMPLEX",
    "Retirement Village": "RETIREMENT_VILLAGE",
  }[value] || "GENERAL_NEIGHBOURHOOD";
}

function toRole(value) {
  return {
    resident: "RESIDENT",
    admin: "ADMIN",
    "super-admin": "SUPER_ADMIN",
  }[value] || "RESIDENT";
}

function toTicketPriority(value) {
  return { Low: "LOW", Medium: "MEDIUM", High: "HIGH", Emergency: "EMERGENCY" }[value] || "LOW";
}

function toTicketStatus(value) {
  return {
    New: "NEW",
    Acknowledged: "ACKNOWLEDGED",
    Assigned: "ASSIGNED",
    Open: "OPEN",
    "In Progress": "IN_PROGRESS",
    "Waiting on Resident": "WAITING_ON_RESIDENT",
    "Waiting on Contractor": "WAITING_ON_CONTRACTOR",
    Resolved: "RESOLVED",
    Closed: "CLOSED",
    Reopened: "REOPENED",
  }[value] || "NEW";
}

function toAnnouncementPriority(value) {
  return { Normal: "NORMAL", Important: "IMPORTANT", Emergency: "EMERGENCY" }[value] || "NORMAL";
}

function toCommunityStatusLevel(value) {
  return { Normal: "NORMAL", Warning: "WARNING", Critical: "CRITICAL" }[value] || "NORMAL";
}

function toPollStatus(value) {
  return { Active: "ACTIVE", Closed: "CLOSED" }[value] || "ACTIVE";
}

function toLostFoundStatus(value) {
  return { Open: "OPEN", Claimed: "CLAIMED", Resolved: "RESOLVED" }[value] || "OPEN";
}

function toTicketActivityType(value) {
  return {
    created: "CREATED",
    status: "STATUS",
    comment: "COMMENT",
    "admin-note": "ADMIN_NOTE",
    reopened: "REOPENED",
  }[value] || "COMMENT";
}

function toNotificationType(value) {
  return {
    "Emergency announcement": "EMERGENCY_ANNOUNCEMENT",
    "Ticket status update": "TICKET_STATUS_UPDATE",
    "Admin comment": "ADMIN_COMMENT",
    "Upcoming event": "UPCOMING_EVENT",
    "Community status change": "COMMUNITY_STATUS_CHANGE",
  }[value] || "TICKET_STATUS_UPDATE";
}

async function resetDatabase() {
  await prisma.notificationRead.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.uploadAsset.deleteMany();
  await prisma.loginAttempt.deleteMany();
  await prisma.pollVote.deleteMany();
  await prisma.pollOption.deleteMany();
  await prisma.poll.deleteMany();
  await prisma.businessRecommendation.deleteMany();
  await prisma.business.deleteMany();
  await prisma.groupMembership.deleteMany();
  await prisma.volunteerGroup.deleteMany();
  await prisma.galleryItem.deleteMany();
  await prisma.eventRsvp.deleteMany();
  await prisma.event.deleteMany();
  await prisma.feedLike.deleteMany();
  await prisma.feedComment.deleteMany();
  await prisma.feedPost.deleteMany();
  await prisma.lostFoundReport.deleteMany();
  await prisma.ticketSupport.deleteMany();
  await prisma.ticketAdminNote.deleteMany();
  await prisma.ticketActivity.deleteMany();
  await prisma.ticketComment.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.communityStatus.deleteMany();
  await prisma.emergencyContact.deleteMany();
  await prisma.residentProfile.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.community.deleteMany();
}

async function main() {
  const communities = readJson("communities.json");
  const users = readJson("users.json");
  const tickets = readJson("tickets.json");
  const announcements = readJson("announcements.json");
  const contacts = readJson("contacts.json");
  const communityStatus = readJson("communityStatus.json");
  const feedPosts = readJson("feedPosts.json");
  const lostFound = readJson("lostFound.json");
  const events = readJson("events.json");
  const notifications = readJson("notifications.json");
  const residentProfiles = readJson("residentProfiles.json");
  const polls = readJson("polls.json");
  const businesses = readJson("businesses.json");
  const groups = readJson("groups.json");
  const gallery = readJson("gallery.json");

  await resetDatabase();

  for (const community of communities) {
    await prisma.community.create({
      data: {
        id: community.id,
        name: community.name,
        communityType: toCommunityType(community.communityType),
        suburb: community.suburb,
        city: community.city,
        province: community.province,
        postalCode: community.postalCode,
        logo: community.logo,
        coverImage: community.coverImage,
        primaryColour: community.primaryColour,
        description: community.description,
        createdAt: toDate(community.createdAt),
        updatedAt: toDate(community.updatedAt, community.createdAt),
      },
    });
  }

  for (const user of users) {
    await prisma.user.create({
      data: {
        id: user.id,
        name: user.name,
        email: user.email.toLowerCase(),
        passwordHash: await bcrypt.hash(user.password, 10),
        role: toRole(user.role),
        communityId: user.communityId,
        address: JSON.stringify(user.address || {}),
        createdAt: toDate(user.createdAt),
      },
    });
  }

  for (const profile of residentProfiles) {
    await prisma.residentProfile.create({
      data: {
        userId: profile.userId,
        communityId: profile.communityId,
        name: profile.name,
        visible: profile.visible,
        area: profile.area,
        contactPreference: profile.contactPreference,
        updatedAt: toDate(profile.updatedAt),
      },
    });
  }

  for (const item of communityStatus) {
    await prisma.communityStatus.create({
      data: {
        id: item.id,
        communityId: item.communityId,
        name: item.name,
        level: toCommunityStatusLevel(item.level),
        status: item.status,
        detail: item.detail,
        createdAt: toDate(item.updatedAt || new Date().toISOString()),
        updatedAt: toDate(item.updatedAt || new Date().toISOString()),
      },
    });
  }

  for (const contact of contacts) {
    await prisma.emergencyContact.create({
      data: {
        id: contact.id,
        communityId: contact.communityId,
        name: contact.name,
        phone: contact.phone,
        detail: contact.detail,
      },
    });
  }

  for (const announcement of announcements) {
    await prisma.announcement.create({
      data: {
        id: announcement.id,
        communityId: announcement.communityId,
        title: announcement.title,
        body: announcement.body,
        audience: announcement.audience,
        priority: toAnnouncementPriority(announcement.priority),
        expiresAt: new Date(`${announcement.expiresAt}T23:59:59.000Z`),
        createdAt: toDate(announcement.createdAt),
        updatedAt: toDate(announcement.updatedAt || announcement.createdAt),
      },
    });
  }

  for (const post of feedPosts) {
    await prisma.feedPost.create({
      data: {
        id: post.id,
        communityId: post.communityId,
        type: post.type,
        title: post.title,
        body: post.body,
        authorId: post.authorId,
        authorName: post.authorName,
        authorRole: toRole(post.authorRole),
        pinned: Boolean(post.pinned),
        createdAt: toDate(post.createdAt),
        updatedAt: toDate(post.updatedAt || post.createdAt),
        comments: {
          create: (post.comments || []).map((comment) => ({
            id: comment.id,
            authorId: comment.authorId,
            authorName: comment.authorName,
            body: comment.body,
            createdAt: toDate(comment.createdAt),
          })),
        },
        likes: {
          create: (post.likes || []).map((userId) => ({
            id: `like-${post.id}-${userId}`,
            userId,
            createdAt: toDate(post.updatedAt || post.createdAt),
          })),
        },
      },
    });
  }

  for (const item of lostFound) {
    await prisma.lostFoundReport.create({
      data: {
        id: item.id,
        communityId: item.communityId,
        type: item.type,
        title: item.title,
        description: item.description,
        location: item.location,
        imageName: item.imageName || "",
        contactPreference: item.contactPreference,
        status: toLostFoundStatus(item.status),
        reporterId: item.reporterId,
        reporterName: item.reporterName,
        createdAt: toDate(item.createdAt),
        updatedAt: toDate(item.updatedAt || item.createdAt),
      },
    });
  }

  for (const event of events) {
    await prisma.event.create({
      data: {
        id: event.id,
        communityId: event.communityId,
        title: event.title,
        description: event.description,
        date: event.date,
        time: event.time,
        location: event.location,
        category: event.category,
        createdBy: event.createdBy,
        createdAt: toDate(event.createdAt),
        updatedAt: toDate(event.updatedAt || event.createdAt),
        rsvps: {
          create: (event.rsvps || []).map((userId) => ({
            id: `rsvp-${event.id}-${userId}`,
            userId,
            createdAt: toDate(event.updatedAt || event.createdAt),
          })),
        },
      },
    });
  }

  for (const notification of notifications) {
    await prisma.notification.create({
      data: {
        id: notification.id,
        communityId: notification.communityId,
        userId: notification.userId,
        type: toNotificationType(notification.type),
        title: notification.title,
        body: notification.body,
        href: notification.href,
        createdAt: toDate(notification.createdAt),
        reads: {
          create: (notification.readBy || []).map((userId) => ({
            id: `read-${notification.id}-${userId}`,
            userId,
            createdAt: toDate(notification.createdAt),
          })),
        },
      },
    });
  }

  for (const poll of polls) {
    await prisma.poll.create({
      data: {
        id: poll.id,
        communityId: poll.communityId,
        question: poll.question,
        status: toPollStatus(poll.status),
        createdBy: poll.createdBy,
        createdAt: toDate(poll.createdAt),
        updatedAt: toDate(poll.updatedAt || poll.createdAt),
        options: {
          create: (poll.options || []).map((option, index) => ({
            id: option.id,
            label: option.label,
            sortOrder: index,
            createdAt: toDate(poll.createdAt),
            votes: {
              create: (option.votes || []).map((userId) => ({
                id: `vote-${poll.id}-${option.id}-${userId}`,
                pollId: poll.id,
                userId,
                createdAt: toDate(poll.updatedAt || poll.createdAt),
              })),
            },
          })),
        },
      },
    });
  }

  for (const business of businesses) {
    await prisma.business.create({
      data: {
        id: business.id,
        communityId: business.communityId,
        name: business.name,
        category: business.category,
        description: business.description,
        contact: business.contact,
        area: business.area,
        rating: business.rating,
        approved: business.approved,
        createdAt: toDate(business.createdAt),
        updatedAt: toDate(business.updatedAt || business.createdAt),
        recommendations: {
          create: (business.recommendedBy || []).map((userId) => ({
            id: `business-rec-${business.id}-${userId}`,
            userId,
            createdAt: toDate(business.updatedAt || business.createdAt),
          })),
        },
      },
    });
  }

  for (const group of groups) {
    await prisma.volunteerGroup.create({
      data: {
        id: group.id,
        communityId: group.communityId,
        name: group.name,
        description: group.description,
        upcomingActivity: group.upcomingActivity,
        createdAt: toDate(group.createdAt),
        members: {
          create: (group.members || []).map((userId) => ({
            id: `group-member-${group.id}-${userId}`,
            userId,
            createdAt: toDate(group.createdAt),
          })),
        },
      },
    });
  }

  for (const item of gallery) {
    await prisma.galleryItem.create({
      data: {
        id: item.id,
        communityId: item.communityId,
        title: item.title,
        category: item.category,
        imageName: item.imageName,
        description: item.description,
        uploadedBy: item.uploadedBy,
        createdAt: toDate(item.createdAt),
      },
    });
  }

  for (const ticket of tickets) {
    await prisma.ticket.create({
      data: {
        id: ticket.id,
        communityId: ticket.communityId,
        reference: ticket.reference,
        userId: ticket.userId,
        residentName: ticket.residentName,
        title: ticket.title,
        description: ticket.description,
        category: ticket.category,
        priority: toTicketPriority(ticket.priority),
        location: ticket.location,
        imageName: ticket.imageName || "",
        imagePreview: ticket.imagePreview || ticket.imageName || "",
        status: toTicketStatus(ticket.status),
        ownerName: ticket.ownerName || "Unassigned",
        estimatedCompletionAt: ticket.estimatedCompletionAt ? new Date(ticket.estimatedCompletionAt) : null,
        resolutionNotes: ticket.resolutionNotes || "",
        adminNotes: ticket.adminNotes || "",
        createdAt: toDate(ticket.createdAt),
        updatedAt: toDate(ticket.updatedAt || ticket.createdAt),
        comments: {
          create: (ticket.comments || []).map((comment) => ({
            id: comment.id,
            authorId: comment.authorId,
            authorName: comment.authorName,
            authorRole: toRole(comment.authorRole),
            body: comment.body,
            createdAt: toDate(comment.createdAt),
          })),
        },
        activities: {
          create: (ticket.timeline || []).map((activity) => ({
            id: activity.id,
            type: toTicketActivityType(activity.type),
            message: activity.message,
            actor: activity.actor,
            createdAt: toDate(activity.createdAt),
          })),
        },
        supports: {
          create: (ticket.supporters || []).map((userId) => ({
            id: `ticket-support-${ticket.id}-${userId}`,
            userId,
            createdAt: toDate(ticket.updatedAt || ticket.createdAt),
          })),
        },
        adminNotesHistory: {
          create: (ticket.adminNotesHistory || []).map((note) => ({
            id: note.id,
            note: note.note,
            actor: note.actor,
            createdAt: toDate(note.createdAt),
          })),
        },
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

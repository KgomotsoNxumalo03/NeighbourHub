import type {
  AnnouncementPriority,
  CommunityStatusLevel,
  CommunityType,
  LostFoundStatus,
  PollStatus,
  Role,
  TicketActivity,
  TicketPriority,
  TicketStatus,
} from "@/lib/types";
import type {
  AnnouncementPriority as DbAnnouncementPriority,
  CommunityStatusLevel as DbCommunityStatusLevel,
  CommunityType as DbCommunityType,
  LostFoundStatus as DbLostFoundStatus,
  NotificationType as DbNotificationType,
  PollStatus as DbPollStatus,
  TicketActivityType as DbTicketActivityType,
  TicketPriority as DbTicketPriority,
  TicketStatus as DbTicketStatus,
} from "@prisma/client";

const ticketPriorityMap: Record<DbTicketPriority, TicketPriority> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  EMERGENCY: "Emergency",
};

const ticketStatusMap: Record<DbTicketStatus, TicketStatus> = {
  NEW: "New",
  ACKNOWLEDGED: "Acknowledged",
  ASSIGNED: "Assigned",
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  WAITING_ON_RESIDENT: "Waiting on Resident",
  WAITING_ON_CONTRACTOR: "Waiting on Contractor",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
  REOPENED: "Reopened",
};

const announcementPriorityMap: Record<DbAnnouncementPriority, AnnouncementPriority> = {
  NORMAL: "Normal",
  IMPORTANT: "Important",
  EMERGENCY: "Emergency",
};

const communityStatusLevelMap: Record<DbCommunityStatusLevel, CommunityStatusLevel> = {
  NORMAL: "Normal",
  WARNING: "Warning",
  CRITICAL: "Critical",
};

const pollStatusMap: Record<DbPollStatus, PollStatus> = {
  ACTIVE: "Active",
  CLOSED: "Closed",
};

const lostFoundStatusMap: Record<DbLostFoundStatus, LostFoundStatus> = {
  OPEN: "Open",
  CLAIMED: "Claimed",
  RESOLVED: "Resolved",
};

const communityTypeMap: Record<DbCommunityType, CommunityType> = {
  GENERAL_NEIGHBOURHOOD: "General Neighbourhood",
  RESIDENTIAL_ESTATE: "Residential Estate",
  GATED_COMMUNITY: "Gated Community",
  APARTMENT_COMPLEX: "Apartment Complex",
  TOWNHOUSE_COMPLEX: "Townhouse Complex",
  RETIREMENT_VILLAGE: "Retirement Village",
};

const ticketActivityMap: Record<DbTicketActivityType, TicketActivity["type"]> = {
  CREATED: "created",
  STATUS: "status",
  COMMENT: "comment",
  ADMIN_NOTE: "admin-note",
  REOPENED: "reopened",
};

export function toAppTicketPriority(value: DbTicketPriority): TicketPriority {
  return ticketPriorityMap[value];
}

export function toDbTicketPriority(value: TicketPriority): DbTicketPriority {
  return ({ Low: "LOW", Medium: "MEDIUM", High: "HIGH", Emergency: "EMERGENCY" } as const)[value];
}

export function toAppTicketStatus(value: DbTicketStatus): TicketStatus {
  return ticketStatusMap[value];
}

export function toDbTicketStatus(value: TicketStatus): DbTicketStatus {
  return ({
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
  } as const)[value];
}

export function toAppAnnouncementPriority(value: DbAnnouncementPriority): AnnouncementPriority {
  return announcementPriorityMap[value];
}

export function toDbAnnouncementPriority(value: AnnouncementPriority): DbAnnouncementPriority {
  return ({ Normal: "NORMAL", Important: "IMPORTANT", Emergency: "EMERGENCY" } as const)[value];
}

export function toAppCommunityStatusLevel(value: DbCommunityStatusLevel): CommunityStatusLevel {
  return communityStatusLevelMap[value];
}

export function toDbCommunityStatusLevel(value: CommunityStatusLevel): DbCommunityStatusLevel {
  return ({ Normal: "NORMAL", Warning: "WARNING", Critical: "CRITICAL" } as const)[value];
}

export function toAppPollStatus(value: DbPollStatus): PollStatus {
  return pollStatusMap[value];
}

export function toDbPollStatus(value: PollStatus): DbPollStatus {
  return ({ Active: "ACTIVE", Closed: "CLOSED" } as const)[value];
}

export function toAppLostFoundStatus(value: DbLostFoundStatus): LostFoundStatus {
  return lostFoundStatusMap[value];
}

export function toDbLostFoundStatus(value: LostFoundStatus): DbLostFoundStatus {
  return ({ Open: "OPEN", Claimed: "CLAIMED", Resolved: "RESOLVED" } as const)[value];
}

export function toAppCommunityType(value: DbCommunityType): CommunityType {
  return communityTypeMap[value];
}

export function toDbCommunityType(value: CommunityType): DbCommunityType {
  return ({
    "General Neighbourhood": "GENERAL_NEIGHBOURHOOD",
    "Residential Estate": "RESIDENTIAL_ESTATE",
    "Gated Community": "GATED_COMMUNITY",
    "Apartment Complex": "APARTMENT_COMPLEX",
    "Townhouse Complex": "TOWNHOUSE_COMPLEX",
    "Retirement Village": "RETIREMENT_VILLAGE",
  } as const)[value];
}

export function toAppTicketActivityType(value: DbTicketActivityType): TicketActivity["type"] {
  return ticketActivityMap[value];
}

export function toDbTicketActivityType(value: TicketActivity["type"]): DbTicketActivityType {
  return ({
    created: "CREATED",
    status: "STATUS",
    comment: "COMMENT",
    "admin-note": "ADMIN_NOTE",
    reopened: "REOPENED",
  } as const)[value];
}

export function toNotificationType(value: DbNotificationType) {
  return {
    EMERGENCY_ANNOUNCEMENT: "Emergency announcement",
    TICKET_STATUS_UPDATE: "Ticket status update",
    ADMIN_COMMENT: "Admin comment",
    UPCOMING_EVENT: "Upcoming event",
    COMMUNITY_STATUS_CHANGE: "Community status change",
  }[value];
}

export function toDbNotificationType(value: string): DbNotificationType {
  return ({
    "Emergency announcement": "EMERGENCY_ANNOUNCEMENT",
    "Ticket status update": "TICKET_STATUS_UPDATE",
    "Admin comment": "ADMIN_COMMENT",
    "Upcoming event": "UPCOMING_EVENT",
    "Community status change": "COMMUNITY_STATUS_CHANGE",
  } as const)[value];
}

import type { AnnouncementPriority, BusinessCategory, CommunityStatusLevel, CommunityType, EventCategory, GalleryCategory, LostFoundStatus, LostFoundType, PollStatus, PostType, TicketCategory, TicketPriority, TicketStatus } from "@/lib/types";

export const ticketCategories: TicketCategory[] = [
  "Power outage",
  "Water issue",
  "Security concern",
  "Suspicious activity",
  "Noise complaint",
  "Illegal dumping",
  "Pothole or road issue",
  "Streetlight issue",
  "Gate or access issue",
  "Lost pet",
  "Found pet",
  "General complaint",
  "Other",
];

export const ticketStatuses: TicketStatus[] = [
  "New",
  "Acknowledged",
  "Assigned",
  "Open",
  "In Progress",
  "Waiting on Resident",
  "Waiting on Contractor",
  "Resolved",
  "Closed",
  "Reopened",
];

export const ticketPriorities: TicketPriority[] = ["Low", "Medium", "High", "Emergency"];

export const ticketCategoryGroups: { label: string; categories: TicketCategory[] }[] = [
  { label: "Utilities", categories: ["Power outage", "Water issue", "Streetlight issue"] },
  { label: "Security", categories: ["Security concern", "Suspicious activity", "Gate or access issue"] },
  { label: "Roads", categories: ["Pothole or road issue"] },
  { label: "Community", categories: ["Noise complaint", "Illegal dumping", "General complaint"] },
  { label: "Animals", categories: ["Lost pet", "Found pet"] },
  { label: "Other", categories: ["Other"] },
];

export const announcementPriorities: AnnouncementPriority[] = ["Normal", "Important", "Emergency"];
export const communityStatusLevels: CommunityStatusLevel[] = ["Normal", "Warning", "Critical"];

export const emergencyTypes = [
  { label: "Security", category: "Security concern" as TicketCategory, title: "Emergency security report" },
  { label: "Medical", category: "Other" as TicketCategory, title: "Medical emergency assistance needed" },
  { label: "Fire", category: "Other" as TicketCategory, title: "Fire emergency reported" },
  { label: "Police", category: "Security concern" as TicketCategory, title: "Police assistance requested" },
  { label: "Suspicious activity", category: "Suspicious activity" as TicketCategory, title: "Suspicious activity emergency" },
];

export const postTypes: PostType[] = ["General update", "Safety alert", "Lost and found", "Recommendation", "Event"];
export const lostFoundTypes: LostFoundType[] = ["Lost pet", "Found pet", "Lost item", "Found item"];
export const lostFoundStatuses: LostFoundStatus[] = ["Open", "Claimed", "Resolved"];
export const eventCategories: EventCategory[] = ["Community", "Safety", "Social", "Maintenance", "Meeting", "Other"];
export const pollStatuses: PollStatus[] = ["Active", "Closed"];
export const businessCategories: BusinessCategory[] = ["Plumber", "Electrician", "Gardener", "Security", "Cleaning", "Vet", "Doctor", "Mechanic", "Internet/Fibre", "Other"];
export const galleryCategories: GalleryCategory[] = ["Events", "Maintenance", "Security", "Lost & Found", "Community"];

export const communityTypes: CommunityType[] = [
  "General Neighbourhood",
  "Residential Estate",
  "Gated Community",
  "Apartment Complex",
  "Townhouse Complex",
  "Retirement Village",
];

export const communityModulePlaceholders: Record<CommunityType, string[]> = {
  "General Neighbourhood": [],
  "Residential Estate": ["Visitors", "Delivery Notifications", "Estate Documents", "Estate Rules", "Contractor Requests"],
  "Gated Community": ["Visitor Access", "Security Checkpoints", "Guard Operations", "Gate Management", "Visitor QR Codes"],
  "Apartment Complex": ["Maintenance", "Building Notices", "Body Corporate Documents", "Shared Facility Booking"],
  "Townhouse Complex": ["Complex Notices", "Maintenance", "Visitor Access", "Shared Facilities"],
  "Retirement Village": ["Medical Contacts", "Wellness Events", "Resident Assistance", "Village Notices"],
};

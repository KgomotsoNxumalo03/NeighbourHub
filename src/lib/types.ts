export type Role = "resident" | "admin" | "super-admin";
export type CommunityType =
  | "General Neighbourhood"
  | "Residential Estate"
  | "Gated Community"
  | "Apartment Complex"
  | "Townhouse Complex"
  | "Retirement Village";

export type TicketCategory =
  | "Power outage"
  | "Water issue"
  | "Security concern"
  | "Suspicious activity"
  | "Noise complaint"
  | "Illegal dumping"
  | "Pothole or road issue"
  | "Streetlight issue"
  | "Gate or access issue"
  | "Lost pet"
  | "Found pet"
  | "General complaint"
  | "Other";

export type TicketPriority = "Low" | "Medium" | "High" | "Emergency";
export type TicketStatus =
  | "New"
  | "Acknowledged"
  | "Assigned"
  | "Open"
  | "In Progress"
  | "Waiting on Resident"
  | "Waiting on Contractor"
  | "Resolved"
  | "Closed"
  | "Reopened";
export type AnnouncementPriority = "Normal" | "Important" | "Emergency";
export type CommunityStatusLevel = "Normal" | "Warning" | "Critical";
export type PostType = "General update" | "Safety alert" | "Lost and found" | "Recommendation" | "Event";
export type LostFoundType = "Lost pet" | "Found pet" | "Lost item" | "Found item";
export type LostFoundStatus = "Open" | "Claimed" | "Resolved";
export type EventCategory = "Community" | "Safety" | "Social" | "Maintenance" | "Meeting" | "Other";
export type PollStatus = "Active" | "Closed";
export type BusinessCategory =
  | "Plumber"
  | "Electrician"
  | "Gardener"
  | "Security"
  | "Cleaning"
  | "Vet"
  | "Doctor"
  | "Mechanic"
  | "Internet/Fibre"
  | "Other";
export type GalleryCategory = "Events" | "Maintenance" | "Security" | "Lost & Found" | "Community";
export type MapMarkerType = "Power" | "Water" | "Security" | "Roads" | "Emergency" | "Lost & Found" | "Event" | "Contact";
export type NotificationType =
  | "Emergency announcement"
  | "Ticket status update"
  | "Admin comment"
  | "Upcoming event"
  | "Community status change";

export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  communityId: string;
  address?: ResidentAddress;
  createdAt: string;
};

export type PublicUser = Omit<User, "password">;

export type TicketActivity = {
  id: string;
  type: "created" | "status" | "comment" | "admin-note" | "reopened";
  message: string;
  actor: string;
  createdAt: string;
};

export type TicketComment = {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: Role;
  body: string;
  createdAt: string;
};

export type AdminNote = {
  id: string;
  note: string;
  actor: string;
  createdAt: string;
};

export type Ticket = {
  id: string;
  communityId: string;
  reference: string;
  userId: string;
  residentName: string;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  location: string;
  imageName?: string;
  imagePreview?: string;
  status: TicketStatus;
  ownerName: string;
  supporters: string[];
  adminNotes: string;
  adminNotesHistory: AdminNote[];
  comments: TicketComment[];
  timeline: TicketActivity[];
  createdAt: string;
  updatedAt: string;
};

export type Announcement = {
  id: string;
  communityId: string;
  title: string;
  body: string;
  audience: "All residents" | "Residents" | "Security" | "Maintenance";
  priority: AnnouncementPriority;
  expiresAt: string;
  createdAt: string;
  updatedAt?: string;
};

export type EmergencyContact = {
  id: string;
  communityId: string;
  name: string;
  phone: string;
  detail: string;
};

export type CommunityStatus = {
  id: string;
  communityId: string;
  name: "Power" | "Water" | "Security" | "Roads";
  level: CommunityStatusLevel;
  status: string;
  detail: string;
  updatedAt?: string;
};

export type FeedComment = {
  id: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
};

export type CommunityPost = {
  id: string;
  communityId: string;
  type: PostType;
  title: string;
  body: string;
  authorId: string;
  authorName: string;
  authorRole: Role;
  pinned: boolean;
  deleted?: boolean;
  likes: string[];
  comments: FeedComment[];
  createdAt: string;
  updatedAt: string;
};

export type LostFoundReport = {
  id: string;
  communityId: string;
  type: LostFoundType;
  title: string;
  description: string;
  location: string;
  imageName: string;
  contactPreference: string;
  status: LostFoundStatus;
  reporterId: string;
  reporterName: string;
  createdAt: string;
  updatedAt: string;
};

export type CommunityEvent = {
  id: string;
  communityId: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  category: EventCategory;
  createdBy: string;
  rsvps: string[];
  createdAt: string;
  updatedAt: string;
};

export type Notification = {
  id: string;
  communityId: string;
  userId: string | "all";
  type: NotificationType;
  title: string;
  body: string;
  readBy: string[];
  href: string;
  createdAt: string;
};

export type ResidentProfile = {
  userId: string;
  communityId: string;
  name: string;
  visible: boolean;
  area: string;
  contactPreference: string;
  updatedAt: string;
};

export type ResidentAddress = {
  streetNumber?: string;
  streetName?: string;
  estateName?: string;
  houseNumber?: string;
  complexName?: string;
  building?: string;
  floor?: string;
  unitNumber?: string;
  villageName?: string;
};

export type Community = {
  id: string;
  name: string;
  communityType: CommunityType;
  suburb: string;
  city: string;
  province: string;
  postalCode: string;
  logo: string;
  coverImage: string;
  primaryColour: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

export type Poll = {
  id: string;
  communityId: string;
  question: string;
  options: { id: string; label: string; votes: string[] }[];
  status: PollStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type BusinessListing = {
  id: string;
  communityId: string;
  name: string;
  category: BusinessCategory;
  description: string;
  contact: string;
  area: string;
  rating: number;
  recommendedBy: string[];
  approved: boolean;
  createdAt: string;
  updatedAt: string;
};

export type VolunteerGroup = {
  id: string;
  communityId: string;
  name: string;
  description: string;
  upcomingActivity: string;
  members: string[];
  createdAt: string;
};

export type GalleryItem = {
  id: string;
  communityId: string;
  title: string;
  category: GalleryCategory;
  imageName: string;
  description: string;
  uploadedBy: string;
  createdAt: string;
};

export type MapMarker = {
  id: string;
  communityId: string;
  type: MapMarkerType;
  title: string;
  description: string;
  location: string;
  href: string;
  x: number;
  y: number;
};

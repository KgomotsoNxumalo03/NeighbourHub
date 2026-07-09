import "server-only";

import { promises as fs } from "fs";
import path from "path";
import type {
  Announcement,
  Community,
  CommunityEvent,
  BusinessListing,
  CommunityPost,
  CommunityStatus,
  EmergencyContact,
  LostFoundReport,
  GalleryItem,
  Poll,
  Notification,
  ResidentProfile,
  Ticket,
  User,
  VolunteerGroup,
} from "@/lib/types";

const dataDir = path.join(process.cwd(), "data");

type DataFile = {
  users: User[];
  communities: Community[];
  tickets: Ticket[];
  announcements: Announcement[];
  contacts: EmergencyContact[];
  communityStatus: CommunityStatus[];
  feedPosts: CommunityPost[];
  lostFound: LostFoundReport[];
  events: CommunityEvent[];
  notifications: Notification[];
  residentProfiles: ResidentProfile[];
  polls: Poll[];
  businesses: BusinessListing[];
  groups: VolunteerGroup[];
  gallery: GalleryItem[];
};

const fileNames: Record<keyof DataFile, string> = {
  users: "users.json",
  communities: "communities.json",
  tickets: "tickets.json",
  announcements: "announcements.json",
  contacts: "contacts.json",
  communityStatus: "communityStatus.json",
  feedPosts: "feedPosts.json",
  lostFound: "lostFound.json",
  events: "events.json",
  notifications: "notifications.json",
  residentProfiles: "residentProfiles.json",
  polls: "polls.json",
  businesses: "businesses.json",
  groups: "groups.json",
  gallery: "gallery.json",
};

async function ensureDataDir() {
  await fs.mkdir(dataDir, { recursive: true });
}

export async function readData<K extends keyof DataFile>(key: K): Promise<DataFile[K]> {
  await ensureDataDir();
  const filePath = path.join(dataDir, fileNames[key]);

  try {
    const content = await fs.readFile(filePath, "utf8");
    return JSON.parse(content) as DataFile[K];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      await fs.writeFile(filePath, "[]", "utf8");
      return [] as DataFile[K];
    }

    throw error;
  }
}

export async function writeData<K extends keyof DataFile>(key: K, value: DataFile[K]) {
  await ensureDataDir();
  const filePath = path.join(dataDir, fileNames[key]);
  await fs.writeFile(filePath, JSON.stringify(value, null, 2), "utf8");
}

export function toPublicUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    communityId: user.communityId,
    address: user.address,
    createdAt: user.createdAt,
  };
}

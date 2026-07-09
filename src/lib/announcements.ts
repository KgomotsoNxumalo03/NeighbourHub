import type { Announcement } from "@/lib/types";

export function normalizeAnnouncements(announcements: Announcement[]) {
  let changed = false;
  const fallbackExpiry = new Date();
  fallbackExpiry.setDate(fallbackExpiry.getDate() + 30);

  const normalized = announcements.map((announcement) => {
    const next: Announcement = {
      ...announcement,
      communityId: announcement.communityId || "community-oakridge",
      priority: announcement.priority || "Normal",
      expiresAt: announcement.expiresAt || fallbackExpiry.toISOString().slice(0, 10),
      updatedAt: announcement.updatedAt || announcement.createdAt,
    };

    if (!announcement.priority || !announcement.expiresAt || !announcement.updatedAt) changed = true;
    return next;
  });

  return { announcements: normalized, changed };
}

export function isAnnouncementActive(announcement: Announcement) {
  const expiry = new Date(`${announcement.expiresAt}T23:59:59`);
  return expiry.getTime() >= Date.now();
}

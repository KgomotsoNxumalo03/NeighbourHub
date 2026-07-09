import type { CommunityStatus } from "@/lib/types";

export function normalizeCommunityStatus(items: CommunityStatus[]) {
  let changed = false;
  const normalized = items.map((item) => {
    const level = item.level || (item.status?.toLowerCase().includes("critical") ? "Critical" : item.status?.toLowerCase().includes("warning") || item.status?.toLowerCase().includes("planned") ? "Warning" : "Normal");
    const next: CommunityStatus = {
      ...item,
      communityId: item.communityId || "community-oakridge",
      level,
      updatedAt: item.updatedAt || new Date().toISOString(),
    };

    if (!item.level || !item.updatedAt) changed = true;
    return next;
  });

  return { communityStatus: normalized, changed };
}

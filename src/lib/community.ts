import type { Community, CommunityType, PublicUser, Role } from "@/lib/types";

const activeCommunityKey = "neighbourhub-active-community";

export function filterByCommunity<T extends { communityId?: string }>(items: T[], communityId?: string) {
  return communityId ? items.filter((item) => item.communityId === communityId) : items;
}

export function hasRole(user: PublicUser | null, roles: Role[]) {
  return Boolean(user && roles.includes(user.role));
}

export function getStoredCommunityId(user: PublicUser | null) {
  if (typeof window === "undefined" || !user) return user?.communityId || "";
  if (user.role !== "super-admin") return user.communityId;
  return window.localStorage.getItem(activeCommunityKey) || user.communityId;
}

export function setStoredCommunityId(communityId: string) {
  if (typeof window !== "undefined") window.localStorage.setItem(activeCommunityKey, communityId);
}

export function clearStoredCommunityId() {
  if (typeof window !== "undefined") window.localStorage.removeItem(activeCommunityKey);
}

export function getCurrentCommunity(communities: Community[], user: PublicUser | null) {
  const communityId = getStoredCommunityId(user);
  return communities.find((community) => community.id === communityId) || communities[0] || null;
}

export function addressFieldsForType(type: CommunityType) {
  if (type === "General Neighbourhood") return ["streetNumber", "streetName"];
  if (type === "Residential Estate") return ["estateName", "houseNumber"];
  if (type === "Apartment Complex") return ["complexName", "building", "floor", "unitNumber"];
  if (type === "Townhouse Complex") return ["complexName", "unitNumber"];
  if (type === "Retirement Village") return ["villageName", "unitNumber"];
  return ["complexName", "unitNumber"];
}

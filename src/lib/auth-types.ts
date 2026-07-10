import type { UserRole } from "@prisma/client";
import type { PublicUser, Role } from "@/lib/types";

export const SESSION_COOKIE = "neighbourhub-session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export function toDbRole(role: Role): UserRole {
  if (role === "admin") return "ADMIN";
  if (role === "super-admin") return "SUPER_ADMIN";
  return "RESIDENT";
}

export function fromDbRole(role: UserRole): Role {
  if (role === "ADMIN") return "admin";
  if (role === "SUPER_ADMIN") return "super-admin";
  return "resident";
}

export function toPublicUser(user: {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  communityId: string;
  address: unknown;
  createdAt: Date | string;
}) {
  let address = user.address as PublicUser["address"];
  if (typeof user.address === "string" && user.address) {
    try {
      address = JSON.parse(user.address) as PublicUser["address"];
    } catch {
      address = {} as PublicUser["address"];
    }
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: fromDbRole(user.role),
    communityId: user.communityId,
    address,
    createdAt: typeof user.createdAt === "string" ? user.createdAt : user.createdAt.toISOString(),
  } satisfies PublicUser;
}

export type SessionUser = PublicUser & {
  activeCommunityId?: string;
};

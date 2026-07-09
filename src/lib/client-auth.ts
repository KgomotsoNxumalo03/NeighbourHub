"use client";

import type { PublicUser } from "@/lib/types";

const sessionKey = "neighbourhub-user";

export function getCurrentUser(): PublicUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(sessionKey);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as PublicUser;
  } catch {
    window.localStorage.removeItem(sessionKey);
    return null;
  }
}

export function saveCurrentUser(user: PublicUser) {
  window.localStorage.setItem(sessionKey, JSON.stringify(user));
}

export function clearCurrentUser() {
  window.localStorage.removeItem(sessionKey);
}

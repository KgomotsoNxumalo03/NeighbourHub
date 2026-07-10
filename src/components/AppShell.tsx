"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  ClipboardList,
  CalendarDays,
  Building2,
  Image,
  MessagesSquare,
  Search,
  Users,
  UserRound,
  Vote,
  Lock,
  Gauge,
  Home,
  LogOut,
  MapPin,
  Megaphone,
  PhoneCall,
  PlusCircle,
  BarChart3,
  ShieldCheck,
} from "lucide-react";
import { clearCurrentUser } from "@/lib/client-auth";
import type { Community, PublicUser, Role } from "@/lib/types";
import { useEffect, useState } from "react";
import { communityModulePlaceholders } from "@/lib/constants";
import { clearStoredCommunityId, getCurrentCommunity, getStoredCommunityId, setStoredCommunityId } from "@/lib/community";
import { Select } from "@/components/ui";
import { GlobalSearch } from "@/components/GlobalSearch";
import { saveCurrentUser } from "@/lib/client-auth";

const residentLinks = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/tickets/new", label: "Log ticket", icon: PlusCircle },
  { href: "/tickets", label: "My tickets", icon: ClipboardList },
  { href: "/feed", label: "Feed", icon: MessagesSquare },
  { href: "/map", label: "Map", icon: MapPin },
  { href: "/security", label: "Security", icon: ShieldCheck },
  { href: "/polls", label: "Polls", icon: Vote },
  { href: "/insights", label: "Insights", icon: BarChart3 },
  { href: "/businesses", label: "Businesses", icon: Building2 },
  { href: "/groups", label: "Groups", icon: Users },
  { href: "/gallery", label: "Gallery", icon: Image },
  { href: "/events", label: "Events", icon: CalendarDays },
  { href: "/lost-found", label: "Lost & found", icon: Search },
  { href: "/directory", label: "Directory", icon: Users },
  { href: "/profile", label: "Profile", icon: UserRound },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/announcements", label: "Announcements", icon: Megaphone },
  { href: "/emergency", label: "Emergency", icon: PhoneCall },
];

const adminLinks = [
  { href: "/admin", label: "Admin", icon: ShieldCheck },
  { href: "/admin/community", label: "Community", icon: MessagesSquare },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Gauge },
  { href: "/events", label: "Events", icon: CalendarDays },
  { href: "/feed", label: "Feed", icon: MessagesSquare },
  { href: "/map", label: "Map", icon: MapPin },
  { href: "/security", label: "Security", icon: ShieldCheck },
  { href: "/polls", label: "Polls", icon: Vote },
  { href: "/insights", label: "Insights", icon: BarChart3 },
  { href: "/businesses", label: "Businesses", icon: Building2 },
  { href: "/groups", label: "Groups", icon: Users },
  { href: "/gallery", label: "Gallery", icon: Image },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/profile", label: "Profile", icon: UserRound },
  { href: "/announcements", label: "Announcements", icon: Bell },
  { href: "/emergency", label: "Emergency", icon: PhoneCall },
];

export function AppShell({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: Role[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [activeCommunityId, setActiveCommunityId] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      const response = await fetch("/api/auth/session");
      const data = await response.json();
      const activeUser = data.session?.user as PublicUser | undefined;

      if (!activeUser) {
        clearCurrentUser();
        clearStoredCommunityId();
        if (!cancelled) router.replace("/login");
        return;
      }

      const superAdminAllowed = activeUser.role === "super-admin" && allowedRoles.includes("admin");
      if (!allowedRoles.includes(activeUser.role) && !superAdminAllowed) {
        if (!cancelled) router.replace(activeUser.role === "admin" ? "/admin" : "/dashboard");
        return;
      }

      saveCurrentUser(activeUser);
      setUser(activeUser);
      setActiveCommunityId(data.session.activeCommunityId || activeUser.communityId);
      setStoredCommunityId(data.session.activeCommunityId || activeUser.communityId);

      const [communitiesResponse, notificationsResponse] = await Promise.all([
        fetch("/api/communities"),
        fetch("/api/notifications"),
      ]);
      const communitiesData = await communitiesResponse.json();
      const notificationsData = await notificationsResponse.json();

      if (cancelled) return;

      setCommunities(communitiesData.communities || []);
      setUnreadCount((notificationsData.notifications || []).filter((item: { readBy: string[] }) => !item.readBy.includes(activeUser.id)).length);
      setReady(true);
    }

    loadSession();

    return () => {
      cancelled = true;
    };
  }, [allowedRoles, router]);

  async function logout() {
    if (!window.confirm("Sign out of NeighbourHub?")) return;
    await fetch("/api/auth/session", { method: "DELETE" }).catch(() => undefined);
    clearCurrentUser();
    clearStoredCommunityId();
    router.replace("/login");
  }

  if (!ready || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F8FA] px-6">
        <div className="rounded-lg bg-white px-5 py-4 text-sm font-medium text-zinc-600 shadow-sm ring-1 ring-zinc-200">
          Loading NeighbourHub...
        </div>
      </div>
    );
  }

  const activeCommunity = getCurrentCommunity(communities, user);
  const isAdminLike = user.role === "admin" || user.role === "super-admin";
  const links = isAdminLike ? adminLinks : residentLinks;
  const comingSoon = activeCommunity ? communityModulePlaceholders[activeCommunity.communityType] : [];

  async function switchCommunity(communityId: string) {
    await fetch("/api/auth/session", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activeCommunityId: communityId }),
    }).catch(() => undefined);
    setStoredCommunityId(communityId);
    setActiveCommunityId(communityId);
    window.location.reload();
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#1B1B1B]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-zinc-200 bg-white px-4 py-5 shadow-sm lg:block">
        <Link href={isAdminLike ? "/admin" : "/dashboard"} className="flex items-center gap-3 px-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#006B3C] text-sm font-bold text-white">
            {activeCommunity?.logo || <Gauge size={22} />}
          </div>
          <div>
            <p className="text-lg font-bold tracking-tight">NeighbourHub</p>
            <p className="text-xs font-medium text-zinc-500">{activeCommunity?.name || "Community Platform"}</p>
          </div>
        </Link>

        {user.role === "super-admin" && (
          <Select
            value={activeCommunityId}
            onChange={switchCommunity}
            options={communities.map((community) => ({ label: community.name, value: community.id }))}
            ariaLabel="Switch community"
            className="mt-5"
          />
        )}

        <nav className="mt-8 space-y-1">
          {links.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold ${
                  active
                    ? "bg-[#006B3C] text-white shadow-sm"
                    : "text-zinc-700 hover:bg-zinc-100 hover:text-[#006B3C]"
                }`}
              >
                <Icon size={18} />
                {item.label}
                {item.href === "/notifications" && unreadCount > 0 && (
                  <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold ${active ? "bg-white/20 text-white" : "bg-[#C8A23A]/20 text-[#7A5C08]"}`}>{unreadCount}</span>
                )}
              </Link>
            );
          })}
          {comingSoon.map((label) => (
            <div key={label} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-zinc-400">
              <Lock size={18} />
              {label} <span className="ml-auto text-[10px] uppercase">Soon</span>
            </div>
          ))}
        </nav>

        <div className="absolute bottom-5 left-4 right-4 rounded-lg bg-[#F7F8FA] p-3">
          <p className="text-sm font-semibold">{user.name}</p>
          <p className="truncate text-xs text-zinc-500">{user.email}</p>
          <button
            onClick={logout}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 hover:border-[#C8A23A] hover:text-[#006B3C]"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 hidden border-b border-zinc-200 bg-white/95 px-6 py-3 backdrop-blur lg:block">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-5">
            <div>
              <p className="text-sm font-bold text-zinc-900">{activeCommunity?.name}</p>
              <p className="text-xs text-zinc-500">{activeCommunity?.communityType}</p>
            </div>
            <GlobalSearch communityId={activeCommunityId} />
          </div>
        </header>
        <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <Link href={isAdminLike ? "/admin" : "/dashboard"} className="font-bold">
              {activeCommunity?.name || "NeighbourHub"}
            </Link>
          <button
              onClick={logout}
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700"
            >
              Sign out
            </button>
          </div>
          <div className="mt-3">
            <GlobalSearch communityId={activeCommunityId} />
          </div>
          <nav className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {links.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${
                    active ? "bg-[#006B3C] text-white" : "bg-zinc-100 text-zinc-700"
                  }`}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { getCurrentUser } from "@/lib/client-auth";
import { getStoredCommunityId } from "@/lib/community";
import type { MapMarker } from "@/lib/types";

const markerStyles: Record<string, string> = {
  Power: "bg-yellow-100 text-yellow-800",
  Water: "bg-blue-100 text-blue-800",
  Security: "bg-emerald-100 text-emerald-800",
  Roads: "bg-zinc-200 text-zinc-800",
  Emergency: "bg-red-600 text-white",
  "Lost & Found": "bg-[#C8A23A] text-[#1B1B1B]",
  Event: "bg-purple-100 text-purple-800",
  Contact: "bg-white text-[#006B3C]",
};

export default function MapPage() {
  const user = getCurrentUser();
  const communityId = getStoredCommunityId(user);
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [selected, setSelected] = useState<MapMarker | null>(null);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    fetch(`/api/map?communityId=${communityId}`).then((res) => res.json()).then((data) => setMarkers(data.markers || []));
  }, [communityId]);

  const visible = markers.filter((marker) => filter === "All" || marker.type === filter);
  const types = ["All", ...Array.from(new Set(markers.map((marker) => marker.type)))];

  return (
    <AppShell allowedRoles={["resident", "admin"]}>
      <div className="mb-6">
        <p className="text-sm font-semibold text-[#006B3C]">Community operations</p>
        <h1 className="mt-1 text-3xl font-bold">Interactive community map</h1>
        <p className="mt-2 text-sm text-zinc-600">A lightweight map-style operations view, ready to replace with real maps later.</p>
      </div>
      <div className="mb-4 flex gap-2 overflow-x-auto">
        {types.map((type) => <button key={type} onClick={() => setFilter(type)} className={`shrink-0 rounded-lg px-3 py-2 text-sm font-bold ${filter === type ? "bg-[#006B3C] text-white" : "bg-white ring-1 ring-zinc-200"}`}>{type}</button>)}
      </div>
      <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="relative min-h-[560px] overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#eef1f4_1px,transparent_1px),linear-gradient(#eef1f4_1px,transparent_1px)] bg-[size:42px_42px]" />
          <div className="absolute inset-6 rounded-lg border-2 border-dashed border-[#C8A23A]/40" />
          {visible.map((marker) => (
            <button key={marker.id} onClick={() => setSelected(marker)} className={`absolute flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full shadow-lg ring-2 ring-white ${markerStyles[marker.type] || "bg-white"}`} style={{ left: `${marker.x}%`, top: `${marker.y}%` }} title={marker.title}>
              <MapPin size={18} />
            </button>
          ))}
        </div>
        <aside className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold">Marker details</h2>
          {selected ? (
            <div className="mt-4">
              <span className={`rounded-full px-2 py-1 text-xs font-bold ${markerStyles[selected.type]}`}>{selected.type}</span>
              <h3 className="mt-3 text-xl font-bold">{selected.title}</h3>
              <p className="mt-2 text-sm text-zinc-600">{selected.description}</p>
              <p className="mt-2 text-sm font-semibold text-zinc-800">{selected.location}</p>
              <Link href={selected.href} className="mt-4 inline-flex rounded-lg bg-[#006B3C] px-4 py-2 text-sm font-bold text-white">Open details</Link>
            </div>
          ) : <p className="mt-4 text-sm text-zinc-600">Select a marker to view detail information.</p>}
        </aside>
      </section>
    </AppShell>
  );
}

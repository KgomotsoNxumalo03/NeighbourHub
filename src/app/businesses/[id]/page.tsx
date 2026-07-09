"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ImagePlus, ThumbsUp } from "lucide-react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { getCurrentUser } from "@/lib/client-auth";
import { getStoredCommunityId } from "@/lib/community";
import type { BusinessListing } from "@/lib/types";

export default function BusinessDetailPage() {
  const params = useParams<{ id: string }>();
  const user = getCurrentUser();
  const communityId = getStoredCommunityId(user);
  const [business, setBusiness] = useState<BusinessListing | null>(null);

  async function load() {
    const response = await fetch(`/api/businesses?communityId=${communityId}&includePending=true`);
    const data = await response.json();
    setBusiness((data.businesses || []).find((item: BusinessListing) => item.id === params.id) || null);
  }

  useEffect(() => {
    load();
  }, [params.id, communityId]);

  async function recommend() {
    if (!user || !business) return;
    await fetch("/api/businesses", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: business.id, action: "recommend", userId: user.id }),
    });
    await load();
  }

  return (
    <AppShell allowedRoles={["resident", "admin"]}>
      <Link href="/businesses" className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-[#006B3C]"><ArrowLeft size={16} />Back to businesses</Link>
      {business && (
        <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
            <span className="rounded-full bg-[#C8A23A]/15 px-2 py-1 text-xs font-bold text-[#7A5C08]">{business.category}</span>
            <h1 className="mt-3 text-3xl font-bold">{business.name}</h1>
            <p className="mt-3 text-sm leading-6 text-zinc-600">{business.description}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Info label="Contact" value={business.contact} />
              <Info label="Area" value={business.area} />
              <Info label="Rating" value={business.rating ? `${business.rating}/5` : "New listing"} />
              <Info label="Recommended by" value={`${business.recommendedBy.length} residents`} />
            </div>
            <button onClick={recommend} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#006B3C] px-4 py-3 text-sm font-bold text-white"><ThumbsUp size={17} />Recommend business</button>
          </div>

          <aside className="space-y-6">
            <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold">Services</h2>
              <div className="mt-3 space-y-2 text-sm text-zinc-600">
                <p>{business.category} services</p>
                <p>Emergency call-out placeholder</p>
                <p>Resident recommendations tracked</p>
              </div>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold">Hours</h2>
              <p className="mt-3 text-sm text-zinc-600">Business hours placeholder. Admins can expand this later.</p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold">Photos</h2>
              <div className="mt-3 flex aspect-video items-center justify-center rounded-lg bg-[#F7F8FA] text-[#006B3C]"><ImagePlus size={34} /></div>
            </div>
          </aside>
        </section>
      )}
      {!business && <p className="rounded-lg border border-zinc-200 bg-white p-6 text-sm text-zinc-600">Business not found.</p>}
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[#F7F8FA] p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-zinc-800">{value}</p>
    </div>
  );
}

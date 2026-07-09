"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Star, ThumbsUp } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Select } from "@/components/ui";
import { getCurrentUser } from "@/lib/client-auth";
import { getStoredCommunityId } from "@/lib/community";
import { businessCategories } from "@/lib/constants";
import type { BusinessListing } from "@/lib/types";

export default function BusinessesPage() {
  const user = getCurrentUser();
  const communityId = getStoredCommunityId(user);
  const [businesses, setBusinesses] = useState<BusinessListing[]>([]);
  const [draft, setDraft] = useState({ name: "", category: "Plumber", description: "", contact: "", area: "" });

  async function load() {
    const response = await fetch(`/api/businesses?communityId=${communityId}&includePending=${user?.role !== "resident"}`);
    setBusinesses((await response.json()).businesses || []);
  }

  useEffect(() => {
    load();
  }, [communityId, user?.role]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/businesses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...draft, communityId }),
    });
    if (response.ok) {
      setDraft({ name: "", category: "Plumber", description: "", contact: "", area: "" });
      await load();
    }
  }

  async function action(id: string, actionName: string) {
    await fetch("/api/businesses", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: actionName, userId: user?.id }),
    });
    await load();
  }

  return (
    <AppShell allowedRoles={["resident", "admin"]}>
      <div className="mb-6">
        <p className="text-sm font-semibold text-[#006B3C]">Trusted local help</p>
        <h1 className="mt-1 text-3xl font-bold">Local business directory</h1>
      </div>
      <section className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <form onSubmit={submit} className="h-fit rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold">Suggest a business</h2>
          <input required className="mt-4 w-full rounded-lg border border-zinc-200 px-3 py-3 text-sm" placeholder="Business name" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
          <Select className="mt-3" value={draft.category} onChange={(value) => setDraft({ ...draft, category: value })} options={businessCategories} />
          <textarea required className="mt-3 min-h-24 w-full rounded-lg border border-zinc-200 px-3 py-3 text-sm" placeholder="Description" value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
          <input required className="mt-3 w-full rounded-lg border border-zinc-200 px-3 py-3 text-sm" placeholder="Contact" value={draft.contact} onChange={(event) => setDraft({ ...draft, contact: event.target.value })} />
          <input className="mt-3 w-full rounded-lg border border-zinc-200 px-3 py-3 text-sm" placeholder="Area" value={draft.area} onChange={(event) => setDraft({ ...draft, area: event.target.value })} />
          <button className="mt-3 w-full rounded-lg bg-[#006B3C] px-4 py-3 text-sm font-bold text-white">Submit listing</button>
        </form>

        <div className="grid gap-4 md:grid-cols-2">
          {businesses.map((business) => (
            <article key={business.id} className={`rounded-lg border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${!business.approved ? "border-[#C8A23A]" : "border-zinc-200"}`}>
              <div className="flex justify-between gap-3">
                <div>
                  <span className="rounded-full bg-[#C8A23A]/15 px-2 py-1 text-xs font-bold text-[#7A5C08]">{business.category}</span>
                  <Link href={`/businesses/${business.id}`} className="mt-3 block text-lg font-bold text-[#006B3C] hover:underline">{business.name}</Link>
                </div>
                <span className="flex items-center gap-1 text-sm font-bold text-[#006B3C]"><Star size={16} />{business.rating || "New"}</span>
              </div>
              <p className="mt-2 text-sm text-zinc-600">{business.description}</p>
              <p className="mt-3 text-sm font-semibold">{business.contact} / {business.area}</p>
              <p className="mt-2 text-sm text-zinc-500">{business.recommendedBy.length} recommendations</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => action(business.id, "recommend")} className="inline-flex items-center gap-2 rounded-lg bg-[#F7F8FA] px-3 py-2 text-sm font-bold"><ThumbsUp size={16} />Recommend</button>
                {user?.role !== "resident" && (
                  <>
                    <button onClick={() => action(business.id, "approve")} className="rounded-lg bg-[#006B3C] px-3 py-2 text-sm font-bold text-white">Approve</button>
                    <button onClick={() => action(business.id, "remove")} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-700">Remove</button>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

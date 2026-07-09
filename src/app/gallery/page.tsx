"use client";

import { FormEvent, useEffect, useState } from "react";
import { ImagePlus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Select } from "@/components/ui";
import { getCurrentUser } from "@/lib/client-auth";
import { getStoredCommunityId } from "@/lib/community";
import { galleryCategories } from "@/lib/constants";
import type { GalleryItem } from "@/lib/types";

export default function GalleryPage() {
  const user = getCurrentUser();
  const communityId = getStoredCommunityId(user);
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [category, setCategory] = useState("");
  const [draft, setDraft] = useState({ title: "", category: "Community", imageName: "", description: "" });

  async function load() {
    const response = await fetch(`/api/gallery?communityId=${communityId}${category ? `&category=${category}` : ""}`);
    setItems((await response.json()).items || []);
  }

  useEffect(() => {
    load();
  }, [communityId, category]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/gallery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...draft, communityId, uploadedBy: user?.name }),
    });
    if (response.ok) {
      setDraft({ title: "", category: "Community", imageName: "", description: "" });
      await load();
    }
  }

  return (
    <AppShell allowedRoles={["resident", "admin"]}>
      <div className="mb-6">
        <p className="text-sm font-semibold text-[#006B3C]">Community moments</p>
        <h1 className="mt-1 text-3xl font-bold">Photo gallery</h1>
      </div>
      <section className="grid gap-6 xl:grid-cols-[340px_1fr]">
        <form onSubmit={submit} className="h-fit rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold">Upload placeholder</h2>
          <input required className="mt-4 w-full rounded-lg border border-zinc-200 px-3 py-3 text-sm" placeholder="Title" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
          <Select className="mt-3" value={draft.category} onChange={(value) => setDraft({ ...draft, category: value })} options={galleryCategories} />
          <input required className="mt-3 w-full rounded-lg border border-zinc-200 px-3 py-3 text-sm" placeholder="Image filename placeholder" value={draft.imageName} onChange={(event) => setDraft({ ...draft, imageName: event.target.value })} />
          <textarea className="mt-3 min-h-24 w-full rounded-lg border border-zinc-200 px-3 py-3 text-sm" placeholder="Description" value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
          <button className="mt-3 w-full rounded-lg bg-[#006B3C] px-4 py-3 text-sm font-bold text-white">Add photo</button>
        </form>

        <div>
          <div className="mb-4 flex gap-2 overflow-x-auto">
            <button onClick={() => setCategory("")} className={`rounded-lg px-3 py-2 text-sm font-bold ${!category ? "bg-[#006B3C] text-white" : "bg-white ring-1 ring-zinc-200"}`}>All</button>
            {galleryCategories.map((item) => (
              <button key={item} onClick={() => setCategory(item)} className={`rounded-lg px-3 py-2 text-sm font-bold ${category === item ? "bg-[#006B3C] text-white" : "bg-white ring-1 ring-zinc-200"}`}>{item}</button>
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <article key={item.id} className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex aspect-video items-center justify-center rounded-lg bg-[#F7F8FA] text-[#006B3C]"><ImagePlus size={34} /></div>
                <span className="mt-3 inline-flex rounded-full bg-[#C8A23A]/15 px-2 py-1 text-xs font-bold text-[#7A5C08]">{item.category}</span>
                <h2 className="mt-2 font-bold">{item.title}</h2>
                <p className="mt-1 text-sm text-zinc-600">{item.description}</p>
                <p className="mt-2 text-xs text-zinc-500">{item.imageName}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}

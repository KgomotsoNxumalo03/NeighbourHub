"use client";

import Link from "next/link";
import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";

type Result = {
  id: string;
  type: string;
  title: string;
  detail: string;
  href: string;
};

export function GlobalSearch({ communityId }: { communityId: string }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    if (query.trim().length < 2 || !communityId) {
      setResults([]);
      return;
    }

    const timer = window.setTimeout(() => {
      fetch(`/api/search?communityId=${communityId}&q=${encodeURIComponent(query)}`, { signal: controller.signal })
        .then((res) => res.json())
        .then((data) => {
          setResults(data.results || []);
          setOpen(true);
        })
        .catch(() => undefined);
    }, 180);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, communityId]);

  return (
    <div className="relative w-full max-w-xl">
      <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
      <input
        aria-label="Search NeighbourHub"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => query.length > 1 && setOpen(true)}
        className="h-11 w-full rounded-lg border border-zinc-200 bg-white py-2 pl-10 pr-10 text-sm font-medium shadow-sm"
        placeholder="Search tickets, events, posts, businesses..."
      />
      {query && (
        <button aria-label="Clear search" onClick={() => { setQuery(""); setResults([]); }} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-zinc-400 hover:bg-zinc-100">
          <X size={16} />
        </button>
      )}

      {open && query.length > 1 && (
        <div className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-xl">
          {results.length > 0 ? results.map((result) => (
            <Link key={`${result.type}-${result.id}`} href={result.href} onClick={() => setOpen(false)} className="block border-b border-zinc-100 px-4 py-3 hover:bg-[#F7F8FA]">
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-sm font-bold text-zinc-900">{result.title}</p>
                <span className="shrink-0 rounded-full bg-[#C8A23A]/15 px-2 py-1 text-xs font-bold text-[#7A5C08]">{result.type}</span>
              </div>
              <p className="mt-1 truncate text-xs text-zinc-500">{result.detail}</p>
            </Link>
          )) : (
            <div className="px-4 py-5 text-sm text-zinc-600">No results found in this community.</div>
          )}
        </div>
      )}
    </div>
  );
}

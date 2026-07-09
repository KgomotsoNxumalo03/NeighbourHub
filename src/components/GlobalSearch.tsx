"use client";

import Link from "next/link";
import { Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    try {
      setRecentSearches(JSON.parse(localStorage.getItem("neighbourhub-recent-searches") || "[]"));
    } catch {
      setRecentSearches([]);
    }
  }, []);

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

  const groupedResults = useMemo(() => {
    return results.reduce<Record<string, Result[]>>((groups, result) => {
      groups[result.type] = [...(groups[result.type] || []), result];
      return groups;
    }, {});
  }, [results]);

  function saveRecentSearch(value: string) {
    const clean = value.trim();
    if (!clean) return;
    const next = [clean, ...recentSearches.filter((item) => item.toLowerCase() !== clean.toLowerCase())].slice(0, 5);
    setRecentSearches(next);
    localStorage.setItem("neighbourhub-recent-searches", JSON.stringify(next));
  }

  function closeWithSearch(value: string) {
    saveRecentSearch(value);
    setOpen(false);
  }

  return (
    <div className="relative w-full max-w-xl">
      <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
      <input
        aria-label="Search NeighbourHub"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => setOpen(true)}
        className="h-11 w-full rounded-lg border border-zinc-200 bg-white py-2 pl-10 pr-10 text-sm font-medium shadow-sm outline-none transition focus:border-[#006B3C] focus:ring-2 focus:ring-[#006B3C]/15"
        placeholder="Search tickets, events, posts, businesses..."
      />
      {query && (
        <button aria-label="Clear search" onClick={() => { setQuery(""); setResults([]); }} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-zinc-400 hover:bg-zinc-100">
          <X size={16} />
        </button>
      )}

      {open && (
        <div className="absolute left-0 right-0 top-12 z-50 max-h-[70vh] overflow-y-auto rounded-lg border border-zinc-200 bg-white shadow-xl">
          {query.trim().length < 2 && recentSearches.length > 0 && (
            <div className="p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">Recent searches</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {recentSearches.map((search) => (
                  <button
                    key={search}
                    onClick={() => setQuery(search)}
                    className="rounded-full border border-zinc-200 bg-[#F7F8FA] px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:border-[#C8A23A] hover:text-[#006B3C]"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}
          {query.trim().length >= 2 && results.length > 0 && Object.entries(groupedResults).map(([type, items]) => (
            <div key={type} className="border-b border-zinc-100 last:border-b-0">
              <div className="sticky top-0 z-10 flex items-center justify-between bg-[#F7F8FA] px-4 py-2">
                <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">{type}</p>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-zinc-500">{items.length}</span>
              </div>
              {items.map((result) => (
                <Link key={`${result.type}-${result.id}`} href={result.href} onClick={() => closeWithSearch(query)} className="block px-4 py-3 transition hover:bg-[#F7F8FA]">
                  <p className="truncate text-sm font-bold text-zinc-900">{result.title}</p>
                  <p className="mt-1 truncate text-xs text-zinc-500">{result.detail}</p>
                </Link>
              ))}
            </div>
          ))}
          {query.trim().length >= 2 && results.length === 0 && (
            <div className="px-4 py-5">
              <p className="text-sm font-semibold text-zinc-800">No results found in this community.</p>
              <p className="mt-1 text-xs text-zinc-500">Try searching for security, water, event, ticket, or a street name.</p>
            </div>
          )}
          {query.trim().length < 2 && recentSearches.length === 0 && (
            <div className="px-4 py-5 text-sm text-zinc-600">Search tickets, alerts, events, businesses, posts, and community records.</div>
          )}
        </div>
      )}
    </div>
  );
}

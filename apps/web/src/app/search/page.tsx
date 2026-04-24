"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { apiClient, getApiErrorMessage } from "@/lib/api";
import { GlobalSearchResponse } from "@/types/api";

export default function GlobalSearchPage() {
  const searchParams = useSearchParams();
  const initialQuery = (searchParams.get("q") || "").trim();

  const [query, setQuery] = useState(initialQuery);
  const [data, setData] = useState<GlobalSearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setData(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await apiClient.get<GlobalSearchResponse>("/search/global", { q, limit: 100 });
        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err, "Failed to search"));
          setData(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [query]);

  const groups = useMemo(() => {
    if (!data) {
      return [];
    }

    return [
      { key: "assets", label: "Assets", items: data.grouped.assets },
      { key: "problems", label: "Problems", items: data.grouped.problems },
      { key: "incidents", label: "Incidents", items: data.grouped.incidents },
      { key: "documents", label: "Documents", items: data.grouped.documents }
    ];
  }, [data]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <h1>Global Search</h1>
        <p className="text-sm text-muted-foreground">Search assets, knowledge base, incidents, and documents.</p>
      </div>

      <div className="kpi-shadow border border-border/50 rounded-lg bg-card p-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search everything..."
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        />
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Searching...</p>}
      {error && <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      {!isLoading && !error && query.trim().length >= 2 && data && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">{data.total} results</p>

          {groups.map((group) => (
            <div key={group.key} className="kpi-shadow border border-border/50 rounded-lg bg-card p-4 space-y-2">
              <h2 className="text-base font-semibold text-foreground">{group.label}</h2>
              {group.items.length === 0 ? (
                <p className="text-sm text-muted-foreground">No matches in {group.label.toLowerCase()}.</p>
              ) : (
                <div className="space-y-2">
                  {group.items.map((item) => (
                    <Link
                      key={`${item.type}-${item.id}`}
                      href={item.href}
                      className="block rounded-md border border-border/50 bg-background p-3 hover:border-primary/40"
                    >
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      {item.subtitle && <p className="text-xs text-muted-foreground mt-1">{item.subtitle}</p>}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

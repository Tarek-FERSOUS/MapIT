"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Server } from "lucide-react";
import { Asset } from "@/types/api";
import { MockApiService } from "@/lib/mock-api";
import { EmptyState, ErrorAlert, LoadingSpinner } from "@/components/ui";
import { formatDateTime } from "@/lib/formatting";

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAssets = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await MockApiService.getAssets();
        setAssets(data);
      } catch (_err) {
        setError("Failed to load assets");
      } finally {
        setIsLoading(false);
      }
    };

    loadAssets();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      return assets;
    }

    return assets.filter((asset) =>
      [asset.name, asset.type, asset.ipAddress, asset.location]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [assets, search]);

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Assets</h1>
        <p className="text-slate-600 mt-2">Inventory of infrastructure components (mock data).</p>
      </div>

      <div className="card">
        <input
          className="input"
          placeholder="Search assets"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {isLoading ? (
        <div className="card py-12">
          <LoadingSpinner />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Server className="h-10 w-10" />}
          title="No assets found"
          description="Try changing your search criteria."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((asset) => (
            <Link key={asset.id} href={`/assets/${asset.id}`} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{asset.name}</h2>
                  <p className="text-sm text-slate-600 mt-1">{asset.type} • {asset.location}</p>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    asset.status === "online"
                      ? "bg-emerald-100 text-emerald-800"
                      : asset.status === "maintenance"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {asset.status}
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-3">IP: {asset.ipAddress}</p>
              <p className="text-xs text-slate-500 mt-2">Updated {formatDateTime(asset.lastUpdated)}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

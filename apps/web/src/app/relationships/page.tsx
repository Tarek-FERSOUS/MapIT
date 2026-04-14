"use client";

import { useMemo, useState } from "react";
import { useEffect } from "react";
import { ZoomIn, ZoomOut, Maximize2, Filter } from "lucide-react";
import { apiClient, getApiErrorMessage } from "@/lib/api";
import { Asset, Relationship } from "@/types/api";

export default function RelationshipsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [visibleTypes, setVisibleTypes] = useState<Set<Asset["type"]>>(
    new Set(["server", "vm", "network", "storage", "service"])
  );
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const loadRelationships = async () => {
      try {
        setError(null);
        const [assetData, relationshipData] = await Promise.all([
          apiClient.get<{ items: Asset[] }>("/assets"),
          apiClient.get<{ items: Relationship[] }>("/relationships")
        ]);
        setAssets(assetData.items || []);
        setRelationships(relationshipData.items || []);
      } catch (error) {
        setError(getApiErrorMessage(error, "Failed to load relationships map"));
      }
    };

    loadRelationships();
  }, []);

  const toggleType = (type: Asset["type"]) => {
    setVisibleTypes((previous) => {
      const next = new Set(previous);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const visibleAssets = useMemo(
    () => assets.filter((asset) => visibleTypes.has(asset.type)),
    [assets, visibleTypes]
  );
  const visibleNames = new Set(visibleAssets.map((asset) => asset.name));
  const visibleConnections = relationships
    .map((relationship) => {
      const source = assets.find((asset) => asset.id === relationship.sourceAssetId);
      const target = assets.find((asset) => asset.id === relationship.targetAssetId);
      if (!source || !target) {
        return null;
      }
      return {
        from: source.name,
        to: target.name,
        label: relationship.label || relationship.relationshipType
      };
    })
    .filter((connection): connection is { from: string; to: string; label: string } => Boolean(connection))
    .filter((connection) => visibleNames.has(connection.from) && visibleNames.has(connection.to));

  const positions = useMemo(() => {
    const cx = 400;
    const cy = 300;
    const r = 220;
    const pos: Record<string, { x: number; y: number }> = {};
    visibleAssets.forEach((asset, index) => {
      const angle = (2 * Math.PI * index) / visibleAssets.length - Math.PI / 2;
      pos[asset.name] = {
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle)
      };
    });
    return pos;
  }, [visibleAssets]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1>Relationship Map</h1>
          <p className="text-muted-foreground text-sm mt-1">Infrastructure dependencies and connections</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            className="h-8 w-8 rounded-md border border-border inline-flex items-center justify-center"
            onClick={() => setZoom((value) => Math.max(0.5, value - 0.1))}
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <button
            className="h-8 w-8 rounded-md border border-border inline-flex items-center justify-center"
            onClick={() => setZoom((value) => Math.min(2, value + 0.1))}
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button
            className="h-8 w-8 rounded-md border border-border inline-flex items-center justify-center"
            onClick={() => setZoom(1)}
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {error && <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="kpi-shadow border border-border/50 rounded-lg bg-card lg:w-[200px] shrink-0">
          <div className="p-4 border-b border-border/50">
            <h3 className="text-sm flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5" /> Filters
            </h3>
          </div>
          <div className="p-4 space-y-2">
            {(["server", "vm", "network", "storage", "service"] as Asset["type"][]).map((type) => (
              <label key={type} className="flex items-center gap-2 text-sm capitalize cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibleTypes.has(type)}
                  onChange={() => toggleType(type)}
                />
                {type}
              </label>
            ))}
          </div>
        </div>

        <div className="flex-1 kpi-shadow border border-border/50 rounded-lg bg-card overflow-hidden">
          <div className="w-full overflow-auto" style={{ minHeight: 500 }}>
            <svg
              viewBox="0 0 800 600"
              className="w-full h-auto"
              style={{ transform: `scale(${zoom})`, transformOrigin: "center center", transition: "transform 0.2s" }}
            >
              {visibleConnections.map((connection, index) => {
                const from = positions[connection.from];
                const to = positions[connection.to];
                if (!from || !to) {
                  return null;
                }
                const mx = (from.x + to.x) / 2;
                const my = (from.y + to.y) / 2;
                return (
                  <g key={`${connection.from}-${connection.to}-${index}`}>
                    <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="hsl(214 20% 85%)" strokeWidth={1.5} />
                    <text x={mx} y={my - 6} textAnchor="middle" className="text-[9px] fill-muted-foreground">
                      {connection.label}
                    </text>
                  </g>
                );
              })}

              {visibleAssets.map((asset) => {
                const position = positions[asset.name];
                if (!position) {
                  return null;
                }
                const statusDot =
                  asset.status === "online" ? "#10B981" : asset.status === "offline" ? "#EF4444" : "#F59E0B";
                return (
                  <g key={asset.id} className="cursor-pointer">
                    <circle cx={position.x} cy={position.y} r={28} fill="hsl(0 0% 100%)" stroke="hsl(214 20% 88%)" strokeWidth={1.5} />
                    <circle cx={position.x} cy={position.y} r={26} fill="hsl(210 20% 98%)" />
                    <text x={position.x} y={position.y - 2} textAnchor="middle" className="text-[9px] font-semibold fill-foreground">
                      {asset.name.length > 12 ? `${asset.name.slice(0, 12)}…` : asset.name}
                    </text>
                    <text x={position.x} y={position.y + 10} textAnchor="middle" className="text-[8px] fill-muted-foreground capitalize">
                      {asset.type}
                    </text>
                    <circle cx={position.x + 20} cy={position.y - 20} r={4} fill={statusDot} />
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

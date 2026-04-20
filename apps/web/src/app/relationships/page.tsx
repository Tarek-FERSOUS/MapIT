"use client";

import { useMemo, useState } from "react";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ZoomIn, ZoomOut, Maximize2, LayoutGrid, Filter } from "lucide-react";
import { apiClient, getApiErrorMessage } from "@/lib/api";
import { Asset, Relationship } from "@/types/api";

type NodePoint = { x: number; y: number };

const LAYOUT_WIDTH = 1400;
const LAYOUT_HEIGHT = 900;
const TYPE_ORDER: Asset["type"][] = ["server", "vm", "network", "network-device", "storage", "service"];

function getAutoLayout(assets: Asset[]): Record<string, NodePoint> {
  const grouped = TYPE_ORDER.map((type) => ({
    type,
    items: assets.filter((asset) => asset.type === type)
  }));

  const positions: Record<string, NodePoint> = {};
  const totalColumns = grouped.length;
  const columnWidth = LAYOUT_WIDTH / totalColumns;

  grouped.forEach((group, columnIndex) => {
    const x = columnWidth * columnIndex + columnWidth / 2;
    const rows = Math.max(group.items.length, 1);
    const rowSpacing = Math.min(120, (LAYOUT_HEIGHT - 140) / rows);
    const startY = 80;

    group.items.forEach((asset, rowIndex) => {
      const y = startY + rowIndex * rowSpacing;
      positions[asset.id] = { x, y };
    });
  });

  return positions;
}

export default function RelationshipsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [visibleTypes, setVisibleTypes] = useState<Set<Asset["type"]>>(
    new Set(["server", "vm", "network", "network-device", "storage", "service"])
  );
  const [nodePositions, setNodePositions] = useState<Record<string, NodePoint>>({});
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<NodePoint>({ x: 0, y: 0 });
  const [dragDistance, setDragDistance] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [hoveredAssetId, setHoveredAssetId] = useState<string | null>(null);

  const highlightedAssetId = searchParams.get("asset");

  useEffect(() => {
    const loadRelationships = async () => {
      try {
        setError(null);
        const [assetData, relationshipData] = await Promise.all([
          apiClient.get<{ items: Asset[] }>("/assets"),
          apiClient.get<{ items: Relationship[] }>("/relationships")
        ]);
        const nextAssets = assetData.items || [];
        setAssets(nextAssets);
        setRelationships(relationshipData.items || []);
        setNodePositions(getAutoLayout(nextAssets));
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

  useEffect(() => {
    setNodePositions((previous) => {
      const auto = getAutoLayout(visibleAssets);
      const next: Record<string, NodePoint> = {};
      visibleAssets.forEach((asset) => {
        next[asset.id] = previous[asset.id] || auto[asset.id];
      });
      return next;
    });
  }, [visibleAssets]);

  const visibleIds = new Set(visibleAssets.map((asset) => asset.id));
  const assetById = useMemo(() => {
    const map = new Map<string, Asset>();
    assets.forEach((asset) => map.set(asset.id, asset));
    return map;
  }, [assets]);

  const visibleConnections = relationships
    .filter(
      (relationship) =>
        visibleIds.has(relationship.sourceAssetId) && visibleIds.has(relationship.targetAssetId)
    )
    .map((relationship) => {
      const source = assetById.get(relationship.sourceAssetId);
      const target = assetById.get(relationship.targetAssetId);
      if (!source || !target || !nodePositions[source.id] || !nodePositions[target.id]) {
        return null;
      }
      return {
        id: relationship.id,
        source,
        target,
        relationshipType: relationship.relationshipType
      };
    })
    .filter(
      (
        connection
      ): connection is {
        id: string;
        source: Asset;
        target: Asset;
        relationshipType: string;
      } => Boolean(connection)
    );

  const startDragging = (event: React.MouseEvent<SVGGElement>, assetId: string) => {
    event.preventDefault();
    event.stopPropagation();
    const point = nodePositions[assetId];
    if (!point) {
      return;
    }

    const svg = event.currentTarget.ownerSVGElement;
    if (!svg) {
      return;
    }

    const rect = svg.getBoundingClientRect();
    const svgX = ((event.clientX - rect.left) / rect.width) * LAYOUT_WIDTH;
    const svgY = ((event.clientY - rect.top) / rect.height) * LAYOUT_HEIGHT;
    const tx = (LAYOUT_WIDTH / 2) * (1 - zoom);
    const ty = (LAYOUT_HEIGHT / 2) * (1 - zoom);
    const x = (svgX - tx) / zoom;
    const y = (svgY - ty) / zoom;

    setDraggingNodeId(assetId);
    setDragDistance(0);
    setDragOffset({ x: x - point.x, y: y - point.y });
  };

  const onPointerMove = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!draggingNodeId) {
      return;
    }

    const svg = event.currentTarget;
    const rect = svg.getBoundingClientRect();
    const svgX = ((event.clientX - rect.left) / rect.width) * LAYOUT_WIDTH;
    const svgY = ((event.clientY - rect.top) / rect.height) * LAYOUT_HEIGHT;
    const tx = (LAYOUT_WIDTH / 2) * (1 - zoom);
    const ty = (LAYOUT_HEIGHT / 2) * (1 - zoom);
    const worldX = (svgX - tx) / zoom;
    const worldY = (svgY - ty) / zoom;
    const rawX = worldX - dragOffset.x;
    const rawY = worldY - dragOffset.y;
    const x = Math.max(60, Math.min(LAYOUT_WIDTH - 60, rawX));
    const y = Math.max(60, Math.min(LAYOUT_HEIGHT - 60, rawY));

    setNodePositions((previous) => {
      const prevPoint = previous[draggingNodeId] || { x, y };
      const moved = Math.hypot(x - prevPoint.x, y - prevPoint.y);
      setDragDistance((distance) => distance + moved);
      return {
        ...previous,
        [draggingNodeId]: { x, y }
      };
    });
  };

  const stopDragging = () => {
    setDraggingNodeId(null);
    setDragOffset({ x: 0, y: 0 });
  };

  const resetLayout = () => {
    setNodePositions(getAutoLayout(visibleAssets));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1>Relationship Map</h1>
          <p className="text-muted-foreground text-sm mt-1">Drag nodes to refine layout, click a node to open asset details.</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            className="h-8 w-8 rounded-md border border-border inline-flex items-center justify-center"
            onClick={() => setZoom((previous) => Math.max(0.6, previous - 0.15))}
            aria-label="Zoom out"
            title="Zoom out"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <button
            className="h-8 w-8 rounded-md border border-border inline-flex items-center justify-center"
            onClick={() => setZoom((previous) => Math.min(1.8, previous + 0.15))}
            aria-label="Zoom in"
            title="Zoom in"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button
            className="h-8 w-8 rounded-md border border-border inline-flex items-center justify-center"
            onClick={() => setZoom(1)}
            aria-label="Reset zoom"
            title="Reset zoom"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
          <button
            className="h-8 w-8 rounded-md border border-border inline-flex items-center justify-center"
            onClick={resetLayout}
            aria-label="Organize layout"
            title="Organize layout"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
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
            {(["server", "vm", "network", "network-device", "storage", "service"] as Asset["type"][]).map((type) => (
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
          <div className="w-full overflow-auto min-h-[500px]">
            <svg
              viewBox={`0 0 ${LAYOUT_WIDTH} ${LAYOUT_HEIGHT}`}
              className="w-full h-auto"
              preserveAspectRatio="xMidYMid meet"
              onMouseMove={onPointerMove}
              onMouseUp={stopDragging}
              onMouseLeave={stopDragging}
            >
              <g transform={`translate(${(LAYOUT_WIDTH / 2) * (1 - zoom)}, ${(LAYOUT_HEIGHT / 2) * (1 - zoom)}) scale(${zoom})`}>
              {visibleConnections.map((connection, index) => {
                const sourcePos = nodePositions[connection.source.id];
                const targetPos = nodePositions[connection.target.id];
                if (!sourcePos || !targetPos) {
                  return null;
                }

                const dx = targetPos.x - sourcePos.x;
                const dy = targetPos.y - sourcePos.y;
                const mx = (sourcePos.x + targetPos.x) / 2;
                const my = (sourcePos.y + targetPos.y) / 2;
                const curve = 0.16;
                const cx = mx - dy * curve;
                const cy = my + dx * curve;

                return (
                  <g key={`${connection.id}-${index}`}>
                    <path
                      d={`M ${sourcePos.x} ${sourcePos.y} Q ${cx} ${cy} ${targetPos.x} ${targetPos.y}`}
                      stroke="hsl(214 20% 78%)"
                      strokeWidth={1.5}
                      fill="none"
                      opacity={0.85}
                    />
                    <text x={cx} y={cy - 4} textAnchor="middle" className="text-[9px] fill-muted-foreground">
                      {connection.relationshipType}
                    </text>
                  </g>
                );
              })}

              {visibleAssets.map((asset) => {
                const position = nodePositions[asset.id];
                if (!position) {
                  return null;
                }

                const statusDot =
                  asset.status === "online" ? "#10B981" : asset.status === "offline" ? "#EF4444" : "#F59E0B";
                const isHighlighted = highlightedAssetId === asset.id;
                const isHovered = hoveredAssetId === asset.id;

                return (
                  <g
                    key={asset.id}
                    className="cursor-pointer"
                    onMouseDown={(event) => startDragging(event, asset.id)}
                    onMouseEnter={() => setHoveredAssetId(asset.id)}
                    onMouseLeave={() => setHoveredAssetId((current) => (current === asset.id ? null : current))}
                    onClick={() => {
                      if (dragDistance < 6) {
                        router.push(`/assets/${asset.id}`);
                      }
                    }}
                  >
                    {isHighlighted && (
                      <circle cx={position.x} cy={position.y} r={44} fill="none" stroke="#3B82F6" strokeWidth={2.5} opacity={0.8} />
                    )}
                    <circle
                      cx={position.x}
                      cy={position.y}
                      r={34}
                      fill="hsl(0 0% 100%)"
                      stroke={isHighlighted ? "#3B82F6" : isHovered ? "hsl(214 30% 62%)" : "hsl(214 20% 88%)"}
                      strokeWidth={isHighlighted ? 2.5 : isHovered ? 2 : 1.5}
                    />
                    <circle cx={position.x} cy={position.y} r={32} fill={isHovered ? "hsl(210 40% 95%)" : "hsl(210 20% 98%)"} />
                    <text x={position.x} y={position.y - 5} textAnchor="middle" className="text-[10px] font-semibold fill-foreground">
                      {asset.name.length > 14 ? `${asset.name.slice(0, 14)}...` : asset.name}
                    </text>
                    <text x={position.x} y={position.y + 9} textAnchor="middle" className="text-[9px] fill-muted-foreground capitalize">
                      {asset.type}
                    </text>
                    <circle cx={position.x + 24} cy={position.y - 24} r={5} fill={statusDot} />
                  </g>
                );
              })}

              {hoveredAssetId && nodePositions[hoveredAssetId] && assetById.get(hoveredAssetId) && (() => {
                const asset = assetById.get(hoveredAssetId)!;
                const point = nodePositions[hoveredAssetId]!;
                const x = Math.min(point.x + 44, LAYOUT_WIDTH - 250);
                const y = Math.max(point.y - 70, 20);
                return (
                  <g pointerEvents="none">
                    <rect x={x} y={y} width={210} height={72} rx={8} fill="hsl(210 20% 14%)" opacity={0.95} />
                    <text x={x + 10} y={y + 18} className="text-[10px] fill-white font-semibold">
                      {asset.name}
                    </text>
                    <text x={x + 10} y={y + 34} className="text-[9px] fill-slate-200 capitalize">
                      {asset.type} · {asset.status}
                    </text>
                    <text x={x + 10} y={y + 50} className="text-[9px] fill-slate-200">
                      IP: {asset.ipAddress}
                    </text>
                    <text x={x + 10} y={y + 66} className="text-[9px] fill-slate-300">
                      {asset.location}
                    </text>
                  </g>
                );
              })()}
              </g>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

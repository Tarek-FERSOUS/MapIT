"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Server, Monitor, Wifi, HardDrive, Cloud } from "lucide-react";
import { apiClient, getApiErrorMessage } from "@/lib/api";
import { Asset, Problem } from "@/types/api";

export default function AssetDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<"overview" | "problems">("overview");
  const [asset, setAsset] = useState<Asset | null>(null);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const typeIcons: Record<Asset["type"], React.ElementType> = {
    server: Server,
    vm: Monitor,
    "network-device": Wifi,
    network: Wifi,
    storage: HardDrive,
    service: Cloud
  };

  const statusStyles: Record<Asset["status"], string> = {
    online: "bg-accent/10 text-accent border-accent/20",
    offline: "bg-destructive/10 text-destructive border-destructive/20",
    warning: "bg-warning/10 text-warning border-warning/20",
    maintenance: "bg-muted text-muted-foreground border-border"
  };

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        const [assetData, problemsData] = await Promise.all([
          apiClient.get<Asset>(`/assets/${params.id}`),
          apiClient.get<{ items: Problem[] }>("/problems")
        ]);
        setAsset(assetData);
        setProblems(problemsData.items || []);
      } catch (error) {
        setError(getApiErrorMessage(error, "Failed to load asset details"));
      }
    };

    if (params.id) {
      load();
    }
  }, [params.id]);

  const relatedProblems = useMemo(() => {
    if (!asset) {
      return [];
    }
    return problems.filter((problem) =>
      problem.affectedAssets.includes(asset.id) || problem.affectedAssets.includes(asset.name)
    );
  }, [asset, problems]);

  return (
    <div className="space-y-6 animate-fade-in">
      {error && <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      {!asset ? (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-muted-foreground">Asset not found</p>
          <button
            className="mt-4 h-9 px-4 rounded-md border border-border bg-card text-sm"
            onClick={() => router.push("/assets")}
          >
            Back to Assets
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <button
              className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-muted"
              onClick={() => router.push("/assets")}
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-3 flex-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                {(() => {
                  const TypeIcon = typeIcons[asset.type];
                  return <TypeIcon className="h-5 w-5 text-primary" />;
                })()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl">{asset.name}</h1>
                  <span className={`text-[10px] px-1.5 py-0 rounded border capitalize ${statusStyles[asset.status]}`}>
                    {asset.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground capitalize">
                  {asset.type} · {asset.location}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="inline-flex rounded-md border border-border/50 bg-muted/50 p-1">
              <button
                className={`px-3 py-1.5 rounded text-sm ${
                  activeTab === "overview" ? "bg-background text-foreground" : "text-muted-foreground"
                }`}
                onClick={() => setActiveTab("overview")}
              >
                Overview
              </button>
              <button
                className={`px-3 py-1.5 rounded text-sm ${
                  activeTab === "problems" ? "bg-background text-foreground" : "text-muted-foreground"
                }`}
                onClick={() => setActiveTab("problems")}
              >
                Problems ({relatedProblems.length})
              </button>
            </div>

            {activeTab === "overview" ? (
              <div className="kpi-shadow border border-border/50 rounded-lg bg-card p-4">
                <h3 className="text-base mb-2">Specifications</h3>
                <div className="space-y-2 text-sm">
                  <div className="py-2 border-b border-border/50">IP Address: {asset.ipAddress}</div>
                  {asset.os && <div className="py-2 border-b border-border/50">Operating System: {asset.os}</div>}
                  {asset.cpu && <div className="py-2 border-b border-border/50">CPU: {asset.cpu}</div>}
                  {asset.memory && <div className="py-2 border-b border-border/50">Memory: {asset.memory}</div>}
                  <div className="py-2 border-b border-border/50">Location: {asset.location}</div>
                  <div className="py-2 border-b border-border/50">Last Updated: {new Date(asset.lastUpdated).toLocaleString()}</div>
                  <div className="py-2 flex items-center gap-2 flex-wrap">
                    <span className="text-muted-foreground">Tags:</span>
                    {(asset.tags || []).map((tag) => (
                      <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-muted">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="kpi-shadow border border-border/50 rounded-lg bg-card p-4 space-y-3">
                {relatedProblems.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No problems recorded for this asset.</p>
                ) : (
                  relatedProblems.map((problem) => (
                    <div key={problem.id} className="p-3 rounded-lg bg-muted/50 border border-border/50">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-foreground">{problem.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{problem.description}</p>
                        </div>
                        <span className="text-[10px] px-1.5 py-0 rounded border bg-warning/10 text-warning border-warning/20">
                          {problem.severity}
                        </span>
                      </div>
                      {problem.solution && (
                        <div className="mt-2 p-2 rounded bg-accent/5 border border-accent/10">
                          <p className="text-xs font-medium text-accent">Solution:</p>
                          <p className="text-xs text-foreground mt-0.5">{problem.solution}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

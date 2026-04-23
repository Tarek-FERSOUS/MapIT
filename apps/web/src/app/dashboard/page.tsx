"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient, getApiErrorMessage } from "@/lib/api";
import { Asset, DashboardSummary, Problem } from "@/types/api";
import { useAuthStore } from "@/store/auth";
import { OpsDashboard } from "@/components/dashboard/ops-dashboard";

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const canViewDashboard = Boolean(user?.permissions?.includes("dashboard:view"));
  const canCreateAsset = Boolean(user?.permissions?.includes("asset:create"));
  const canCreateProblem = Boolean(user?.permissions?.includes("problem:create"));

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setError(null);

        const [summaryData, assetData, problemData] = await Promise.all([
          apiClient.get<DashboardSummary>("/dashboard/summary"),
          apiClient.get<{ items: Asset[] }>("/assets"),
          apiClient.get<{ items: Problem[] }>("/problems")
        ]);

        setSummary(summaryData);
        setAssets(assetData.items || []);
        setProblems(problemData.items || []);
      } catch (err) {
        setError(getApiErrorMessage(err, "Failed to load dashboard"));
      }
    };

    loadDashboard();
  }, []);

  if (!canViewDashboard) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1>Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Infrastructure overview and monitoring</p>
        </div>
        <div className="rounded-md border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          You do not have permission to view the dashboard. Please contact your administrator if you believe this is an error.
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1>Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Infrastructure overview and monitoring</p>
        </div>
        <div className="rounded-md border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1>Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Infrastructure overview and monitoring</p>
        </div>
        <div className="rounded-md border border-border/60 bg-card p-4 text-sm text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <OpsDashboard
      summary={summary}
      assets={assets}
      problems={problems}
      onAddAsset={() => {
        if (canCreateAsset) {
          router.push("/assets");
        }
      }}
      onLogProblem={() => {
        if (canCreateProblem) {
          router.push("/problems");
        }
      }}
      onViewProblems={() => router.push("/problems")}
    />
  );
}

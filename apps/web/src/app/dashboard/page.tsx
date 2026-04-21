"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Server,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Box,
  Plus,
  FileText,
  ArrowRight
} from "lucide-react";
import { apiClient, getApiErrorMessage } from "@/lib/api";
import { DashboardSummary } from "@/types/api";
import { useAuthStore } from "@/store/auth";

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const canViewDashboard = Boolean(user?.permissions?.includes("dashboard:view"));
  const canCreateAsset = Boolean(user?.permissions?.includes("asset:create"));
  const canCreateProblem = Boolean(user?.permissions?.includes("problem:create"));
  
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setError(null);
        const data = await apiClient.get<DashboardSummary>("/dashboard/summary");
        setSummary(data);
      } catch (error) {
        setError(getApiErrorMessage(error, "Failed to load dashboard"));
      }
    };

    loadDashboard();
  }, []);

  const openProblems = useMemo(
    () => summary?.openProblems || [],
    [summary]
  );

  const recentActivity = summary?.recentActivity || [];
  const kpis = summary?.kpis;

  const cardClass = "kpi-shadow border border-border/50 rounded-lg bg-card";

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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1>Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Infrastructure overview and monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          {canCreateAsset && (
            <button
              className="h-8 px-3 inline-flex items-center rounded-md border border-border bg-card text-sm"
              onClick={() => router.push("/assets")}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Asset
            </button>
          )}
          {canCreateProblem && (
            <button
              className="h-8 px-3 inline-flex items-center rounded-md bg-primary text-primary-foreground text-sm"
              onClick={() => router.push("/problems")}
            >
              <FileText className="mr-1.5 h-3.5 w-3.5" /> Log Problem
            </button>
          )}
        </div>
      </div>

      {error && <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={cardClass}>
          <div className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Assets</p>
                <p className="text-3xl font-bold text-foreground mt-1">{kpis?.totalAssets ?? 0}</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-3 w-3 text-accent" />
                  <span className="text-xs font-medium text-accent">+2 this week</span>
                </div>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Box className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>

        <div className={cardClass}>
          <div className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Servers</p>
                <p className="text-3xl font-bold text-foreground mt-1">{kpis?.activeServers ?? 0}</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-3 w-3 text-accent" />
                  <span className="text-xs font-medium text-accent">All healthy</span>
                </div>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <Server className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>

        <div className={cardClass}>
          <div className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Open Problems</p>
                <p className="text-3xl font-bold text-foreground mt-1">{kpis?.openProblems ?? 0}</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingDown className="h-3 w-3 text-destructive" />
                  <span className="text-xs font-medium text-destructive">-1 from last week</span>
                </div>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 text-warning">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>

        <div className={cardClass}>
          <div className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Resolved This Month</p>
                <p className="text-3xl font-bold text-foreground mt-1">{kpis?.resolvedThisMonth ?? 0}</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-3 w-3 text-accent" />
                  <span className="text-xs font-medium text-accent">+2 resolved</span>
                </div>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={cardClass}>
          <div className="p-4 border-b border-border/50 flex items-center justify-between">
            <h3 className="text-base font-semibold">Open Problems</h3>
            <button className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center">
              View all <ArrowRight className="ml-1 h-3 w-3" />
            </button>
          </div>
          <div className="p-4 space-y-3">
            {openProblems.map((problem) => (
              <div key={problem.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{problem.title}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] px-1.5 py-0 rounded border bg-warning/10 text-warning border-warning/20">
                      {problem.severity}
                    </span>
                    <span className="text-xs text-muted-foreground">{problem.affectedAssets.join(", ")}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={cardClass}>
          <div className="p-4 border-b border-border/50">
            <h3 className="text-base font-semibold">Recent Activity</h3>
          </div>
          <div className="p-4 space-y-4">
            {recentActivity.map((item) => (
              <div key={item.id} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold bg-primary/10 text-primary">
                  {item.type === "incident" ? "IN" : "DOC"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">{item.title}</span>
                    <span className="text-muted-foreground"> ({item.type})</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(item.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </p>
                </div>
              </div>
            ))}
            {recentActivity.length === 0 && <p className="text-sm text-muted-foreground">No recent activity.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

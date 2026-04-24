"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient, getApiErrorMessage } from "@/lib/api";
import { Asset, DashboardSummary, Problem } from "@/types/api";
import { useAuthStore } from "@/store/auth";
import { OpsDashboard } from "@/components/dashboard/ops-dashboard";
import { ExportMenu } from "@/components/ui";

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

  const exportDashboardCsv = () => {
    if (!summary) return;

    const lines = ["key,value"];
    lines.push(`Total Assets,${assets.length}`);
    lines.push(`Total Problems,${problems.length}`);
    lines.push(`Active Servers,${summary.kpis.activeServers ?? 0}`);
    lines.push(`Open Problems,${summary.kpis.openProblems ?? 0}`);
    lines.push(`Export Date,${new Date().toISOString()}`);

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `dashboard-summary-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const exportDashboardPdf = () => {
    if (!summary) return;

    const win = window.open("", "_blank", "width=1100,height=800");
    if (!win) return;

    win.document.write(`
      <html>
        <head>
          <title>Dashboard Export</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; }
            h1 { margin-bottom: 8px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #f5f5f5; }
          </style>
        </head>
        <body>
          <h1>Dashboard Summary</h1>
          <p>Generated at ${new Date().toLocaleString()}</p>
          <table>
            <thead><tr><th>Metric</th><th>Value</th></tr></thead>
            <tbody>
              <tr><td>Total Assets</td><td>${assets.length}</td></tr>
              <tr><td>Total Problems</td><td>${problems.length}</td></tr>
              <tr><td>Active Servers</td><td>${summary.kpis.activeServers ?? 0}</td></tr>
              <tr><td>Open Problems</td><td>${summary.kpis.openProblems ?? 0}</td></tr>
            </tbody>
          </table>
        </body>
      </html>
    `);

    win.document.close();
    win.focus();
    win.print();
  };

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
      onExportCsv={exportDashboardCsv}
      onExportPdf={exportDashboardPdf}
    />
  );
}

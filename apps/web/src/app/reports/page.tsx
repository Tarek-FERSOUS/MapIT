"use client";

import { useEffect, useMemo, useState } from "react";
import { apiClient, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { ExportMenu } from "@/components/ui";

interface ReportsSummary {
  assetsByType: { type: string; count: number }[];
  problemsBySeverity: { severity: string; count: number }[];
}

export default function ReportsPage() {
  const user = useAuthStore((state) => state.user);
  const canViewReports = Boolean(user?.permissions?.includes("report:view"));
  
  const [summary, setSummary] = useState<ReportsSummary>({
    assetsByType: [],
    problemsBySeverity: []
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadReports = async () => {
      try {
        setError(null);
        const data = await apiClient.get<ReportsSummary>("/reports/summary");
        setSummary(data);
      } catch (error) {
        setError(getApiErrorMessage(error, "Failed to load reports"));
      }
    };

    loadReports();
  }, []);

  const maxAssetCount = useMemo(
    () => Math.max(...summary.assetsByType.map((item) => item.count), 1),
    [summary.assetsByType]
  );
  const maxProblemCount = useMemo(
    () => Math.max(...summary.problemsBySeverity.map((item) => item.count), 1),
    [summary.problemsBySeverity]
  );

  const exportCsv = () => {
    const lines = ["section,label,count"];

    for (const item of summary.assetsByType) {
      lines.push(`assets_by_type,${JSON.stringify(item.type)},${item.count}`);
    }

    for (const item of summary.problemsBySeverity) {
      lines.push(`problems_by_severity,${JSON.stringify(item.severity)},${item.count}`);
    }

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `reports-summary-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    const win = window.open("", "_blank", "width=1100,height=800");
    if (!win) {
      return;
    }

    const assetsRows = summary.assetsByType
      .map((item) => `<tr><td>${item.type}</td><td>${item.count}</td></tr>`)
      .join("");
    const problemsRows = summary.problemsBySeverity
      .map((item) => `<tr><td>${item.severity}</td><td>${item.count}</td></tr>`)
      .join("");

    win.document.write(`
      <html>
        <head>
          <title>Reports Summary</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; }
            h1 { margin-bottom: 8px; }
            h2 { margin-top: 24px; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
            th { background: #f5f5f5; }
          </style>
        </head>
        <body>
          <h1>Reports Summary</h1>
          <p>Generated at ${new Date().toLocaleString()}</p>

          <h2>Assets by Type</h2>
          <table>
            <thead><tr><th>Type</th><th>Count</th></tr></thead>
            <tbody>${assetsRows || "<tr><td colspan='2'>No data</td></tr>"}</tbody>
          </table>

          <h2>Problems by Severity</h2>
          <table>
            <thead><tr><th>Severity</th><th>Count</th></tr></thead>
            <tbody>${problemsRows || "<tr><td colspan='2'>No data</td></tr>"}</tbody>
          </table>
        </body>
      </html>
    `);

    win.document.close();
    win.focus();
    win.print();
  };

  if (!canViewReports) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1>Reports</h1>
          <p className="text-muted-foreground text-sm mt-1">Infrastructure analytics and insights</p>
        </div>
        <div className="rounded-md border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          You do not have permission to view reports. Please contact your administrator if you believe this is an error.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1>Reports</h1>
        <p className="text-muted-foreground text-sm mt-1">Infrastructure analytics and insights</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <ExportMenu onExportCsv={exportCsv} onExportPdf={exportPdf} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="kpi-shadow border border-border/50 rounded-lg bg-card p-4">
          <h3 className="text-base mb-4">Assets by Type</h3>
          <div className="space-y-3">
            {summary.assetsByType.map((item) => (
              <div key={item.type}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="capitalize">{item.type}</span>
                  <span className="text-muted-foreground">{item.count}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${(item.count / maxAssetCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {summary.assetsByType.length === 0 && <p className="text-sm text-muted-foreground">No data available.</p>}
          </div>
        </div>

        <div className="kpi-shadow border border-border/50 rounded-lg bg-card p-4">
          <h3 className="text-base mb-4">Problems by Severity</h3>
          <div className="space-y-3">
            {summary.problemsBySeverity.map((item) => (
              <div key={item.severity}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="capitalize">{item.severity}</span>
                  <span className="text-muted-foreground">{item.count}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-warning"
                    style={{ width: `${(item.count / maxProblemCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {summary.problemsBySeverity.length === 0 && <p className="text-sm text-muted-foreground">No data available.</p>}
          </div>
        </div>
      </div>

      {error && <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { apiClient, getApiErrorMessage } from "@/lib/api";

interface ReportsSummary {
  assetsByType: { type: string; count: number }[];
  problemsBySeverity: { severity: string; count: number }[];
}

export default function ReportsPage() {
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1>Reports</h1>
        <p className="text-muted-foreground text-sm mt-1">Infrastructure analytics and insights</p>
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

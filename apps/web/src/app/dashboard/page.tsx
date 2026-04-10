"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import { DashboardSummary } from "@/types/api";
import {
  TrendingUp,
  AlertCircle,
  FileText,
  Users,
  ArrowRight
} from "lucide-react";

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setIsLoading(true);
        const data = await apiClient.get<DashboardSummary>("/dashboard/summary");
        setSummary(data);
      } catch (err) {
        setError("Failed to load dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, []);

  return (
    <div className="container py-8 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-2">
          Welcome back! Here&apos;s what&apos;s happening across your infrastructure.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card h-32 animate-pulse bg-slate-100" />
          ))}
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Incidents Card */}
            <div className="card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Incidents</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">
                    {summary?.kpis.incidents || 0}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-4 text-sm text-emerald-600">
                <TrendingUp className="w-4 h-4" />
                <span>2% increase this month</span>
              </div>
            </div>

            {/* Documents Card */}
            <div className="card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Documents</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">
                    {summary?.kpis.documents || 0}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-4 text-sm text-emerald-600">
                <TrendingUp className="w-4 h-4" />
                <span>5% increase this month</span>
              </div>
            </div>

            {/* Users Card */}
            <div className="card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Users</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">
                    {summary?.kpis.users || 0}
                  </p>
                </div>
                <div className="p-3 bg-emerald-100 rounded-lg">
                  <Users className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-4 text-sm text-slate-600">
                <span>Active last 7 days</span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Recent Activity
            </h2>
            {!summary?.recentActivity?.length ? (
              <p className="text-slate-500 text-sm">No recent activity</p>
            ) : (
              <div className="space-y-4">
                {summary.recentActivity.map((activity) => (
                  <div key={`${activity.type}-${activity.id}`} className="flex items-start gap-3 pb-4 border-b border-slate-200 last:border-0">
                    <div
                      className={`mt-1 w-2 h-2 rounded-full ${
                        activity.type === "incident"
                          ? "bg-blue-500"
                          : "bg-purple-500"
                      }`}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">
                        {activity.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {activity.type === "incident" ? "Incident" : "Document"} •{" "}
                        {new Date(activity.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link href="/incidents/new" className="card hover:shadow-md transition-shadow group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">Log New Incident</p>
                  <p className="text-sm text-slate-600 mt-1">
                    Report a new issue or problem
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-primary-600 transition-colors" />
              </div>
            </Link>

            <Link href="/documents/new" className="card hover:shadow-md transition-shadow group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">Add Document</p>
                  <p className="text-sm text-slate-600 mt-1">
                    Create a new knowledge base entry
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-primary-600 transition-colors" />
              </div>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

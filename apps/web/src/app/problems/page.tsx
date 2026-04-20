"use client";

import { useMemo, useState } from "react";
import { useEffect } from "react";
import { Search, Plus, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { apiClient, getApiErrorMessage } from "@/lib/api";
import { Asset, Problem } from "@/types/api";

export default function ProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    severity: "medium" as Problem["severity"],
    status: "open" as Problem["status"],
    solution: "",
    affectedAssets: [] as string[]
  });

  useEffect(() => {
    const loadProblems = async () => {
      try {
        setError(null);
        const [problemData, assetData] = await Promise.all([
          apiClient.get<{ items: Problem[] }>("/problems"),
          apiClient.get<{ items: Asset[] }>("/assets")
        ]);
        const next = problemData.items || [];
        setProblems(next);
        setAssets(assetData.items || []);
        setSelectedId((current) => {
          if (current) {
            return current;
          }
          return next.length > 0 ? next[0].id : null;
        });
      } catch (error) {
        setError(getApiErrorMessage(error, "Failed to load problems"));
      }
    };

    loadProblems();
  }, []);

  const severityStyles: Record<Problem["severity"], string> = {
    critical: "bg-destructive/10 text-destructive border-destructive/20",
    high: "bg-warning/10 text-warning border-warning/20",
    medium: "bg-primary/10 text-primary border-primary/20",
    low: "bg-muted text-muted-foreground border-border"
  };

  const statusIcons: Record<Problem["status"], React.ElementType> = {
    open: AlertTriangle,
    "in-progress": Clock,
    investigating: Clock,
    resolved: CheckCircle2
  };

  const statusColors: Record<Problem["status"], string> = {
    open: "text-destructive",
    "in-progress": "text-warning",
    investigating: "text-warning",
    resolved: "text-accent"
  };

  const filtered = useMemo(() => {
    return problems.filter((problem) => {
      const matchSearch =
        problem.title.toLowerCase().includes(search.toLowerCase()) ||
        problem.affectedAssets.some((asset) => asset.toLowerCase().includes(search.toLowerCase()));
      const matchSeverity = severityFilter === "all" || problem.severity === severityFilter;
      const matchStatus = statusFilter === "all" || problem.status === statusFilter;
      return matchSearch && matchSeverity && matchStatus;
    });
  }, [problems, search, severityFilter, statusFilter]);

  const selected = useMemo(() => problems.find((problem) => problem.id === selectedId), [problems, selectedId]);

  const assetNameById = useMemo(() => {
    const nameMap: Record<string, string> = {};
    assets.forEach((asset) => {
      nameMap[asset.id] = asset.name;
    });
    return nameMap;
  }, [assets]);

  const toggleAffectedAsset = (assetId: string) => {
    setForm((previous) => {
      const exists = previous.affectedAssets.includes(assetId);
      return {
        ...previous,
        affectedAssets: exists
          ? previous.affectedAssets.filter((id) => id !== assetId)
          : [...previous.affectedAssets, assetId]
      };
    });
  };

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      severity: "medium",
      status: "open",
      solution: "",
      affectedAssets: []
    });
    setCreateError(null);
  };

  const handleCreateProblem = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreateError(null);
    setCreating(true);

    try {
      const created = await apiClient.post<Problem>("/problems", {
        title: form.title,
        description: form.description,
        severity: form.severity,
        status: form.status,
        affectedAssets: form.affectedAssets,
        ...(form.solution.trim() ? { solution: form.solution.trim() } : {})
      });

      setProblems((previous) => [created, ...previous]);
      setSelectedId(created.id);
      setShowCreateForm(false);
      resetForm();
    } catch (err) {
      setCreateError(getApiErrorMessage(err, "Failed to create problem"));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1>Knowledge Base</h1>
          <p className="text-muted-foreground text-sm mt-1">Problems and solutions</p>
        </div>
        <button
          className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-sm inline-flex items-center"
          title="Add problem"
          aria-label="Add problem"
          onClick={() => {
            setShowCreateForm((previous) => !previous);
            if (showCreateForm) {
              resetForm();
            }
          }}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Problem
        </button>
      </div>

      {error && <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      {showCreateForm && (
        <div className="kpi-shadow border border-border/50 rounded-lg bg-card p-4">
          <form onSubmit={handleCreateProblem} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="text-xs text-muted-foreground">Title</label>
                <input
                  title="Problem title"
                  aria-label="Problem title"
                  required
                  value={form.title}
                  onChange={(event) => setForm((previous) => ({ ...previous, title: event.target.value }))}
                  className="mt-1 w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-muted-foreground">Description</label>
                <textarea
                  title="Problem description"
                  aria-label="Problem description"
                  required
                  value={form.description}
                  onChange={(event) => setForm((previous) => ({ ...previous, description: event.target.value }))}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Severity</label>
                <select
                  title="Problem severity"
                  aria-label="Problem severity"
                  value={form.severity}
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, severity: event.target.value as Problem["severity"] }))
                  }
                  className="mt-1 w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
                >
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Status</label>
                <select
                  title="Problem status"
                  aria-label="Problem status"
                  value={form.status}
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, status: event.target.value as Problem["status"] }))
                  }
                  className="mt-1 w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
                >
                  <option value="open">Open</option>
                  <option value="investigating">Investigating</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-muted-foreground">Solution (optional)</label>
                <textarea
                  title="Problem solution"
                  aria-label="Problem solution"
                  value={form.solution}
                  onChange={(event) => setForm((previous) => ({ ...previous, solution: event.target.value }))}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  rows={2}
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-2">Affected Assets</h3>
              {assets.length === 0 ? (
                <p className="text-xs text-muted-foreground">No assets available.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-auto p-2 border border-border/50 rounded-md">
                  {assets.map((asset) => (
                    <label key={asset.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={form.affectedAssets.includes(asset.id)}
                        onChange={() => toggleAffectedAsset(asset.id)}
                      />
                      <span>{asset.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {createError && (
              <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                {createError}
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={creating}
                className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm disabled:opacity-60"
              >
                {creating ? "Logging..." : "Log Problem"}
              </button>
              <button
                type="button"
                className="h-9 px-4 rounded-md border border-border bg-background text-sm"
                onClick={() => {
                  setShowCreateForm(false);
                  resetForm();
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="w-full lg:w-[380px] shrink-0 space-y-3">
          <div className="kpi-shadow border border-border/50 rounded-lg bg-card p-3 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                placeholder="Search problems..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full h-9 rounded-md border-0 bg-muted pl-9 pr-3 text-sm"
              />
            </div>

            <div className="flex gap-2">
              <select
                aria-label="Filter problems by severity"
                value={severityFilter}
                onChange={(event) => setSeverityFilter(event.target.value)}
                className="h-8 text-xs flex-1 rounded-md border border-border bg-background px-2"
              >
                <option value="all">All Severity</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select
                aria-label="Filter problems by status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-8 text-xs flex-1 rounded-md border border-border bg-background px-2"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="investigating">Investigating</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            {filtered.map((problem) => {
              const StatusIcon = statusIcons[problem.status];
              return (
                <button
                  key={problem.id}
                  onClick={() => setSelectedId(problem.id)}
                  className={`w-full text-left kpi-shadow border border-border/50 rounded-lg bg-card p-3 transition-all hover:border-primary/30 ${
                    selectedId === problem.id ? "border-primary ring-1 ring-primary/20" : ""
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <StatusIcon className={`h-4 w-4 mt-0.5 shrink-0 ${statusColors[problem.status]}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{problem.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] px-1.5 py-0 rounded border ${severityStyles[problem.severity]}`}>
                          {problem.severity}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(problem.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}

            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No problems found.</p>
            )}
          </div>
        </div>

        <div className="flex-1 kpi-shadow border border-border/50 rounded-lg bg-card">
          <div className="p-6">
            {selected ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded border ${severityStyles[selected.severity]}`}>
                      {selected.severity}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded border border-border capitalize">{selected.status}</span>
                  </div>
                  <h2 className="text-lg">{selected.title}</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Reported {new Date(selected.createdAt).toLocaleString()}
                    {selected.resolvedAt && ` · Resolved ${new Date(selected.resolvedAt).toLocaleString()}`}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">Description</h3>
                  <p className="text-sm text-muted-foreground">{selected.description}</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">Affected Assets</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.affectedAssets.map((assetId) => (
                      <span key={assetId} className="text-xs px-2 py-0.5 rounded-full bg-muted">
                        {assetNameById[assetId] || assetId}
                      </span>
                    ))}
                  </div>
                </div>

                {selected.solution && (
                  <div className="p-4 rounded-lg bg-accent/5 border border-accent/15">
                    <h3 className="text-sm font-semibold text-accent mb-1">✓ Solution</h3>
                    <p className="text-sm text-foreground">{selected.solution}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-20">Select a problem to view details</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

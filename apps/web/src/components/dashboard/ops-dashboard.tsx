"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Box,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  EyeOff,
  FileText,
  Plus,
  Server,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Zap
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  Treemap,
  XAxis,
  YAxis
} from "recharts";
import { Asset, DashboardSummary, Problem } from "@/types/api";
import {
  buildAssetTreemap,
  buildIncidentTrends,
  buildResourceUtilization,
  buildServiceHealth,
  buildUptimeHeatmap
} from "@/lib/dashboard-transformers";
import { ExportMenu } from "@/components/ui";

type WidgetId =
  | "incident-trends"
  | "uptime-heatmap"
  | "open-problems"
  | "recent-activity"
  | "resource-util"
  | "service-health"
  | "mttr"
  | "asset-distribution";

interface OpsDashboardProps {
  summary: DashboardSummary;
  assets: Asset[];
  problems: Problem[];
  onAddAsset: () => void;
  onLogProblem: () => void;
  onViewProblems: () => void;
  onExportCsv: () => void;
  onExportPdf: () => void;
}

interface DashboardLayout {
  order: WidgetId[];
  visible: Record<WidgetId, boolean>;
}

const LAYOUT_STORAGE_KEY = "mapit-dashboard-layout-v2";

const DEFAULT_WIDGET_ORDER: WidgetId[] = [
  "incident-trends",
  "uptime-heatmap",
  "open-problems",
  "recent-activity",
  "resource-util",
  "service-health",
  "mttr",
  "asset-distribution"
];

const DEFAULT_WIDGET_VISIBILITY: Record<WidgetId, boolean> = {
  "incident-trends": true,
  "uptime-heatmap": true,
  "open-problems": true,
  "recent-activity": true,
  "resource-util": true,
  "service-health": true,
  mttr: true,
  "asset-distribution": true
};

const tooltipStyle = {
  background: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  fontSize: 12,
  color: "hsl(var(--popover-foreground))"
};

const WIDGET_LABELS: Record<WidgetId, string> = {
  "incident-trends": "Incident Trends",
  "uptime-heatmap": "Uptime Heatmap",
  "open-problems": "Open Problems",
  "recent-activity": "Recent Activity",
  "resource-util": "Resource Utilization",
  "service-health": "Service Health",
  mttr: "MTTR Trend",
  "asset-distribution": "Asset Distribution"
};

const WIDGET_SPANS: Record<WidgetId, string> = {
  "incident-trends": "lg:col-span-2",
  "uptime-heatmap": "lg:col-span-2",
  "open-problems": "lg:col-span-2",
  "recent-activity": "lg:col-span-2",
  "resource-util": "lg:col-span-2",
  "service-health": "lg:col-span-1",
  mttr: "lg:col-span-1",
  "asset-distribution": "lg:col-span-2"
};

function getDefaultLayout(): DashboardLayout {
  return {
    order: [...DEFAULT_WIDGET_ORDER],
    visible: { ...DEFAULT_WIDGET_VISIBILITY }
  };
}

function loadLayout(): DashboardLayout {
  if (typeof window === "undefined") {
    return getDefaultLayout();
  }

  try {
    const raw = window.localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (!raw) {
      return getDefaultLayout();
    }

    const parsed = JSON.parse(raw) as Partial<DashboardLayout>;
    const order = Array.isArray(parsed.order)
      ? parsed.order.filter((id): id is WidgetId => DEFAULT_WIDGET_ORDER.includes(id as WidgetId))
      : [];

    DEFAULT_WIDGET_ORDER.forEach((id) => {
      if (!order.includes(id)) {
        order.push(id);
      }
    });

    const visible: Record<WidgetId, boolean> = { ...DEFAULT_WIDGET_VISIBILITY };
    if (parsed.visible && typeof parsed.visible === "object") {
      DEFAULT_WIDGET_ORDER.forEach((id) => {
        if (typeof parsed.visible?.[id] === "boolean") {
          visible[id] = Boolean(parsed.visible[id]);
        }
      });
    }

    return { order, visible };
  } catch {
    return getDefaultLayout();
  }
}

export function OpsDashboard({ summary, assets, problems, onAddAsset, onLogProblem, onViewProblems, onExportCsv, onExportPdf }: OpsDashboardProps) {
  const [layout, setLayout] = useState<DashboardLayout>(() => loadLayout());

  const incidentTrends = useMemo(() => buildIncidentTrends(summary), [summary]);
  const uptimeHeatmap = useMemo(() => buildUptimeHeatmap(), []);
  const resourceUtilization = useMemo(() => buildResourceUtilization(assets), [assets]);
  const serviceHealth = useMemo(() => buildServiceHealth(problems), [problems]);
  const assetTreemap = useMemo(() => buildAssetTreemap(assets), [assets]);

  const kpis = summary.kpis;
  const openedSpark = incidentTrends.map((point) => point.opened);
  const resolvedSpark = incidentTrends.map((point) => point.resolved);
  const mttrSpark = incidentTrends.map((point) => point.mttr);
  const openProblems = summary.openProblems || [];
  const recentActivity = summary.recentActivity || [];

  const persistLayout = (next: DashboardLayout) => {
    setLayout(next);
    try {
      window.localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // no-op
    }
  };

  const moveWidget = (id: WidgetId, direction: "up" | "down") => {
    const index = layout.order.indexOf(id);
    if (index < 0) {
      return;
    }

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= layout.order.length) {
      return;
    }

    const nextOrder = [...layout.order];
    [nextOrder[index], nextOrder[targetIndex]] = [nextOrder[targetIndex], nextOrder[index]];
    persistLayout({ ...layout, order: nextOrder });
  };

  const toggleWidgetVisibility = (id: WidgetId) => {
    persistLayout({
      ...layout,
      visible: {
        ...layout.visible,
        [id]: !layout.visible[id]
      }
    });
  };

  const resetLayout = () => {
    persistLayout(getDefaultLayout());
  };

  const renderedWidgets = useMemo(() => {
    const widgetMap: Record<WidgetId, React.ReactNode> = {
      "incident-trends": (
        <Card title="Incident Trends" subtitle="Last 14 days · opened vs resolved" icon={<Activity className="h-4 w-4 text-primary" />}>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={incidentTrends} margin={{ top: 6, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="opened" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="resolved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "hsl(var(--border))" }} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconType="circle" />
              <Area type="monotone" dataKey="opened" stroke="hsl(var(--destructive))" strokeWidth={2} fill="url(#opened)" name="Opened" />
              <Area type="monotone" dataKey="resolved" stroke="hsl(var(--accent))" strokeWidth={2} fill="url(#resolved)" name="Resolved" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      ),
      "uptime-heatmap": (
        <Card title="Uptime Heatmap" subtitle="Hourly availability · last 7 days" icon={<Zap className="h-4 w-4 text-warning" />}>
          <UptimeGrid data={uptimeHeatmap} />
        </Card>
      ),
      "open-problems": (
        <OpenProblemsCard openProblems={openProblems} onViewProblems={onViewProblems} />
      ),
      "recent-activity": (
        <Card title="Recent Activity" subtitle="Latest incidents and documents" icon={<Activity className="h-4 w-4 text-primary" />}>
          <div className="space-y-3">
            {recentActivity.map((item) => (
              <div key={item.id} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold bg-primary/10 text-primary">
                  {item.type === "incident" ? "IN" : "DOC"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground line-clamp-1">
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
        </Card>
      ),
      "resource-util": (
        <Card title="Resource Utilization" subtitle="CPU / Memory / Disk by host" icon={<Server className="h-4 w-4 text-primary" />}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={resourceUtilization} margin={{ top: 6, right: 8, left: -16, bottom: 0 }} barGap={2}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} interval={0} angle={-15} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} domain={[0, 100]} unit="%" />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "hsl(var(--muted) / 0.5)" }} />
              <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
              <Bar dataKey="cpu" fill="hsl(var(--chart-1))" name="CPU" radius={[3, 3, 0, 0]} />
              <Bar dataKey="memory" fill="hsl(var(--chart-2))" name="Memory" radius={[3, 3, 0, 0]} />
              <Bar dataKey="disk" fill="hsl(var(--chart-3))" name="Disk" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      ),
      "service-health": (
        <Card title="Service Health" subtitle="Real-time service scores" icon={<Sparkles className="h-4 w-4 text-accent" />}>
          <ResponsiveContainer width="100%" height={220}>
            <RadialBarChart innerRadius="25%" outerRadius="100%" data={serviceHealth} startAngle={90} endAngle={-270}>
              <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
              <RadialBar background={{ fill: "hsl(var(--muted))" }} dataKey="health" cornerRadius={6} fill="hsl(var(--chart-2))" />
              <Tooltip contentStyle={tooltipStyle} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-1 gap-1.5 mt-2">
            {serviceHealth.map((service) => (
              <div key={service.name} className="flex items-center gap-1.5 text-[11px]">
                <span className="h-2 w-2 rounded-full shrink-0 bg-accent" />
                <span className="truncate text-muted-foreground">{service.name}</span>
                <span className="ml-auto font-semibold text-foreground tabular-nums">{service.health}</span>
              </div>
            ))}
          </div>
        </Card>
      ),
      mttr: (
        <Card title="MTTR Trend" subtitle="Minutes per day" icon={<Clock className="h-4 w-4 text-warning" />}>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={incidentTrends} margin={{ top: 6, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} unit="m" />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="mttr" stroke="hsl(var(--warning))" strokeWidth={2.5} dot={{ r: 3, fill: "hsl(var(--warning))" }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      ),
      "asset-distribution": (
        <Card title="Asset Distribution" subtitle="By location and category" icon={<Box className="h-4 w-4 text-primary" />}>
          <ResponsiveContainer width="100%" height={220}>
            <Treemap
              data={assetTreemap.flatMap((group) =>
                group.children.map((child) => ({
                  name: `${group.name} · ${child.name}`,
                  size: child.size,
                  fill: child.fill
                }))
              )}
              dataKey="size"
              stroke="hsl(var(--background))"
              content={<TreemapCell />}
            />
          </ResponsiveContainer>
        </Card>
      )
    };

    return layout.order
      .filter((id) => layout.visible[id])
      .map((id) => ({
        id,
        span: WIDGET_SPANS[id],
        node: widgetMap[id]
      }));
  }, [
    layout.order,
    layout.visible,
    incidentTrends,
    uptimeHeatmap,
    openProblems,
    recentActivity,
    resourceUtilization,
    serviceHealth,
    assetTreemap,
    onViewProblems
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="relative rounded-xl border border-border/60 widget-shadow overflow-visible">
        <div className="absolute inset-0 overflow-hidden rounded-xl">
          <div className="absolute inset-0 grid-bg opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
        </div>
        <div className="relative p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 overflow-visible">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent/15 text-accent">
                <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                Live
              </span>
              <span className="text-xs text-muted-foreground">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric"
                })}
              </span>
            </div>
            <h1 className="mt-2">Operations Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">Real-time visibility across your infrastructure</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <details className="relative">
              <summary className="list-none cursor-pointer h-8 px-3 inline-flex items-center rounded-md border border-border bg-card text-sm select-none">
                Customize
              </summary>
              <div className="absolute right-0 left-0 sm:left-auto sm:right-0 mt-2 w-[min(20rem,calc(100vw-1rem))] sm:w-80 rounded-md border border-border bg-card p-2 shadow-lg z-50 max-h-[70vh] overflow-y-auto">
                <div className="flex items-center justify-between gap-2 px-1 pb-2 border-b border-border/60">
                  <p className="text-xs font-medium text-muted-foreground">Visible widgets</p>
                  <button className="text-xs text-muted-foreground hover:text-foreground" onClick={resetLayout}>
                    Reset
                  </button>
                </div>
                <div className="mt-2 space-y-1">
                  {DEFAULT_WIDGET_ORDER.map((widgetId) => (
                    <label key={widgetId} className="flex items-center gap-2 rounded px-2 py-2 text-sm hover:bg-muted cursor-pointer">
                      <input
                        type="checkbox"
                        checked={layout.visible[widgetId]}
                        onChange={() => toggleWidgetVisibility(widgetId)}
                        className="h-4 w-4 shrink-0"
                      />
                      {layout.visible[widgetId] ? <Eye className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                      <span className="min-w-0 flex-1 break-words">{WIDGET_LABELS[widgetId]}</span>
                    </label>
                  ))}
                </div>
                <p className="px-1 pt-2 text-[11px] text-muted-foreground">Tip: on mobile, swipe the list if it exceeds the screen height.</p>
              </div>
            </details>
            <button className="h-8 px-3 inline-flex items-center rounded-md border border-border bg-card text-sm" onClick={onAddAsset}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Asset
            </button>
            <button className="h-8 px-3 inline-flex items-center rounded-md bg-primary text-primary-foreground text-sm" onClick={onLogProblem}>
              <FileText className="mr-1.5 h-3.5 w-3.5" /> Log Problem
            </button>
            <ExportMenu onExportCsv={onExportCsv} onExportPdf={onExportPdf} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total Assets" value={kpis.totalAssets ?? assets.length} icon={Box} trend="up" trendLabel="+2" sublabel="this week" spark={openedSpark} tone="primary" />
        <KpiCard title="Active Servers" value={kpis.activeServers ?? 0} icon={Server} trend="up" trendLabel="healthy" spark={resolvedSpark} tone="accent" />
        <KpiCard title="Open Problems" value={kpis.openProblems ?? openProblems.length} icon={AlertTriangle} trend="down" trendLabel="-1" sublabel="vs last wk" spark={openedSpark} tone="warning" />
        <KpiCard title="Avg MTTR" value={`${Math.round(mttrSpark.reduce((a, b) => a + b, 0) / Math.max(mttrSpark.length, 1))}m`} icon={CheckCircle2} trend="down" trendLabel="-12%" sublabel="faster" spark={mttrSpark} tone="accent" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {renderedWidgets.map((widget, index) => (
          <div key={widget.id} className={`relative ${widget.span}`}>
            <div className="absolute right-2 top-2 z-10 flex items-center gap-1">
              <button
                className="h-6 w-6 inline-flex items-center justify-center rounded border border-border bg-card/90 text-muted-foreground hover:text-foreground disabled:opacity-30"
                onClick={() => moveWidget(widget.id, "up")}
                disabled={index === 0}
                title="Move up"
                aria-label="Move widget up"
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
              <button
                className="h-6 w-6 inline-flex items-center justify-center rounded border border-border bg-card/90 text-muted-foreground hover:text-foreground disabled:opacity-30"
                onClick={() => moveWidget(widget.id, "down")}
                disabled={index === renderedWidgets.length - 1}
                title="Move down"
                aria-label="Move widget down"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>
            {widget.node}
          </div>
        ))}
      </div>
    </div>
  );
}

function OpenProblemsCard({
  openProblems,
  onViewProblems
}: {
  openProblems: Array<{ id: string; title: string; severity: "low" | "medium" | "high" | "critical"; affectedAssets: string[] }>;
  onViewProblems: () => void;
}) {
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState<"all" | "low" | "medium" | "high" | "critical">("all");
  const [sortBy, setSortBy] = useState<"severity" | "title" | "assets">("severity");

  const severityWeight: Record<"low" | "medium" | "high" | "critical", number> = {
    low: 1,
    medium: 2,
    high: 3,
    critical: 4
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return [...openProblems]
      .filter((problem) => {
        const matchesSearch =
          !q ||
          problem.title.toLowerCase().includes(q) ||
          problem.affectedAssets.some((asset) => asset.toLowerCase().includes(q));
        const matchesSeverity = severity === "all" || problem.severity === severity;
        return matchesSearch && matchesSeverity;
      })
      .sort((a, b) => {
        if (sortBy === "title") {
          return a.title.localeCompare(b.title);
        }

        if (sortBy === "assets") {
          return b.affectedAssets.length - a.affectedAssets.length;
        }

        return severityWeight[b.severity] - severityWeight[a.severity];
      });
  }, [openProblems, search, severity, sortBy]);

  return (
    <Card title="Open Problems" subtitle="Current active issues" icon={<AlertTriangle className="h-4 w-4 text-destructive" />}>
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-8 rounded-md border border-border bg-background px-2.5 text-xs"
            placeholder="Search problem..."
          />
          <select
            title="Filter by severity"
            aria-label="Filter by severity"
            value={severity}
            onChange={(event) => setSeverity(event.target.value as "all" | "low" | "medium" | "high" | "critical")}
            className="h-8 rounded-md border border-border bg-background px-2.5 text-xs"
          >
            <option value="all">All severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select
            title="Sort open problems"
            aria-label="Sort open problems"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as "severity" | "title" | "assets")}
            className="h-8 rounded-md border border-border bg-background px-2.5 text-xs"
          >
            <option value="severity">Sort: Severity</option>
            <option value="title">Sort: Title</option>
            <option value="assets">Sort: Asset Count</option>
          </select>
        </div>

        {filtered.slice(0, 8).map((problem) => (
          <div key={problem.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{problem.title}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[10px] px-1.5 py-0 rounded border bg-warning/10 text-warning border-warning/20">{problem.severity}</span>
                <span className="text-xs text-muted-foreground line-clamp-1">{problem.affectedAssets.join(", ")}</span>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && <p className="text-sm text-muted-foreground">No open problems match the current filter.</p>}

        <button className="h-8 px-3 inline-flex items-center rounded-md border border-border bg-card text-sm" onClick={onViewProblems}>
          View all <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
        </button>
      </div>
    </Card>
  );
}

function Card({ title, subtitle, icon, children }: { title: string; subtitle: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="widget-shadow border border-border/50 rounded-lg bg-card p-4 h-full">
      <div className="mb-3">
        <h3 className="text-base font-semibold flex items-center gap-2">
          {icon}
          {title}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function KpiCard({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  sublabel,
  spark,
  tone
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend: "up" | "down";
  trendLabel: string;
  sublabel?: string;
  spark: number[];
  tone: "primary" | "accent" | "warning";
}) {
  const colorClass = tone === "primary" ? "bg-primary/10 text-primary" : tone === "accent" ? "bg-accent/10 text-accent" : "bg-warning/10 text-warning";
  const sparkData = spark.map((value, index) => ({ index, value }));

  return (
    <div className="widget-shadow border border-border/50 rounded-lg bg-card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-foreground mt-1.5 tabular-nums">{value}</p>
          <div className="flex items-center gap-1 mt-2">
            {trend === "up" ? <TrendingUp className="h-3 w-3 text-accent" /> : <TrendingDown className="h-3 w-3 text-destructive" />}
            <span className={`text-xs font-medium ${trend === "up" ? "text-accent" : "text-destructive"}`}>{trendLabel}</span>
            {sublabel && <span className="text-xs text-muted-foreground">· {sublabel}</span>}
          </div>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorClass}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-3 -mx-1 h-10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sparkData} margin={{ top: 2, right: 2, left: 2, bottom: 0 }}>
            <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} fill="hsl(var(--primary) / 0.2)" isAnimationActive />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function UptimeGrid({ data }: { data: Array<{ day: number; hour: number; value: number }> }) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const cellColor = (value: number) => {
    if (value >= 99.5) {
      return "bg-accent/90";
    }
    if (value >= 98) {
      return "bg-accent/60";
    }
    if (value >= 95) {
      return "bg-warning/70";
    }
    if (value >= 85) {
      return "bg-warning/90";
    }
    return "bg-destructive/80";
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[480px]">
        <div className="flex items-center gap-1 pl-10 mb-1">
          {Array.from({ length: 24 }).map((_, hour) => (
            <div key={hour} className="flex-1 text-center text-[9px] text-muted-foreground tabular-nums">
              {hour % 3 === 0 ? hour : ""}
            </div>
          ))}
        </div>
        {days.map((day, dayIndex) => (
          <div key={day} className="flex items-center gap-1 mb-1">
            <div className="w-9 text-[10px] text-muted-foreground font-medium">{day}</div>
            {Array.from({ length: 24 }).map((_, hour) => {
              const cell = data.find((point) => point.day === dayIndex && point.hour === hour);
              const value = cell?.value || 100;

              return (
                <div
                  key={hour}
                  title={`${day} ${hour}:00 — ${value.toFixed(1)}%`}
                  className={`flex-1 h-5 rounded-sm transition-transform hover:scale-125 cursor-pointer ${cellColor(value)}`}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function TreemapCell(props: any) {
  const { x, y, width, height, name, fill } = props;
  if (width < 1 || height < 1) {
    return null;
  }

  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx={6} fill={fill} stroke="hsl(var(--background))" strokeWidth={2} />
      {width > 60 && height > 28 && (
        <text x={x + 8} y={y + 18} fill="hsl(var(--card))" fontSize={11} fontWeight={600} pointerEvents="none">
          {name}
        </text>
      )}
    </g>
  );
}

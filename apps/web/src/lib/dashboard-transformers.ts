import { Asset, DashboardSummary, Problem } from "@/types/api";

export interface IncidentTrendPoint {
  date: string;
  opened: number;
  resolved: number;
  mttr: number;
}

export interface UptimeCell {
  day: number;
  hour: number;
  value: number;
}

export interface ResourcePoint {
  name: string;
  cpu: number;
  memory: number;
  disk: number;
}

export interface ServiceHealthPoint {
  name: string;
  health: number;
  status: "up" | "degraded" | "down";
}

export interface AssetTreemapGroup {
  name: string;
  children: Array<{ name: string; size: number; fill: string }>;
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))"
];

export function buildIncidentTrends(summary: DashboardSummary): IncidentTrendPoint[] {
  const baseOpened = Math.max(summary.kpis.openProblems || 0, 2);
  const baseResolved = Math.max(summary.kpis.resolvedThisMonth || 0, 2);

  return Array.from({ length: 14 }).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (13 - index));

    return {
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      opened: Math.max(1, Math.round(baseOpened * (0.7 + ((index % 5) * 0.08)))),
      resolved: Math.max(1, Math.round(baseResolved * (0.65 + (((index + 2) % 6) * 0.07)))),
      mttr: Math.max(22, Math.round(65 - index * 2 + ((index % 3) - 1) * 4))
    };
  });
}

export function buildUptimeHeatmap(): UptimeCell[] {
  const cells: UptimeCell[] = [];

  for (let day = 0; day < 7; day += 1) {
    for (let hour = 0; hour < 24; hour += 1) {
      const baseline = 99.5 - ((hour >= 1 && hour <= 5) ? 1.2 : 0.3);
      const jitter = ((day * 13 + hour * 7) % 9) * 0.15;
      const value = Math.max(94, Math.min(100, baseline - jitter));
      cells.push({ day, hour, value });
    }
  }

  return cells;
}

export function buildResourceUtilization(assets: Asset[]): ResourcePoint[] {
  const topAssets = assets.slice(0, 8);

  return topAssets.map((asset, index) => {
    const seed = asset.name.length + index * 11;
    const cpu = Math.min(95, 35 + (seed % 45));
    const memory = Math.min(95, 30 + ((seed * 2) % 50));
    const disk = Math.min(95, 25 + ((seed * 3) % 55));

    return {
      name: asset.name.length > 10 ? `${asset.name.slice(0, 10)}...` : asset.name,
      cpu,
      memory,
      disk
    };
  });
}

export function buildServiceHealth(problems: Problem[]): ServiceHealthPoint[] {
  const services = ["API Gateway", "Auth", "Database", "Asset Service", "Notifications"];
  const openCount = problems.filter((problem) => problem.status !== "resolved").length;

  return services.map((name, index) => {
    const health = Math.max(70, 98 - openCount * 2 - index * 3);
    return {
      name,
      health,
      status: health < 82 ? "down" : health < 90 ? "degraded" : "up"
    };
  });
}

export function buildAssetTreemap(assets: Asset[]): AssetTreemapGroup[] {
  const grouped = new Map<string, Map<string, number>>();

  assets.forEach((asset) => {
    const region = asset.location || "Unknown";
    if (!grouped.has(region)) {
      grouped.set(region, new Map<string, number>());
    }

    const byType = grouped.get(region)!;
    byType.set(asset.type, (byType.get(asset.type) || 0) + 1);
  });

  return Array.from(grouped.entries()).map(([region, typeMap], regionIndex) => ({
    name: region,
    children: Array.from(typeMap.entries()).map(([type, count], typeIndex) => ({
      name: type,
      size: Math.max(1, count),
      fill: COLORS[(regionIndex + typeIndex) % COLORS.length]
    }))
  }));
}

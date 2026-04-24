"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Plus } from "lucide-react";
import { apiClient, getApiErrorMessage } from "@/lib/api";
import { Incident } from "@/types/api";
import { ErrorAlert, LoadingSpinner, EmptyState, IncidentPriorityBadge, IncidentStatusBadge } from "@/components/ui";
import { formatDateTime } from "@/lib/formatting";
import { useAuthStore } from "@/store/auth";

interface IncidentListResponse {
  items: Incident[];
}

export default function IncidentsPage() {
  const user = useAuthStore((state) => state.user);
  const canCreate = Boolean(user?.permissions?.includes("incident:create"));
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadIncidents = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await apiClient.get<IncidentListResponse>("/incidents");
        setIncidents(data.items || []);
      } catch (error) {
        setError(getApiErrorMessage(error, "Failed to load incidents"));
      } finally {
        setIsLoading(false);
      }
    };

    loadIncidents();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      return incidents;
    }

    return incidents.filter((incident) =>
      [incident.title, incident.description].some((value) =>
        String(value).toLowerCase().includes(q)
      )
    );
  }, [incidents, search]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1>Incidents</h1>
          <p className="text-muted-foreground text-sm mt-1">Track, assign, and resolve operational incidents.</p>
        </div>
        {canCreate && (
          <Link href="/incidents/new" className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-sm inline-flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Incident
          </Link>
        )}
      </div>

      <div className="kpi-shadow border border-border/50 rounded-lg bg-card p-3">
        <input
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          placeholder="Search incidents by title or description"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {isLoading ? (
        <div className="kpi-shadow border border-border/50 rounded-lg bg-card py-12">
          <LoadingSpinner />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<AlertCircle className="h-10 w-10" />}
          title={search ? "No matching incidents" : "No incidents yet"}
          description={
            search
              ? "Try a different keyword."
              : "Create your first incident to get started."
          }
          action={canCreate ? <Link href="/incidents/new" className="btn btn-primary">Create Incident</Link> : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((incident) => (
            <Link
              key={incident.id}
              href={`/incidents/${incident.id}`}
              className="kpi-shadow border border-border/50 rounded-lg bg-card p-4 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <h2 className="text-base font-semibold text-foreground">{incident.title}</h2>
                  <p className="text-sm text-muted-foreground line-clamp-2">{incident.description}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <IncidentStatusBadge status={incident.status} />
                    <IncidentPriorityBadge priority={incident.priority} />
                    {incident.assignedTo && (
                      <span className="text-xs text-muted-foreground">
                        Assigned to {incident.assignedTo.username}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Created {formatDateTime(incident.createdAt)}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

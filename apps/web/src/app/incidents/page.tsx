"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Plus } from "lucide-react";
import { apiClient } from "@/lib/api";
import { Incident } from "@/types/api";
import { ErrorAlert, LoadingSpinner, EmptyState } from "@/components/ui";
import { formatDateTime } from "@/lib/formatting";

interface IncidentListResponse {
  items: Incident[];
}

export default function IncidentsPage() {
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
      } catch (_err) {
        setError("Failed to load incidents");
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
    <div className="container py-8 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Incidents</h1>
          <p className="text-slate-600 mt-2">Track and manage active incidents.</p>
        </div>
        <Link href="/incidents/new" className="btn btn-primary inline-flex gap-2">
          <Plus className="h-4 w-4" />
          New Incident
        </Link>
      </div>

      <div className="card">
        <input
          className="input"
          placeholder="Search incidents by title or description"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {isLoading ? (
        <div className="card py-12">
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
          action={<Link href="/incidents/new" className="btn btn-primary">Create Incident</Link>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((incident) => (
            <Link
              key={incident.id}
              href={`/incidents/${incident.id}`}
              className="card hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold text-slate-900">{incident.title}</h2>
                  <p className="text-sm text-slate-600 line-clamp-2">{incident.description}</p>
                </div>
                <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                  Open
                </span>
              </div>
              <p className="mt-4 text-xs text-slate-500">Created {formatDateTime(incident.createdAt)}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import { Incident } from "@/types/api";
import { useAuthStore } from "@/store/auth";
import { ErrorAlert, LoadingSpinner } from "@/components/ui";
import { formatDateTime } from "@/lib/formatting";

export default function IncidentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [incident, setIncident] = useState<Incident | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = user?.role === "Admin";

  useEffect(() => {
    const loadIncident = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await apiClient.get<Incident>(`/incidents/${params.id}`);
        setIncident(data);
        setTitle(data.title);
        setDescription(data.description);
      } catch (_err) {
        setError("Incident not found or unavailable");
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      loadIncident();
    }
  }, [params.id]);

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!isAdmin) {
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      const updated = await apiClient.patch<Incident>(`/incidents/${params.id}`, {
        title: title.trim(),
        description: description.trim()
      });
      setIncident(updated);
      router.refresh();
    } catch (_err) {
      setError("Failed to update incident");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/incidents" className="hover:text-slate-700">Incidents</Link>
        <span>/</span>
        <span className="text-slate-900">Detail</span>
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {isLoading ? (
        <div className="card py-12">
          <LoadingSpinner />
        </div>
      ) : !incident ? (
        <div className="card">
          <p className="text-slate-700">Incident was not found.</p>
        </div>
      ) : (
        <form className="card space-y-4" onSubmit={handleSave}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Incident Detail</h1>
              <p className="text-sm text-slate-500 mt-1">Created {formatDateTime(incident.createdAt)}</p>
            </div>
            <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
              Open
            </span>
          </div>

          <div className="space-y-2">
            <label htmlFor="incident-title" className="text-sm font-medium text-slate-700">
              Title
            </label>
            <input
              id="incident-title"
              className="input"
              value={title}
              disabled={!isAdmin}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="incident-description" className="text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              id="incident-description"
              className="input min-h-40"
              value={description}
              disabled={!isAdmin}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            {isAdmin ? (
              <button type="submit" className="btn btn-primary" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            ) : (
              <p className="text-sm text-slate-500">Read-only for non-admin users.</p>
            )}
            <Link href="/incidents" className="btn btn-secondary">
              Back
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}

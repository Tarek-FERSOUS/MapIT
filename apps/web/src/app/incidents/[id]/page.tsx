"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiClient, getApiErrorMessage } from "@/lib/api";
import {
  Button,
  ErrorAlert,
  IncidentPriorityBadge,
  IncidentStatusBadge,
  LoadingSpinner
} from "@/components/ui";
import { Incident, IncidentAssignee } from "@/types/api";
import { useAuthStore } from "@/store/auth";
import { formatDateTime } from "@/lib/formatting";
import { IncidentKnowledgeSuggestions } from "@/components/knowledge/incident-knowledge-suggestions";

interface AssigneeResponse {
  items: IncidentAssignee[];
}

const lifecycleOptions = ["OPEN", "IN_PROGRESS", "BLOCKED", "RESOLVED", "CLOSED"] as const;

function displayName(user: IncidentAssignee) {
  const parts = [user.firstName, user.lastName].filter(Boolean);
  if (parts.length > 0) {
    return `${parts.join(" ")} (${user.username})`;
  }

  return user.username;
}

export default function IncidentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [incident, setIncident] = useState<Incident | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTeam, setAssignedTeam] = useState("");
  const [status, setStatus] = useState<Incident["status"]>("OPEN");
  const [assignedToUserId, setAssignedToUserId] = useState<string>("");
  const [assignees, setAssignees] = useState<IncidentAssignee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUpdatingAssignment, setIsUpdatingAssignment] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = Boolean(
    user?.role?.toLowerCase?.() === "admin" ||
    user?.roles?.some((role) => role.key?.toLowerCase?.() === "admin" || role.name?.toLowerCase?.() === "admin")
  );
  const canEditIncident = Boolean(isAdmin || user?.permissions?.includes("incident:update"));
  const canChangeStatus = Boolean(isAdmin || user?.permissions?.includes("incident:status:update"));
  const canAssignIncident = Boolean(isAdmin || user?.permissions?.includes("incident:assign"));
  const canDeleteIncident = Boolean(isAdmin || user?.permissions?.includes("incident:delete"));

  const selectedAssignee = useMemo(
    () => assignees.find((item) => item.id === assignedToUserId) || null,
    [assignees, assignedToUserId]
  );

  useEffect(() => {
    const loadIncident = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [incidentData, assigneeData] = await Promise.all([
          apiClient.get<Incident>(`/incidents/${params.id}`),
          canAssignIncident ? apiClient.get<AssigneeResponse>("/incidents/assignees") : Promise.resolve({ items: [] as IncidentAssignee[] })
        ]);

        setIncident(incidentData);
        setTitle(incidentData.title);
        setDescription(incidentData.description);
        setAssignedTeam(incidentData.assignedTeam || "");
        setStatus(incidentData.status);
        setAssignedToUserId(incidentData.assignedTo?.id || "");
        setAssignees(assigneeData.items || []);
      } catch (_err) {
        setError("Incident not found or unavailable");
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      loadIncident();
    }
  }, [params.id, canAssignIncident]);

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!canEditIncident) {
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      const updated = await apiClient.patch<Incident>(`/incidents/${params.id}`, {
        title: title.trim(),
        description: description.trim(),
        assignedTeam: assignedTeam.trim() || null
      });
      setIncident(updated);
      router.refresh();
    } catch (_err) {
      setError("Failed to update incident");
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (nextStatus: Incident["status"]) => {
    if (!canChangeStatus || !incident || nextStatus === incident.status) {
      return;
    }

    const previousStatus = incident.status;

    try {
      setIsUpdatingStatus(true);
      setError(null);
      const updated = await apiClient.patch<Incident>(`/incidents/${params.id}/status`, { status: nextStatus });
      setIncident(updated);
      setStatus(updated.status);
      router.refresh();
    } catch (err) {
      setStatus(previousStatus);
      setError(getApiErrorMessage(err, "Failed to update incident status"));
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAssignmentChange = async () => {
    if (!canAssignIncident || !incident) {
      return;
    }

    try {
      setIsUpdatingAssignment(true);
      setError(null);
      const updated = await apiClient.patch<Incident>(`/incidents/${params.id}/assignment`, {
        assignedToUserId: assignedToUserId || null,
        assignedTeam: assignedTeam.trim() || null
      });
      setIncident(updated);
      setAssignedToUserId(updated.assignedTo?.id || "");
      setAssignedTeam(updated.assignedTeam || "");
      router.refresh();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to update incident assignment"));
    } finally {
      setIsUpdatingAssignment(false);
    }
  };

  const handleDeleteIncident = async () => {
    if (!incident || !canDeleteIncident) {
      return;
    }

    const shouldDelete = window.confirm(`Delete incident \"${incident.title}\"? This cannot be undone.`);
    if (!shouldDelete) {
      return;
    }

    try {
      setIsDeleting(true);
      setError(null);
      await apiClient.delete(`/incidents/${params.id}`);
      router.push("/incidents");
      router.refresh();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to delete incident"));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/incidents" className="hover:text-foreground">
          Incidents
        </Link>
        <span>/</span>
        <span className="text-foreground">Detail</span>
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {isLoading ? (
        <div className="kpi-shadow border border-border/50 rounded-lg bg-card py-12">
          <LoadingSpinner />
        </div>
      ) : !incident ? (
        <div className="kpi-shadow border border-border/50 rounded-lg bg-card p-4">
          <p className="text-foreground">Incident was not found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form className="kpi-shadow border border-border/50 rounded-lg bg-card p-4 space-y-4 lg:col-span-2" onSubmit={handleSave}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1>Incident Detail</h1>
                <p className="text-sm text-muted-foreground mt-1">Created {formatDateTime(incident.createdAt)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <IncidentStatusBadge status={incident.status} />
                <IncidentPriorityBadge priority={incident.priority} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="incident-title" className="text-sm font-medium text-foreground">
                  Title
                </label>
                <input
                  id="incident-title"
                  className="h-10 w-full rounded-md border border-input bg-background px-3"
                  value={title}
                  disabled={!canEditIncident}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label htmlFor="incident-description" className="text-sm font-medium text-foreground">
                  Description
                </label>
                <textarea
                  id="incident-description"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 min-h-40"
                  value={description}
                  disabled={!canEditIncident}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="incident-assigned-team" className="text-sm font-medium text-foreground">
                  Assigned Team
                </label>
                <input
                  id="incident-assigned-team"
                  className="h-10 w-full rounded-md border border-input bg-background px-3"
                  value={assignedTeam}
                  disabled={!canAssignIncident && !canEditIncident}
                  onChange={(event) => setAssignedTeam(event.target.value)}
                  placeholder="Service Desk"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="incident-status" className="text-sm font-medium text-foreground">
                  Status
                </label>
                <select
                  id="incident-status"
                  className="h-10 w-full rounded-md border border-input bg-background px-3"
                  value={status}
                  disabled={!canChangeStatus || isUpdatingStatus}
                  onChange={(event) => {
                    const nextStatus = event.target.value as Incident["status"];
                    void handleStatusChange(nextStatus);
                  }}
                >
                  {lifecycleOptions.map((option) => (
                    <option key={option} value={option}>
                      {option.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
                {!canChangeStatus && <p className="text-xs text-muted-foreground">You do not have permission to change status.</p>}
              </div>

              <div className="space-y-2 md:col-span-2">
                <label htmlFor="incident-assignee" className="text-sm font-medium text-foreground">
                  Assigned To
                </label>
                <select
                  id="incident-assignee"
                  className="h-10 w-full rounded-md border border-input bg-background px-3"
                  value={assignedToUserId}
                  disabled={!canAssignIncident}
                  onChange={(event) => setAssignedToUserId(event.target.value)}
                >
                  <option value="">Unassigned</option>
                  {assignees.map((assignee) => (
                    <option key={assignee.id} value={assignee.id}>
                      {displayName(assignee)}
                    </option>
                  ))}
                </select>
                {!canAssignIncident && <p className="text-xs text-muted-foreground">You do not have permission to assign incidents.</p>}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              {canEditIncident ? (
                <Button type="submit" isLoading={isSaving} variant="primary">
                  Save Changes
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">Read-only for your current access level.</p>
              )}
              {canAssignIncident && (
                <Button
                  type="button"
                  variant="secondary"
                  isLoading={isUpdatingAssignment}
                  onClick={() => void handleAssignmentChange()}
                >
                  Save Assignment
                </Button>
              )}
              {canDeleteIncident && (
                <Button
                  type="button"
                  variant="danger"
                  isLoading={isDeleting}
                  onClick={() => void handleDeleteIncident()}
                >
                  Delete Incident
                </Button>
              )}
              <Link href="/incidents" className="h-9 px-4 rounded-md border border-border bg-card text-sm inline-flex items-center">
                Back
              </Link>
            </div>
          </form>

          <div className="kpi-shadow border border-border/50 rounded-lg bg-card p-4 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Summary</h2>
              <p className="text-sm text-muted-foreground mt-1">Lifecycle, assignment, and metadata</p>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Current Status</span>
                <IncidentStatusBadge status={incident.status} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Priority</span>
                <IncidentPriorityBadge priority={incident.priority} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Assigned Team</span>
                <span className="text-foreground">{incident.assignedTeam || "Unassigned"}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Assigned User</span>
                <span className="text-foreground">{selectedAssignee ? displayName(selectedAssignee) : "Unassigned"}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Created</span>
                <span className="text-foreground">{formatDateTime(incident.createdAt)}</span>
              </div>
            </div>

            <IncidentKnowledgeSuggestions
              incidentId={incident.id}
              title={incident.title}
              description={incident.description}
            />

            <div className="rounded-md border border-border/60 bg-muted/40 p-3 text-xs text-muted-foreground">
              Status changes are validated on the backend. Invalid transitions such as CLOSED to IN_PROGRESS are blocked.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

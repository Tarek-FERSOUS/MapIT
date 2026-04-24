"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { apiClient, getApiErrorMessage } from "@/lib/api";
import { ErrorAlert } from "@/components/ui";
import { IncidentKnowledgeSuggestions } from "@/components/knowledge/incident-knowledge-suggestions";

export default function NewIncidentPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [assignedTeam, setAssignedTeam] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!title.trim() || !description.trim()) {
      setError("Title and description are required.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await apiClient.post("/incidents", {
        title: title.trim(),
        description: description.trim(),
        priority,
        assignedTeam: assignedTeam.trim() || null
      });
      router.push("/incidents");
      router.refresh();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to create incident"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <h1>Create Incident</h1>
        <p className="text-muted-foreground text-sm">Log a new operational issue and get instant knowledge suggestions.</p>
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      <form className="kpi-shadow border border-border/50 rounded-lg bg-card p-4 space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="incident-title" className="text-sm font-medium text-foreground">
            Title
          </label>
          <input
            id="incident-title"
            className="h-10 w-full rounded-md border border-input bg-background px-3"
            placeholder="Database connection timeout"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={120}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label htmlFor="incident-description" className="text-sm font-medium text-foreground">
            Description
          </label>
          <textarea
            id="incident-description"
            className="w-full rounded-md border border-input bg-background px-3 py-2 min-h-36"
            placeholder="Describe symptoms, impact, and observed behavior."
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="incident-priority" className="text-sm font-medium text-foreground">
            Priority
          </label>
          <select
            id="incident-priority"
            className="h-10 w-full rounded-md border border-input bg-background px-3"
            value={priority}
            onChange={(event) => setPriority(event.target.value)}
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="incident-team" className="text-sm font-medium text-foreground">
            Assigned Team
          </label>
          <input
            id="incident-team"
            className="h-10 w-full rounded-md border border-input bg-background px-3"
            placeholder="Optional team name"
            value={assignedTeam}
            onChange={(event) => setAssignedTeam(event.target.value)}
          />
        </div>
        </div>

        <IncidentKnowledgeSuggestions title={title} description={description} />

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm disabled:opacity-60" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Incident"}
          </button>
          <Link href="/incidents" className="h-9 px-4 rounded-md border border-border bg-card text-sm inline-flex items-center">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

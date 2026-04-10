"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { apiClient } from "@/lib/api";
import { ErrorAlert } from "@/components/ui";

export default function NewIncidentPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
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
        description: description.trim()
      });
      router.push("/incidents");
      router.refresh();
    } catch (_err) {
      setError("Failed to create incident");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container py-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">Create Incident</h1>
        <p className="text-slate-600">Log a new operational issue for your team.</p>
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      <form className="card space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label htmlFor="incident-title" className="text-sm font-medium text-slate-700">
            Title
          </label>
          <input
            id="incident-title"
            className="input"
            placeholder="Database connection timeout"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={120}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="incident-description" className="text-sm font-medium text-slate-700">
            Description
          </label>
          <textarea
            id="incident-description"
            className="input min-h-36"
            placeholder="Describe symptoms, impact, and observed behavior."
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Incident"}
          </button>
          <Link href="/incidents" className="btn btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

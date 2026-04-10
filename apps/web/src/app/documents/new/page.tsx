"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { apiClient } from "@/lib/api";
import { ErrorAlert } from "@/components/ui";

export default function NewDocumentPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!title.trim() || !content.trim()) {
      setError("Title and content are required.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await apiClient.post("/documents", {
        title: title.trim(),
        content: content.trim()
      });
      router.push("/documents");
      router.refresh();
    } catch (_err) {
      setError("Failed to create document");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container py-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">Create Document</h1>
        <p className="text-slate-600">Capture runbooks, SOPs, and troubleshooting notes.</p>
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      <form className="card space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label htmlFor="doc-title" className="text-sm font-medium text-slate-700">
            Title
          </label>
          <input
            id="doc-title"
            className="input"
            placeholder="DB Failover Runbook"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={160}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="doc-content" className="text-sm font-medium text-slate-700">
            Content
          </label>
          <textarea
            id="doc-content"
            className="input min-h-56"
            placeholder="Document the full procedure and validation steps."
            value={content}
            onChange={(event) => setContent(event.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Document"}
          </button>
          <Link href="/documents" className="btn btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

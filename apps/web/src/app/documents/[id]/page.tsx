"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import { Document } from "@/types/api";
import { useAuthStore } from "@/store/auth";
import { ErrorAlert, LoadingSpinner } from "@/components/ui";
import { formatDateTime } from "@/lib/formatting";

export default function DocumentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [document, setDocument] = useState<Document | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = user?.role === "Admin";

  useEffect(() => {
    const loadDocument = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await apiClient.get<Document>(`/documents/${params.id}`);
        setDocument(data);
        setTitle(data.title);
        setContent(data.content);
      } catch (_err) {
        setError("Document not found or unavailable");
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      loadDocument();
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
      const updated = await apiClient.patch<Document>(`/documents/${params.id}`, {
        title: title.trim(),
        content: content.trim()
      });
      setDocument(updated);
      router.refresh();
    } catch (_err) {
      setError("Failed to update document");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isAdmin) {
      return;
    }

    const ok = window.confirm("Delete this document? This action cannot be undone.");
    if (!ok) {
      return;
    }

    try {
      setIsDeleting(true);
      setError(null);
      await apiClient.delete(`/documents/${params.id}`);
      router.push("/documents");
      router.refresh();
    } catch (_err) {
      setError("Failed to delete document");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/documents" className="hover:text-slate-700">Documents</Link>
        <span>/</span>
        <span className="text-slate-900">Detail</span>
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {isLoading ? (
        <div className="card py-12">
          <LoadingSpinner />
        </div>
      ) : !document ? (
        <div className="card">
          <p className="text-slate-700">Document was not found.</p>
        </div>
      ) : (
        <form className="card space-y-4" onSubmit={handleSave}>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Document Detail</h1>
            <p className="text-sm text-slate-500 mt-1">Created {formatDateTime(document.createdAt)}</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="doc-title" className="text-sm font-medium text-slate-700">
              Title
            </label>
            <input
              id="doc-title"
              className="input"
              value={title}
              disabled={!isAdmin}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="doc-content" className="text-sm font-medium text-slate-700">
              Content
            </label>
            <textarea
              id="doc-content"
              className="input min-h-72"
              value={content}
              disabled={!isAdmin}
              onChange={(event) => setContent(event.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            {isAdmin ? (
              <>
                <button type="submit" className="btn btn-primary" disabled={isSaving || isDeleting}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  className="btn bg-red-600 text-white hover:bg-red-700"
                  onClick={handleDelete}
                  disabled={isSaving || isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </>
            ) : (
              <p className="text-sm text-slate-500">Read-only for non-admin users.</p>
            )}
            <Link href="/documents" className="btn btn-secondary">
              Back
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}

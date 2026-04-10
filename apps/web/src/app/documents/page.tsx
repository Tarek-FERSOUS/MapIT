"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FileText, Plus } from "lucide-react";
import { apiClient } from "@/lib/api";
import { Document } from "@/types/api";
import { ErrorAlert, LoadingSpinner, EmptyState } from "@/components/ui";
import { formatDateTime } from "@/lib/formatting";

interface DocumentListResponse {
  items: Document[];
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await apiClient.get<DocumentListResponse>("/documents", {
          q: query || undefined
        });
        setDocuments(data.items || []);
      } catch (_err) {
        setError("Failed to load documents");
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(loadDocuments, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="container py-8 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Documents</h1>
          <p className="text-slate-600 mt-2">Search and maintain operational knowledge.</p>
        </div>
        <Link href="/documents/new" className="btn btn-primary inline-flex gap-2">
          <Plus className="h-4 w-4" />
          New Document
        </Link>
      </div>

      <div className="card">
        <input
          className="input"
          placeholder="Search by title or content"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {isLoading ? (
        <div className="card py-12">
          <LoadingSpinner />
        </div>
      ) : documents.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-10 w-10" />}
          title={query ? "No matching documents" : "No documents yet"}
          description={
            query
              ? "Try a different keyword."
              : "Create your first document to build your knowledge base."
          }
          action={<Link href="/documents/new" className="btn btn-primary">Create Document</Link>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {documents.map((doc) => (
            <Link
              key={doc.id}
              href={`/documents/${doc.id}`}
              className="card hover:shadow-md transition-shadow"
            >
              <h2 className="text-lg font-semibold text-slate-900">{doc.title}</h2>
              <p className="mt-2 text-sm text-slate-600 line-clamp-3">{doc.content}</p>
              <p className="mt-4 text-xs text-slate-500">Created {formatDateTime(doc.createdAt)}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

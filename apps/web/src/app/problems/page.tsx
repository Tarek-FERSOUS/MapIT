"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Problem } from "@/types/api";
import { MockApiService } from "@/lib/mock-api";
import { EmptyState, ErrorAlert, LoadingSpinner } from "@/components/ui";
import { formatDateTime } from "@/lib/formatting";

export default function ProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProblems = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await MockApiService.getProblems();
        setProblems(data);
      } catch (_err) {
        setError("Failed to load problems");
      } finally {
        setIsLoading(false);
      }
    };

    loadProblems();
  }, []);

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Problems</h1>
        <p className="text-slate-600 mt-2">Problem and solution knowledge base (mock data).</p>
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {isLoading ? (
        <div className="card py-12">
          <LoadingSpinner />
        </div>
      ) : problems.length === 0 ? (
        <EmptyState
          icon={<AlertTriangle className="h-10 w-10" />}
          title="No problems yet"
          description="Problem records will appear here."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {problems.map((problem) => (
            <div key={problem.id} className="card">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-900">{problem.title}</h2>
                <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">
                  {problem.severity}
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-2">{problem.description}</p>
              <p className="text-xs text-slate-500 mt-3">Created {formatDateTime(problem.createdAt)}</p>
              {problem.solution ? (
                <div className="mt-4 rounded-md bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-slate-700">Proposed Solution</p>
                  <p className="text-sm text-slate-600 mt-1">{problem.solution}</p>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

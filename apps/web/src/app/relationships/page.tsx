"use client";

import { useEffect, useState } from "react";
import { Network } from "lucide-react";
import { apiClient } from "@/lib/api";
import { Relationship } from "@/types/api";
import { EmptyState, ErrorAlert, LoadingSpinner } from "@/components/ui";

export default function RelationshipsPage() {
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRelationships = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await apiClient.get<{ items: Relationship[] }>("/relationships");
        setRelationships(data.items || []);
      } catch (_err) {
        setError("Failed to load relationships");
      } finally {
        setIsLoading(false);
      }
    };

    loadRelationships();
  }, []);

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Relationships</h1>
        <p className="text-slate-600 mt-2">Asset dependency map (mock data).</p>
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {isLoading ? (
        <div className="card py-12">
          <LoadingSpinner />
        </div>
      ) : relationships.length === 0 ? (
        <EmptyState
          icon={<Network className="h-10 w-10" />}
          title="No relationships found"
          description="Asset links will appear here."
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-600">
                <th className="py-2 pr-4">Source Asset</th>
                <th className="py-2 pr-4">Relationship</th>
                <th className="py-2">Target Asset</th>
              </tr>
            </thead>
            <tbody>
              {relationships.map((rel) => (
                <tr key={rel.id} className="border-b border-slate-100">
                  <td className="py-3 pr-4 font-medium text-slate-900">{rel.sourceAssetId}</td>
                  <td className="py-3 pr-4 text-slate-600">{rel.relationshipType}</td>
                  <td className="py-3 text-slate-900">{rel.targetAssetId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

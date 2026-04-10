"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Asset, Relationship } from "@/types/api";
import { MockApiService } from "@/lib/mock-api";
import { ErrorAlert, LoadingSpinner } from "@/components/ui";

export default function AssetDetailPage() {
  const params = useParams<{ id: string }>();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAsset = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [assetData, relData] = await Promise.all([
          MockApiService.getAssetById(params.id),
          MockApiService.getRelationshipsByAsset(params.id)
        ]);

        if (!assetData) {
          setError("Asset not found");
          setAsset(null);
          return;
        }

        setAsset(assetData);
        setRelationships(relData);
      } catch (_err) {
        setError("Failed to load asset detail");
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      loadAsset();
    }
  }, [params.id]);

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/assets" className="hover:text-slate-700">Assets</Link>
        <span>/</span>
        <span className="text-slate-900">Detail</span>
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {isLoading ? (
        <div className="card py-12">
          <LoadingSpinner />
        </div>
      ) : !asset ? (
        <div className="card">
          <p className="text-slate-700">Asset not found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="card">
            <h1 className="text-2xl font-bold text-slate-900">{asset.name}</h1>
            <p className="text-sm text-slate-600 mt-2">{asset.type} • {asset.ipAddress}</p>
            <p className="text-sm text-slate-600 mt-1">Location: {asset.location}</p>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-slate-900">Relationships</h2>
            {relationships.length === 0 ? (
              <p className="text-sm text-slate-500 mt-2">No related assets.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {relationships.map((rel) => (
                  <li key={rel.id}>
                    {rel.sourceAssetId} {rel.relationshipType} {rel.targetAssetId}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

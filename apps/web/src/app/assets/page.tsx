"use client";

import { useMemo, useState } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Filter,
  X,
  Server,
  Monitor,
  Wifi,
  HardDrive,
  Cloud,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { apiClient, getApiErrorMessage } from "@/lib/api";
import { Asset, Relationship } from "@/types/api";

export default function AssetsPage() {
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({
    name: "",
    type: "server" as Asset["type"],
    ipAddress: "",
    location: "",
    status: "online" as Asset["status"],
    os: "",
    cpu: "",
    memory: "",
    tags: ""
  });
  const [relationships, setRelationships] = useState<
    Array<{ targetAssetId: string; relationshipType: Relationship["relationshipType"] }>
  >([]);

  const typeIcons: Record<Asset["type"], React.ElementType> = {
    server: Server,
    vm: Monitor,
    "network-device": Wifi,
    network: Wifi,
    storage: HardDrive,
    service: Cloud
  };

  const statusStyles: Record<Asset["status"], string> = {
    online: "bg-accent/10 text-accent border-accent/20",
    offline: "bg-destructive/10 text-destructive border-destructive/20",
    warning: "bg-warning/10 text-warning border-warning/20",
    maintenance: "bg-muted text-muted-foreground border-border"
  };

  const itemsPerPage = 8;

  useEffect(() => {
    const loadAssets = async () => {
      try {
        setError(null);
        const data = await apiClient.get<{ items: Asset[] }>("/assets");
        setAssets(data.items || []);
      } catch (error) {
        setError(getApiErrorMessage(error, "Failed to load assets"));
      }
    };

    loadAssets();
  }, []);

  const filtered = useMemo(() => {
    return assets.filter((asset) => {
      const matchSearch =
        asset.name.toLowerCase().includes(search.toLowerCase()) ||
        asset.ipAddress.includes(search) ||
        asset.location.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === "all" || asset.type === typeFilter;
      const matchStatus = statusFilter === "all" || asset.status === statusFilter;
      return matchSearch && matchType && matchStatus;
    });
  }, [assets, search, typeFilter, statusFilter]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paged = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const toggleSelect = (id: string) => {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === paged.length && paged.length > 0) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(paged.map((asset) => asset.id)));
  };

  const resetForm = () => {
    setForm({
      name: "",
      type: "server",
      ipAddress: "",
      location: "",
      status: "online",
      os: "",
      cpu: "",
      memory: "",
      tags: ""
    });
    setRelationships([]);
    setCreateError(null);
  };

  const addRelationshipRow = () => {
    setRelationships((previous) => [
      ...previous,
      {
        targetAssetId: "",
        relationshipType: "depends-on"
      }
    ]);
  };

  const updateRelationshipRow = (
    index: number,
    patch: Partial<{ targetAssetId: string; relationshipType: Relationship["relationshipType"] }>
  ) => {
    setRelationships((previous) => previous.map((row, idx) => (idx === index ? { ...row, ...patch } : row)));
  };

  const removeRelationshipRow = (index: number) => {
    setRelationships((previous) => previous.filter((_, idx) => idx !== index));
  };

  const handleCreateAsset = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreateError(null);
    setCreating(true);

    try {
      const newAsset = await apiClient.post<Asset>("/assets", {
        name: form.name,
        type: form.type,
        ipAddress: form.ipAddress,
        location: form.location,
        status: form.status,
        ...(form.os.trim() ? { os: form.os.trim() } : {}),
        ...(form.cpu.trim() ? { cpu: form.cpu.trim() } : {}),
        ...(form.memory.trim() ? { memory: form.memory.trim() } : {}),
        ...(form.tags.trim()
          ? { tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean) }
          : {})
      });

      const relationshipPayloads = relationships
        .filter((row) => row.targetAssetId)
        .map((row) => ({
          sourceAssetId: newAsset.id,
          targetAssetId: row.targetAssetId,
          relationshipType: row.relationshipType
        }));

      if (relationshipPayloads.length > 0) {
        await Promise.all(relationshipPayloads.map((payload) => apiClient.post("/relationships", payload)));
      }

      setAssets((previous) => [newAsset, ...previous]);
      setPage(1);
      setShowCreateForm(false);
      resetForm();
    } catch (err) {
      setCreateError(getApiErrorMessage(err, "Failed to create asset"));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1>Asset Inventory</h1>
          <p className="text-muted-foreground text-sm mt-1">{assets.length} assets registered</p>
        </div>
        <button
          className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-sm inline-flex items-center"
          title="Add asset"
          aria-label="Add asset"
          onClick={() => {
            setShowCreateForm((previous) => !previous);
            if (showCreateForm) {
              resetForm();
            }
          }}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Asset
        </button>
      </div>

      {error && <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      {showCreateForm && (
        <div className="kpi-shadow border border-border/50 rounded-lg bg-card p-4">
          <form onSubmit={handleCreateAsset} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Name</label>
                <input
                  title="Asset name"
                  aria-label="Asset name"
                  required
                  value={form.name}
                  onChange={(event) => setForm((previous) => ({ ...previous, name: event.target.value }))}
                  className="mt-1 w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">IP Address</label>
                <input
                  title="Asset IP address"
                  aria-label="Asset IP address"
                  required
                  value={form.ipAddress}
                  onChange={(event) => setForm((previous) => ({ ...previous, ipAddress: event.target.value }))}
                  className="mt-1 w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Type</label>
                <select
                  title="Asset type"
                  aria-label="Asset type"
                  value={form.type}
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, type: event.target.value as Asset["type"] }))
                  }
                  className="mt-1 w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
                >
                  <option value="server">Server</option>
                  <option value="vm">VM</option>
                  <option value="network">Network</option>
                  <option value="network-device">Network Device</option>
                  <option value="storage">Storage</option>
                  <option value="service">Service</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Status</label>
                <select
                  title="Asset status"
                  aria-label="Asset status"
                  value={form.status}
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, status: event.target.value as Asset["status"] }))
                  }
                  className="mt-1 w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
                >
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                  <option value="warning">Warning</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Location</label>
                <input
                  title="Asset location"
                  aria-label="Asset location"
                  required
                  value={form.location}
                  onChange={(event) => setForm((previous) => ({ ...previous, location: event.target.value }))}
                  className="mt-1 w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Tags (comma separated)</label>
                <input
                  title="Asset tags"
                  aria-label="Asset tags"
                  value={form.tags}
                  onChange={(event) => setForm((previous) => ({ ...previous, tags: event.target.value }))}
                  className="mt-1 w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">OS</label>
                <input
                  title="Asset operating system"
                  aria-label="Asset operating system"
                  value={form.os}
                  onChange={(event) => setForm((previous) => ({ ...previous, os: event.target.value }))}
                  className="mt-1 w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">CPU</label>
                <input
                  title="Asset CPU"
                  aria-label="Asset CPU"
                  value={form.cpu}
                  onChange={(event) => setForm((previous) => ({ ...previous, cpu: event.target.value }))}
                  className="mt-1 w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Memory</label>
                <input
                  title="Asset memory"
                  aria-label="Asset memory"
                  value={form.memory}
                  onChange={(event) => setForm((previous) => ({ ...previous, memory: event.target.value }))}
                  className="mt-1 w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Relationships From This Asset</h3>
                <button
                  type="button"
                  className="h-8 px-3 rounded-md border border-border bg-background text-sm"
                  onClick={addRelationshipRow}
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5 inline" /> Add Relationship
                </button>
              </div>

              {relationships.length === 0 ? (
                <p className="text-xs text-muted-foreground">No related assets selected.</p>
              ) : (
                <div className="space-y-2">
                  {relationships.map((row, index) => (
                    <div key={index} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 p-2 rounded-md border border-border/50">
                      <select
                        title="Related asset"
                        aria-label="Related asset"
                        value={row.targetAssetId}
                        onChange={(event) => updateRelationshipRow(index, { targetAssetId: event.target.value })}
                        className="h-9 rounded-md border border-border bg-background px-3 text-sm"
                      >
                        <option value="">Select related asset</option>
                        {assets.map((asset) => (
                          <option key={asset.id} value={asset.id}>
                            {asset.name}
                          </option>
                        ))}
                      </select>
                      <select
                        title="Relationship type"
                        aria-label="Relationship type"
                        value={row.relationshipType}
                        onChange={(event) =>
                          updateRelationshipRow(index, {
                            relationshipType: event.target.value as Relationship["relationshipType"]
                          })
                        }
                        className="h-9 rounded-md border border-border bg-background px-3 text-sm"
                      >
                        <option value="depends-on">depends-on</option>
                        <option value="hosted-on">hosted-on</option>
                        <option value="communicates-with">communicates-with</option>
                      </select>
                      <button
                        type="button"
                        className="h-9 w-9 inline-flex items-center justify-center rounded-md border border-border bg-background"
                        onClick={() => removeRelationshipRow(index)}
                        title="Remove relationship"
                        aria-label="Remove relationship"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {createError && (
              <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                {createError}
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={creating}
                className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm disabled:opacity-60"
              >
                {creating ? "Creating..." : "Create Asset"}
              </button>
              <button
                type="button"
                className="h-9 px-4 rounded-md border border-border bg-background text-sm"
                onClick={() => {
                  setShowCreateForm(false);
                  resetForm();
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="kpi-shadow border border-border/50 rounded-lg bg-card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              aria-label="Search assets"
              placeholder="Search by name, IP, or location..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              className="w-full h-9 rounded-md border-0 bg-muted pl-9 pr-3 text-sm"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <select
              aria-label="Filter assets by type"
              value={typeFilter}
              onChange={(event) => {
                setTypeFilter(event.target.value);
                setPage(1);
              }}
              className="h-9 rounded-md border border-border bg-background pl-7 pr-3 text-sm"
            >
              <option value="all">All Types</option>
              <option value="server">Server</option>
              <option value="vm">VM</option>
              <option value="network">Network</option>
              <option value="storage">Storage</option>
              <option value="service">Service</option>
            </select>
          </div>

          <select
            aria-label="Filter assets by status"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(1);
            }}
            className="h-9 rounded-md border border-border bg-background px-3 text-sm"
          >
            <option value="all">All Status</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
            <option value="warning">Warning</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
      </div>

      <div className="kpi-shadow border border-border/50 rounded-lg bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="w-10 px-3 py-2 text-left">
                  <input
                    type="checkbox"
                    checked={selected.size === paged.length && paged.length > 0}
                    onChange={toggleAll}
                    aria-label="Select all visible assets"
                  />
                </th>
                <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-left">Name</th>
                <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-left hidden sm:table-cell">Type</th>
                <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-left hidden md:table-cell">IP Address</th>
                <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-left hidden lg:table-cell">Location</th>
                <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-left">Status</th>
                <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((asset) => {
                const TypeIcon = typeIcons[asset.type];
                return (
                  <tr
                    key={asset.id}
                    className="group cursor-pointer hover:bg-muted/30 border-b border-border/50"
                    onClick={() => router.push(`/assets/${asset.id}`)}
                  >
                    <td className="px-3 py-2" onClick={(event) => event.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.has(asset.id)}
                        onChange={() => toggleSelect(asset.id)}
                        aria-label={`Select asset ${asset.name}`}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <TypeIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="font-medium text-sm text-foreground">{asset.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 hidden sm:table-cell">
                      <span className="text-sm text-muted-foreground capitalize">{asset.type}</span>
                    </td>
                    <td className="px-3 py-2 hidden md:table-cell">
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded text-foreground">{asset.ipAddress}</code>
                    </td>
                    <td className="px-3 py-2 hidden lg:table-cell">
                      <span className="text-sm text-muted-foreground">{asset.location}</span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`text-[10px] px-1.5 py-0 rounded border capitalize ${statusStyles[asset.status]}`}>
                        {asset.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right" onClick={(event) => event.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="h-7 w-7 inline-flex items-center justify-center rounded hover:bg-muted" onClick={() => router.push(`/assets/${asset.id}`)} title={`View asset ${asset.name}`} aria-label={`View asset ${asset.name}`}>
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button className="h-7 w-7 inline-flex items-center justify-center rounded hover:bg-muted" title={`Edit asset ${asset.name}`} aria-label={`Edit asset ${asset.name}`}>
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button className="h-7 w-7 inline-flex items-center justify-center rounded hover:bg-muted text-destructive" title={`Delete asset ${asset.name}`} aria-label={`Delete asset ${asset.name}`}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {paged.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    No assets found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Showing {(page - 1) * itemsPerPage + 1}–{Math.min(page * itemsPerPage, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                className="h-7 w-7 inline-flex items-center justify-center rounded hover:bg-muted disabled:opacity-40"
                disabled={page === 1}
                onClick={() => setPage((current) => current - 1)}
                title="Previous page"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                className="h-7 w-7 inline-flex items-center justify-center rounded hover:bg-muted disabled:opacity-40"
                disabled={page === totalPages}
                onClick={() => setPage((current) => current + 1)}
                title="Next page"
                aria-label="Next page"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

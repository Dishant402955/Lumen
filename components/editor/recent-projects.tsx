"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import {
  clearAllProjects,
  deleteProject,
  listRecentProjects,
  type StoredProjectMeta,
} from "@/lib/offline/projects";

export function RecentProjectsPanel({
  compact,
  onOpen,
  refreshKey,
}: {
  compact?: boolean;
  onOpen: (id: string) => void;
  refreshKey?: number;
}) {
  const [items, setItems] = useState<StoredProjectMeta[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const objectUrls: string[] = [];

    void (async () => {
      try {
        const list = await listRecentProjects();
        if (cancelled) return;
        const nextUrls: Record<string, string> = {};
        for (const item of list) {
          const url = URL.createObjectURL(item.thumbnail);
          objectUrls.push(url);
          nextUrls[item.id] = url;
        }
        setItems(list);
        setUrls(nextUrls);
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Could not read saved projects.",
          );
        }
      }
    })();

    return () => {
      cancelled = true;
      for (const url of objectUrls) URL.revokeObjectURL(url);
    };
  }, [refreshKey]);

  async function onDelete(id: string) {
    setBusy(true);
    try {
      await deleteProject(id);
      setItems((prev) => prev.filter((p) => p.id !== id));
      if (urls[id]) URL.revokeObjectURL(urls[id]);
      setUrls((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setBusy(false);
    }
  }

  async function onClear() {
    if (!confirm("Delete all saved projects from this device?")) return;
    setBusy(true);
    try {
      await clearAllProjects();
      for (const url of Object.values(urls)) URL.revokeObjectURL(url);
      setItems([]);
      setUrls({});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Clear failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={cn(
        "rounded-3xl border border-[var(--line)] bg-[var(--panel)]/90 p-4",
        compact && "border-0 bg-transparent p-0",
      )}
    >
      <div className="space-y-3">
        <div>
          <p className="font-[family-name:var(--font-display)] text-lg text-[var(--ink)]">
            Recent projects
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Saved on this device in IndexedDB. Works offline after the first
            save.
          </p>
        </div>

        {error ? <p className="text-sm text-red-700">{error}</p> : null}

        {!items.length ? (
          <p className="text-sm text-[var(--muted)]">
            No saved projects yet. Open an image and tap Save project.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-1">
            {items.map((item) => (
              <li
                key={item.id}
                className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--panel-2)]"
              >
                <button
                  type="button"
                  disabled={busy}
                  className="block w-full text-left disabled:opacity-50"
                  onClick={() => onOpen(item.id)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={urls[item.id]}
                    alt=""
                    className="aspect-[4/3] w-full object-cover"
                  />
                  <div className="px-2 py-2">
                    <p className="truncate text-sm font-medium text-[var(--ink)]">
                      {item.name}
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      {item.width}×{item.height} ·{" "}
                      {new Date(item.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </button>
                <div className="flex border-t border-[var(--line)]">
                  <button
                    type="button"
                    className="flex-1 px-2 py-1.5 text-xs text-[var(--muted)] hover:text-[var(--ink)]"
                    disabled={busy}
                    onClick={() => onOpen(item.id)}
                  >
                    Open
                  </button>
                  <button
                    type="button"
                    className="flex-1 px-2 py-1.5 text-xs text-red-800"
                    disabled={busy}
                    onClick={() => void onDelete(item.id)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {items.length ? (
          <button
            type="button"
            disabled={busy}
            className="w-full rounded-xl border border-[var(--line)] px-3 py-2 text-sm disabled:opacity-40"
            onClick={() => void onClear()}
          >
            Clear all saved projects
          </button>
        ) : null}
      </div>
    </div>
  );
}

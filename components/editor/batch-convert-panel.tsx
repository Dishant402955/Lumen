"use client";

import { ChangeEvent, useRef, useState } from "react";
import { Slider } from "@/components/editor/slider";
import { cn } from "@/lib/cn";
import {
  convertFile,
  downloadBlob,
  downloadZip,
  stemFromName,
} from "@/lib/convert/encode";
import {
  BatchItem,
  CONVERT_FORMATS,
  ConvertFormat,
} from "@/lib/convert/types";
import { createId } from "@/lib/editor-types";

export function BatchConvertPanel({ compact }: { compact?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<BatchItem[]>([]);
  const [format, setFormat] = useState<ConvertFormat>("image/jpeg");
  const [quality, setQuality] = useState(0.92);
  const [keepExif, setKeepExif] = useState(true);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const formatMeta = CONVERT_FORMATS.find((f) => f.id === format)!;

  function invalidateDoneResults() {
    setItems((prev) =>
      prev.map((item) =>
        item.status === "done"
          ? {
              ...item,
              status: "queued" as const,
              resultBlob: undefined,
              resultName: undefined,
              error: undefined,
            }
          : item,
      ),
    );
  }

  function onPick(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;
    setItems((prev) => [
      ...prev,
      ...files.map((file) => ({
        id: createId("batch"),
        file,
        status: "queued" as const,
      })),
    ]);
    setMessage(null);
  }

  async function runBatch() {
    if (!items.length || running) return;
    setRunning(true);
    setMessage(null);

    const next = [...items];
    for (let i = 0; i < next.length; i++) {
      if (next[i].status === "done" && next[i].resultBlob) continue;
      next[i] = { ...next[i], status: "working", error: undefined };
      setItems([...next]);
      try {
        const { blob, extension } = await convertFile(next[i].file, {
          format,
          quality,
          keepExif,
        });
        next[i] = {
          ...next[i],
          status: "done",
          resultBlob: blob,
          resultName: `${stemFromName(next[i].file.name)}.${extension}`,
        };
      } catch (err) {
        next[i] = {
          ...next[i],
          status: "error",
          error: err instanceof Error ? err.message : "Conversion failed",
        };
      }
      setItems([...next]);
    }

    setRunning(false);
    const ok = next.filter((i) => i.status === "done").length;
    const bad = next.filter((i) => i.status === "error").length;
    setMessage(`Finished: ${ok} converted${bad ? `, ${bad} failed` : ""}.`);
  }

  async function downloadAllZip() {
    const done = items.filter((i) => i.status === "done" && i.resultBlob);
    if (!done.length) return;
    await downloadZip(
      done.map((i) => ({ name: i.resultName!, blob: i.resultBlob! })),
      `lumen-convert-${formatMeta.extension}.zip`,
    );
  }

  function clearDone() {
    setItems((prev) => prev.filter((i) => i.status !== "done"));
  }

  function clearAll() {
    setItems([]);
    setMessage(null);
  }

  return (
    <div
      className={cn(
        "lumen-panel p-4",
        compact && "border-0 bg-transparent p-0 shadow-none backdrop-blur-none",
      )}
    >
      <div className="space-y-4">
        <div>
          <p className="font-[family-name:var(--font-display)] text-lg text-[var(--ink)]">
            Batch convert
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Convert many images at once — including HEIC input — to PNG, JPEG,
            WebP, AVIF, or HEIC. EXIF is kept when the format allows.
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*,.heic,.heif,image/heic,image/heif"
          multiple
          className="hidden"
          onChange={onPick}
        />
        <button
          type="button"
          className="lumen-btn lumen-btn-primary w-full"
          onClick={() => inputRef.current?.click()}
        >
          Add images
        </button>

        <label className="block text-sm">
          <span className="mb-1 block text-[var(--muted)]">Output format</span>
          <select
            value={format}
            onChange={(e) => {
              setFormat(e.target.value as ConvertFormat);
              invalidateDoneResults();
            }}
            className="w-full rounded-xl border border-[var(--line)] bg-[var(--panel-2)] px-3 py-2"
          >
            {CONVERT_FORMATS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
                {f.exifSupport === "full"
                  ? " · EXIF"
                  : f.exifSupport === "partial"
                    ? " · EXIF*"
                    : ""}
              </option>
            ))}
          </select>
        </label>

        {formatMeta.hasQuality ? (
          <Slider
            label="Quality"
            value={Math.round(quality * 100)}
            min={10}
            max={100}
            onChange={(v) => {
              setQuality(v / 100);
              invalidateDoneResults();
            }}
          />
        ) : null}

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={keepExif}
            onChange={(e) => {
              setKeepExif(e.target.checked);
              invalidateDoneResults();
            }}
          />
          Keep EXIF metadata
        </label>
        <p className="text-xs text-[var(--muted)]">
          JPEG: full EXIF. PNG/WebP: best-effort. AVIF/HEIC: pixels only. HEIC
          export uses real HEVC (libheif/kvazaar in WASM).
        </p>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!items.length || running}
            className="lumen-btn lumen-btn-accent disabled:opacity-40"
            onClick={() => void runBatch()}
          >
            {running ? "Converting…" : "Convert all"}
          </button>
          <button
            type="button"
            disabled={!items.some((i) => i.status === "done") || running}
            className="rounded-xl border border-[var(--line)] px-3 py-2 text-sm disabled:opacity-40"
            onClick={() => void downloadAllZip()}
          >
            Download ZIP
          </button>
          <button
            type="button"
            disabled={!items.length || running}
            className="rounded-xl border border-[var(--line)] px-3 py-2 text-sm disabled:opacity-40"
            onClick={clearDone}
          >
            Clear done
          </button>
          <button
            type="button"
            disabled={!items.length || running}
            className="rounded-xl border border-[var(--line)] px-3 py-2 text-sm disabled:opacity-40"
            onClick={clearAll}
          >
            Clear all
          </button>
        </div>

        {message ? (
          <p className="text-sm text-[var(--ink)]">{message}</p>
        ) : null}

        <ul className="max-h-56 space-y-2 overflow-y-auto">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-xl border border-[var(--line)] px-3 py-2 text-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-medium">{item.file.name}</span>
                <span className="shrink-0 text-xs capitalize text-[var(--muted)]">
                  {item.status}
                </span>
              </div>
              {item.error ? (
                <p className="mt-1 text-xs text-red-700">{item.error}</p>
              ) : null}
              {item.status === "done" && item.resultBlob ? (
                <button
                  type="button"
                  className="mt-2 text-xs underline"
                  onClick={() =>
                    downloadBlob(item.resultBlob!, item.resultName!)
                  }
                >
                  Download {item.resultName}
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

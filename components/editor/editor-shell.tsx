"use client";

import {
  ChangeEvent,
  DragEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { PageAgent } from "@/components/page-agent/page-agent";
import { cn } from "@/lib/cn";
import {
  Adjustments,
  CropRect,
  DEFAULT_ADJUSTMENTS,
  EXPORT_FORMATS,
  ExportFormat,
  LoadedImage,
} from "@/lib/editor-types";
import { registerServiceWorker } from "@/lib/register-sw";
import {
  downloadBlob,
  drawEditedImage,
  exportBlob,
  stemFromName,
} from "@/lib/render-image";

type Panel = "adjust" | "crop" | "export";

export function EditorShell() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const [image, setImage] = useState<LoadedImage | null>(null);
  const [adjustments, setAdjustments] =
    useState<Adjustments>(DEFAULT_ADJUSTMENTS);
  const [crop, setCrop] = useState<CropRect | null>(null);
  const [draftCrop, setDraftCrop] = useState<CropRect | null>(null);
  const [cropMode, setCropMode] = useState(false);
  const [panel, setPanel] = useState<Panel>("adjust");
  const [format, setFormat] = useState<ExportFormat>("image/png");
  const [quality, setQuality] = useState(0.92);
  const [busyExport, setBusyExport] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [online, setOnline] = useState(true);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    registerServiceWorker();
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (image?.objectUrl) URL.revokeObjectURL(image.objectUrl);
    };
  }, [image?.objectUrl]);

  useEffect(() => {
    const canvas = previewCanvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !image) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const previewAdjustments = cropMode
      ? { ...adjustments, rotate: 0 as const, flipH: false, flipV: false }
      : adjustments;
    drawEditedImage(
      ctx,
      img,
      image.width,
      image.height,
      previewAdjustments,
      cropMode ? null : crop,
    );
  }, [image, adjustments, crop, cropMode]);

  async function loadFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    setError(null);
    if (image?.objectUrl) URL.revokeObjectURL(image.objectUrl);

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.decoding = "async";

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Could not read that image."));
      img.src = objectUrl;
    }).catch((err: Error) => {
      URL.revokeObjectURL(objectUrl);
      setError(err.message);
      throw err;
    });

    imageRef.current = img;
    setImage({
      name: file.name || "image",
      objectUrl,
      width: img.naturalWidth,
      height: img.naturalHeight,
      fileType: file.type,
    });
    setAdjustments(DEFAULT_ADJUSTMENTS);
    setCrop(null);
    setDraftCrop(null);
    setCropMode(false);
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void loadFile(file);
    event.target.value = "";
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void loadFile(file);
  }

  function startCrop() {
    if (!image) return;
    setPanel("crop");
    setCropMode(true);
    setDraftCrop(
      crop ?? {
        x: Math.round(image.width * 0.1),
        y: Math.round(image.height * 0.1),
        w: Math.round(image.width * 0.8),
        h: Math.round(image.height * 0.8),
      },
    );
  }

  function applyCrop() {
    if (!draftCrop || !image) return;
    const next: CropRect = {
      x: Math.max(0, Math.min(image.width - 1, Math.round(draftCrop.x))),
      y: Math.max(0, Math.min(image.height - 1, Math.round(draftCrop.y))),
      w: Math.max(1, Math.min(image.width - draftCrop.x, Math.round(draftCrop.w))),
      h: Math.max(1, Math.min(image.height - draftCrop.y, Math.round(draftCrop.h))),
    };
    setCrop(next);
    setDraftCrop(null);
    setCropMode(false);
  }

  async function onExport() {
    if (!image || !imageRef.current) return;
    setBusyExport(true);
    setError(null);
    try {
      const blob = await exportBlob(
        imageRef.current,
        image.width,
        image.height,
        adjustments,
        crop,
        format,
        quality,
      );
      const ext =
        EXPORT_FORMATS.find((f) => f.id === format)?.extension ?? "png";
      downloadBlob(blob, `${stemFromName(image.name)}.${ext}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed.");
    } finally {
      setBusyExport(false);
    }
  }

  return (
    <div className="relative flex min-h-full flex-1 flex-col">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(214,180,120,0.16),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(90,120,100,0.18),_transparent_45%)]" />

      <header className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <h1 className="font-[family-name:var(--font-display)] text-3xl leading-none tracking-tight text-[var(--ink)] sm:text-4xl">
            Lumen
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Edit and convert images in the browser
            {!online ? " · Offline" : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onFileChange}
          />
          <button
            type="button"
            className="rounded-xl bg-[var(--ink)] px-4 py-2 text-sm font-medium text-[var(--paper)]"
            onClick={() => fileInputRef.current?.click()}
          >
            Open image
          </button>
          {image ? (
            <button
              type="button"
              className="rounded-xl border border-[var(--line)] bg-[var(--panel)] px-4 py-2 text-sm text-[var(--ink)]"
              onClick={() => {
                setAdjustments(DEFAULT_ADJUSTMENTS);
                setCrop(null);
                setDraftCrop(null);
                setCropMode(false);
              }}
            >
              Reset all
            </button>
          ) : null}
        </div>
      </header>

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 p-4 pb-28 sm:p-6 lg:grid lg:grid-cols-[1fr_300px] lg:pb-6">
        <section
          className={cn(
            "flex min-h-[280px] flex-1 flex-col overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--panel)]/80 backdrop-blur-sm transition",
            dragOver && "border-[var(--accent)] bg-[var(--panel-2)]",
          )}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          {!image ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center"
            >
              <span className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
                Drop an image here
              </span>
              <span className="max-w-sm text-sm text-[var(--muted)]">
                PNG, JPEG, WebP, and other browser-supported formats. Files stay
                on this device.
              </span>
            </button>
          ) : (
            <div className="flex flex-1 items-center justify-center overflow-auto p-3 sm:p-6">
              <div className="relative max-h-full max-w-full">
                <canvas
                  ref={previewCanvasRef}
                  className="max-h-[min(70vh,720px)] max-w-full rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.25)]"
                />
                {cropMode && draftCrop && image ? (
                  <CropOverlay
                    imageWidth={image.width}
                    imageHeight={image.height}
                    crop={draftCrop}
                    onChange={setDraftCrop}
                  />
                ) : null}
              </div>
            </div>
          )}
          {error ? (
            <p className="border-t border-[var(--line)] px-4 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}
          {image ? (
            <p className="border-t border-[var(--line)] px-4 py-2 text-xs text-[var(--muted)]">
              {image.name} · {image.width}×{image.height}
              {crop ? ` · cropped ${crop.w}×${crop.h}` : ""}
            </p>
          ) : null}
        </section>

        <aside className="hidden lg:block">
          <ToolPanel
            panel={panel}
            setPanel={setPanel}
            image={image}
            adjustments={adjustments}
            setAdjustments={setAdjustments}
            cropMode={cropMode}
            startCrop={startCrop}
            applyCrop={applyCrop}
            cancelCrop={() => {
              setCropMode(false);
              setDraftCrop(null);
            }}
            resetCrop={() => {
              setCrop(null);
              setDraftCrop(null);
              setCropMode(false);
            }}
            format={format}
            setFormat={setFormat}
            quality={quality}
            setQuality={setQuality}
            busyExport={busyExport}
            onExport={onExport}
          />
        </aside>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--line)] bg-[var(--panel)]/95 backdrop-blur-md lg:hidden">
        <div className="flex gap-1 p-2">
          {(["adjust", "crop", "export"] as Panel[]).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setPanel(id);
                if (id === "crop") startCrop();
              }}
              className={cn(
                "flex-1 rounded-xl px-3 py-2 text-sm capitalize",
                panel === id
                  ? "bg-[var(--ink)] text-[var(--paper)]"
                  : "text-[var(--muted)]",
              )}
            >
              {id}
            </button>
          ))}
        </div>
        <div className="max-h-[40vh] overflow-y-auto px-3 pb-3">
          <ToolPanel
            panel={panel}
            setPanel={setPanel}
            image={image}
            adjustments={adjustments}
            setAdjustments={setAdjustments}
            cropMode={cropMode}
            startCrop={startCrop}
            applyCrop={applyCrop}
            cancelCrop={() => {
              setCropMode(false);
              setDraftCrop(null);
            }}
            resetCrop={() => {
              setCrop(null);
              setDraftCrop(null);
              setCropMode(false);
            }}
            format={format}
            setFormat={setFormat}
            quality={quality}
            setQuality={setQuality}
            busyExport={busyExport}
            onExport={onExport}
            compact
          />
        </div>
      </nav>

      <PageAgent />
    </div>
  );
}

function ToolPanel({
  panel,
  setPanel,
  image,
  adjustments,
  setAdjustments,
  cropMode,
  startCrop,
  applyCrop,
  cancelCrop,
  resetCrop,
  format,
  setFormat,
  quality,
  setQuality,
  busyExport,
  onExport,
  compact,
}: {
  panel: Panel;
  setPanel: (p: Panel) => void;
  image: LoadedImage | null;
  adjustments: Adjustments;
  setAdjustments: (a: Adjustments | ((prev: Adjustments) => Adjustments)) => void;
  cropMode: boolean;
  startCrop: () => void;
  applyCrop: () => void;
  cancelCrop: () => void;
  resetCrop: () => void;
  format: ExportFormat;
  setFormat: (f: ExportFormat) => void;
  quality: number;
  setQuality: (q: number) => void;
  busyExport: boolean;
  onExport: () => void;
  compact?: boolean;
}) {
  const disabled = !image;

  return (
    <div
      className={cn(
        "rounded-3xl border border-[var(--line)] bg-[var(--panel)]/90 p-4",
        compact && "border-0 bg-transparent p-0",
      )}
    >
      {!compact ? (
        <div className="mb-4 flex gap-1 rounded-xl bg-[var(--panel-2)] p-1">
          {(["adjust", "crop", "export"] as Panel[]).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setPanel(id);
                if (id === "crop") startCrop();
              }}
              className={cn(
                "flex-1 rounded-lg px-2 py-1.5 text-sm capitalize",
                panel === id
                  ? "bg-[var(--ink)] text-[var(--paper)]"
                  : "text-[var(--muted)]",
              )}
            >
              {id}
            </button>
          ))}
        </div>
      ) : null}

      {panel === "adjust" ? (
        <div className="space-y-4">
          <Slider
            label="Brightness"
            value={adjustments.brightness}
            min={-50}
            max={50}
            disabled={disabled}
            onChange={(brightness) =>
              setAdjustments((a) => ({ ...a, brightness }))
            }
          />
          <Slider
            label="Contrast"
            value={adjustments.contrast}
            min={-50}
            max={50}
            disabled={disabled}
            onChange={(contrast) => setAdjustments((a) => ({ ...a, contrast }))}
          />
          <Slider
            label="Saturation"
            value={adjustments.saturation}
            min={-100}
            max={100}
            disabled={disabled}
            onChange={(saturation) =>
              setAdjustments((a) => ({ ...a, saturation }))
            }
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={disabled}
              className="rounded-xl border border-[var(--line)] px-3 py-2 text-sm disabled:opacity-40"
              onClick={() =>
                setAdjustments((a) => ({
                  ...a,
                  rotate: (((a.rotate + 90) % 360) as Adjustments["rotate"]),
                }))
              }
            >
              Rotate 90°
            </button>
            <button
              type="button"
              disabled={disabled}
              className="rounded-xl border border-[var(--line)] px-3 py-2 text-sm disabled:opacity-40"
              onClick={() =>
                setAdjustments((a) => ({ ...a, flipH: !a.flipH }))
              }
            >
              Flip H
            </button>
            <button
              type="button"
              disabled={disabled}
              className="rounded-xl border border-[var(--line)] px-3 py-2 text-sm disabled:opacity-40"
              onClick={() =>
                setAdjustments((a) => ({ ...a, flipV: !a.flipV }))
              }
            >
              Flip V
            </button>
          </div>
          <button
            type="button"
            disabled={disabled}
            className="w-full rounded-xl border border-[var(--line)] px-3 py-2 text-sm disabled:opacity-40"
            onClick={() => setAdjustments(DEFAULT_ADJUSTMENTS)}
          >
            Reset adjustments
          </button>
        </div>
      ) : null}

      {panel === "crop" ? (
        <div className="space-y-3 text-sm text-[var(--muted)]">
          <p>Drag the crop box on the image, then apply.</p>
          <div className="flex flex-wrap gap-2">
            {!cropMode ? (
              <button
                type="button"
                disabled={disabled}
                className="rounded-xl bg-[var(--ink)] px-3 py-2 text-[var(--paper)] disabled:opacity-40"
                onClick={startCrop}
              >
                Start crop
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="rounded-xl bg-[var(--accent)] px-3 py-2 text-[var(--accent-ink)]"
                  onClick={applyCrop}
                >
                  Apply crop
                </button>
                <button
                  type="button"
                  className="rounded-xl border border-[var(--line)] px-3 py-2"
                  onClick={cancelCrop}
                >
                  Cancel
                </button>
              </>
            )}
            <button
              type="button"
              disabled={disabled}
              className="rounded-xl border border-[var(--line)] px-3 py-2 disabled:opacity-40"
              onClick={resetCrop}
            >
              Reset crop
            </button>
          </div>
        </div>
      ) : null}

      {panel === "export" ? (
        <div className="space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block text-[var(--muted)]">Format</span>
            <select
              value={format}
              disabled={disabled}
              onChange={(e) => setFormat(e.target.value as ExportFormat)}
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--panel-2)] px-3 py-2 text-[var(--ink)] disabled:opacity-40"
            >
              {EXPORT_FORMATS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>
          {format !== "image/png" ? (
            <Slider
              label="Quality"
              value={Math.round(quality * 100)}
              min={10}
              max={100}
              disabled={disabled}
              onChange={(v) => setQuality(v / 100)}
            />
          ) : null}
          <button
            type="button"
            disabled={disabled || busyExport}
            className="w-full rounded-xl bg-[var(--accent)] px-3 py-2.5 text-sm font-semibold text-[var(--accent-ink)] disabled:opacity-40"
            onClick={onExport}
          >
            {busyExport ? "Exporting…" : "Download"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 flex justify-between text-[var(--muted)]">
        <span>{label}</span>
        <span>{value}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[var(--accent)] disabled:opacity-40"
      />
    </label>
  );
}

function CropOverlay({
  imageWidth,
  imageHeight,
  crop,
  onChange,
}: {
  imageWidth: number;
  imageHeight: number;
  crop: CropRect;
  onChange: (crop: CropRect) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    origin: CropRect;
  } | null>(null);

  function clientToImage(clientX: number, clientY: number) {
    const el = wrapRef.current;
    if (!el) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * imageWidth;
    const y = ((clientY - rect.top) / rect.height) * imageHeight;
    return { x, y };
  }

  return (
    <div
      ref={wrapRef}
      className="absolute inset-0 cursor-move"
      onPointerDown={(e) => {
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        dragRef.current = {
          startX: e.clientX,
          startY: e.clientY,
          origin: { ...crop },
        };
      }}
      onPointerMove={(e) => {
        if (!dragRef.current || !wrapRef.current) return;
        const rect = wrapRef.current.getBoundingClientRect();
        const dx =
          ((e.clientX - dragRef.current.startX) / rect.width) * imageWidth;
        const dy =
          ((e.clientY - dragRef.current.startY) / rect.height) * imageHeight;
        const origin = dragRef.current.origin;
        onChange({
          ...origin,
          x: Math.max(0, Math.min(imageWidth - origin.w, origin.x + dx)),
          y: Math.max(0, Math.min(imageHeight - origin.h, origin.y + dy)),
        });
      }}
      onPointerUp={() => {
        dragRef.current = null;
      }}
    >
      <div
        className="absolute border-2 border-[var(--accent)] bg-[rgba(214,180,120,0.12)]"
        style={{
          left: `${(crop.x / imageWidth) * 100}%`,
          top: `${(crop.y / imageHeight) * 100}%`,
          width: `${(crop.w / imageWidth) * 100}%`,
          height: `${(crop.h / imageHeight) * 100}%`,
        }}
      />
      <button
        type="button"
        aria-label="Resize crop"
        className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--accent)]"
        style={{
          left: `${((crop.x + crop.w) / imageWidth) * 100}%`,
          top: `${((crop.y + crop.h) / imageHeight) * 100}%`,
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          const origin = { ...crop };
          const onMove = (ev: PointerEvent) => {
            const now = clientToImage(ev.clientX, ev.clientY);
            onChange({
              x: origin.x,
              y: origin.y,
              w: Math.max(8, Math.min(imageWidth - origin.x, now.x - origin.x)),
              h: Math.max(8, Math.min(imageHeight - origin.y, now.y - origin.y)),
            });
          };
          const onUp = () => {
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
          };
          window.addEventListener("pointermove", onMove);
          window.addEventListener("pointerup", onUp);
        }}
      />
    </div>
  );
}

"use client";

import { BatchConvertPanel } from "@/components/editor/batch-convert-panel";
import { MobileRotateBar } from "@/components/editor/mobile-rotate-bar";
import { RecentProjectsPanel } from "@/components/editor/recent-projects";
import { Slider } from "@/components/editor/slider";
import { cn } from "@/lib/cn";
import {
  Adjustments,
  BrushSettings,
  CROP_ASPECTS,
  CropAspect,
  DEFAULT_ADJUSTMENTS,
  EditorDoc,
  EditorLayer,
  EditorTool,
  EXPORT_FORMATS,
  ExportFormat,
  TextLayer,
} from "@/lib/editor-types";

export type PanelId =
  | "adjust"
  | "crop"
  | "brush"
  | "text"
  | "layers"
  | "resize"
  | "redeye"
  | "export"
  | "convert"
  | "projects";

export const PANEL_IDS: PanelId[] = [
  "adjust",
  "crop",
  "brush",
  "text",
  "layers",
  "resize",
  "redeye",
  "export",
  "convert",
  "projects",
];

type Props = {
  panel: PanelId;
  setPanel: (p: PanelId) => void;
  disabled: boolean;
  doc: EditorDoc | null;
  tool: EditorTool;
  setTool: (t: EditorTool) => void;
  brush: BrushSettings;
  setBrush: (b: BrushSettings | ((p: BrushSettings) => BrushSettings)) => void;
  cropAspect: CropAspect;
  setCropAspect: (a: CropAspect) => void;
  cropMode: boolean;
  startCrop: () => void;
  applyCrop: () => void;
  cancelCrop: () => void;
  resetCrop: () => void;
  onAdjustments: (patch: Partial<Adjustments>, commit?: boolean) => void;
  onCommitAdjustments: () => void;
  resizeW: number;
  resizeH: number;
  setResizeW: (n: number) => void;
  setResizeH: (n: number) => void;
  lockAspect: boolean;
  setLockAspect: (v: boolean) => void;
  applyResize: () => void;
  redEyeRadius: number;
  setRedEyeRadius: (n: number) => void;
  format: ExportFormat;
  setFormat: (f: ExportFormat) => void;
  quality: number;
  setQuality: (q: number) => void;
  keepExif: boolean;
  setKeepExif: (v: boolean) => void;
  busyExport: boolean;
  onExport: () => void;
  addPaintLayer: () => void;
  addTextLayer: () => void;
  selectLayer: (id: string) => void;
  toggleLayerVisible: (id: string) => void;
  setLayerOpacity: (id: string, opacity: number) => void;
  commitLayerOpacity: () => void;
  updateActiveText: (patch: Partial<TextLayer>, commit?: boolean) => void;
  deleteActiveLayer: () => void;
  onOpenProject: (id: string) => void;
  projectsRefreshKey: number;
  compact?: boolean;
};

export function ToolPanel(props: Props) {
  const {
    panel,
    setPanel,
    disabled,
    doc,
    setTool,
    brush,
    setBrush,
    cropAspect,
    setCropAspect,
    cropMode,
    startCrop,
    applyCrop,
    cancelCrop,
    resetCrop,
    onAdjustments,
    onCommitAdjustments,
    resizeW,
    resizeH,
    setResizeW,
    setResizeH,
    lockAspect,
    setLockAspect,
    applyResize,
    redEyeRadius,
    setRedEyeRadius,
    format,
    setFormat,
    quality,
    setQuality,
    keepExif,
    setKeepExif,
    busyExport,
    onExport,
    addPaintLayer,
    addTextLayer,
    selectLayer,
    toggleLayerVisible,
    setLayerOpacity,
    commitLayerOpacity,
    updateActiveText,
    deleteActiveLayer,
    onOpenProject,
    projectsRefreshKey,
    compact,
  } = props;

  const adjustments = doc?.adjustments ?? DEFAULT_ADJUSTMENTS;
  const active = doc?.layers.find((l) => l.id === doc.activeLayerId) ?? null;
  const activeText = active?.kind === "text" ? active : null;

  return (
    <div
      className={cn(
        "rounded-3xl border border-[var(--line)] bg-[var(--panel)]/90 p-4",
        compact && "border-0 bg-transparent p-0",
      )}
    >
      {!compact ? (
        <div className="mb-4 grid grid-cols-3 gap-1 rounded-xl bg-[var(--panel-2)] p-1 sm:grid-cols-3">
          {PANEL_IDS.map((id) => (
            <button
              key={id}
              type="button"
              data-lumen-id={`panel-${id}`}
              data-lumen-label={id === "redeye" ? "Red-eye" : id}
              onClick={() => {
                setPanel(id);
                if (id === "crop") startCrop();
                if (id === "brush") setTool("brush");
                if (id === "text") setTool("text");
                if (id === "redeye") setTool("redeye");
                if (id === "resize") setTool("resize");
                if (id === "adjust" || id === "layers" || id === "export") {
                  setTool("select");
                }
              }}
              className={cn(
                "rounded-lg px-1 py-1.5 text-[11px] capitalize sm:text-xs",
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
            onChange={(brightness) => onAdjustments({ brightness })}
            onCommit={onCommitAdjustments}
          />
          <Slider
            label="Contrast"
            value={adjustments.contrast}
            min={-50}
            max={50}
            disabled={disabled}
            onChange={(contrast) => onAdjustments({ contrast })}
            onCommit={onCommitAdjustments}
          />
          <Slider
            label="Saturation"
            value={adjustments.saturation}
            min={-100}
            max={100}
            disabled={disabled}
            onChange={(saturation) => onAdjustments({ saturation })}
            onCommit={onCommitAdjustments}
          />
          <MobileRotateBar
            disabled={disabled}
            adjustments={adjustments}
            onAdjustments={onAdjustments}
          />
          <div className="hidden flex-wrap gap-2 lg:flex">
            <button
              type="button"
              disabled={disabled}
              className="rounded-xl border border-[var(--line)] px-3 py-2 text-sm disabled:opacity-40"
              onClick={() =>
                onAdjustments(
                  {
                    rotate: (((adjustments.rotate + 90) % 360) as Adjustments["rotate"]),
                  },
                  true,
                )
              }
            >
              Rotate 90°
            </button>
            <button
              type="button"
              disabled={disabled}
              className="rounded-xl border border-[var(--line)] px-3 py-2 text-sm disabled:opacity-40"
              onClick={() => onAdjustments({ flipH: !adjustments.flipH }, true)}
            >
              Flip H
            </button>
            <button
              type="button"
              disabled={disabled}
              className="rounded-xl border border-[var(--line)] px-3 py-2 text-sm disabled:opacity-40"
              onClick={() => onAdjustments({ flipV: !adjustments.flipV }, true)}
            >
              Flip V
            </button>
          </div>
          <button
            type="button"
            disabled={disabled}
            className="w-full rounded-xl border border-[var(--line)] px-3 py-2 text-sm disabled:opacity-40"
            onClick={() => onAdjustments({ ...DEFAULT_ADJUSTMENTS }, true)}
          >
            Reset adjustments
          </button>
        </div>
      ) : null}

      {panel === "crop" ? (
        <div className="space-y-3 text-sm">
          <p className="text-[var(--muted)] lg:block">
            Drag inside to move. Use corner/edge handles to reshape. Apply bakes
            the crop into the document.
          </p>
          <div className="hidden flex-wrap gap-1 lg:flex">
            {CROP_ASPECTS.map((a) => (
              <button
                key={a.id}
                type="button"
                disabled={disabled}
                className={cn(
                  "rounded-lg border px-2 py-1 text-xs disabled:opacity-40",
                  cropAspect === a.id
                    ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]"
                    : "border-[var(--line)]",
                )}
                onClick={() => setCropAspect(a.id)}
              >
                {a.label}
              </button>
            ))}
          </div>
          <div className="hidden flex-wrap gap-2 lg:flex">
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
              Clear crop
            </button>
          </div>
          <div className="space-y-2 lg:hidden">
            {!cropMode ? (
              <button
                type="button"
                disabled={disabled}
                className="min-h-12 w-full rounded-xl bg-[var(--ink)] px-3 text-sm text-[var(--paper)] disabled:opacity-40"
                onClick={startCrop}
              >
                Start crop
              </button>
            ) : (
              <p className="text-xs text-[var(--muted)]">
                Use the bar above the tabs to apply, cancel, rotate, or lock
                aspect.
              </p>
            )}
            <button
              type="button"
              disabled={disabled}
              className="min-h-11 w-full rounded-xl border border-[var(--line)] px-3 text-sm disabled:opacity-40"
              onClick={resetCrop}
            >
              Clear crop
            </button>
          </div>
        </div>
      ) : null}

      {panel === "brush" ? (
        <div className="space-y-4">
          <p className="text-sm text-[var(--muted)]">
            Select a paint layer, then draw on the canvas. Each stroke is one
            undo step.
          </p>
          <label className="block text-sm">
            <span className="mb-1 block text-[var(--muted)]">Color</span>
            <input
              type="color"
              value={brush.color}
              disabled={disabled}
              onChange={(e) => setBrush((b) => ({ ...b, color: e.target.value }))}
              className="h-10 w-full cursor-pointer rounded-lg border border-[var(--line)] bg-transparent disabled:opacity-40"
            />
          </label>
          <Slider
            label="Size"
            value={brush.size}
            min={2}
            max={120}
            disabled={disabled}
            onChange={(size) => setBrush((b) => ({ ...b, size }))}
          />
          <Slider
            label="Opacity"
            value={brush.opacity}
            min={5}
            max={100}
            disabled={disabled}
            onChange={(opacity) => setBrush((b) => ({ ...b, opacity }))}
          />
          <label className="flex items-center gap-2 text-sm text-[var(--ink)]">
            <input
              type="checkbox"
              checked={brush.soft}
              disabled={disabled}
              onChange={(e) => setBrush((b) => ({ ...b, soft: e.target.checked }))}
            />
            Soft brush
          </label>
          <button
            type="button"
            disabled={disabled}
            className="w-full rounded-xl bg-[var(--ink)] px-3 py-2 text-sm text-[var(--paper)] disabled:opacity-40"
            onClick={() => setTool("brush")}
          >
            Brush tool active
          </button>
        </div>
      ) : null}

      {panel === "text" ? (
        <div className="space-y-3">
          <button
            type="button"
            disabled={disabled}
            className="w-full rounded-xl bg-[var(--ink)] px-3 py-2 text-sm text-[var(--paper)] disabled:opacity-40"
            onClick={addTextLayer}
          >
            Add text layer
          </button>
          {activeText ? (
            <>
              <label className="block text-sm">
                <span className="mb-1 block text-[var(--muted)]">Content</span>
                <textarea
                  value={activeText.text}
                  rows={3}
                  className="w-full rounded-xl border border-[var(--line)] bg-[var(--panel-2)] px-3 py-2 text-[var(--ink)]"
                  onChange={(e) => updateActiveText({ text: e.target.value })}
                  onBlur={() => updateActiveText({}, true)}
                />
              </label>
              <Slider
                label="Size"
                value={activeText.fontSize}
                min={12}
                max={200}
                onChange={(fontSize) => updateActiveText({ fontSize })}
                onCommit={() => updateActiveText({}, true)}
              />
              <label className="block text-sm">
                <span className="mb-1 block text-[var(--muted)]">Color</span>
                <input
                  type="color"
                  value={activeText.color}
                  onChange={(e) => updateActiveText({ color: e.target.value }, true)}
                  className="h-10 w-full cursor-pointer rounded-lg border border-[var(--line)]"
                />
              </label>
              <p className="text-xs text-[var(--muted)]">
                Drag text on the canvas to reposition.
              </p>
            </>
          ) : (
            <p className="text-sm text-[var(--muted)]">
              Select a text layer in Layers, or add one.
            </p>
          )}
        </div>
      ) : null}

      {panel === "layers" ? (
        <div className="space-y-3">
          <div className="flex gap-2">
            <button
              type="button"
              disabled={disabled}
              className="flex-1 rounded-xl border border-[var(--line)] px-2 py-2 text-sm disabled:opacity-40"
              onClick={addPaintLayer}
            >
              + Paint
            </button>
            <button
              type="button"
              disabled={disabled}
              className="flex-1 rounded-xl border border-[var(--line)] px-2 py-2 text-sm disabled:opacity-40"
              onClick={addTextLayer}
            >
              + Text
            </button>
          </div>
          <ul className="max-h-64 space-y-2 overflow-y-auto">
            {[...(doc?.layers ?? [])].slice().reverse().map((layer) => (
              <LayerRow
                key={layer.id}
                layer={layer}
                active={layer.id === doc?.activeLayerId}
                onSelect={() => selectLayer(layer.id)}
                onToggle={() => toggleLayerVisible(layer.id)}
                onOpacity={(opacity) => setLayerOpacity(layer.id, opacity)}
                onOpacityCommit={commitLayerOpacity}
              />
            ))}
          </ul>
          <button
            type="button"
            disabled={disabled || active?.kind === "background"}
            className="w-full rounded-xl border border-red-300 px-3 py-2 text-sm text-red-800 disabled:opacity-40"
            onClick={deleteActiveLayer}
          >
            Delete active layer
          </button>
        </div>
      ) : null}

      {panel === "resize" ? (
        <div className="space-y-3">
          <p className="text-sm text-[var(--muted)]">
            Resize the document in pixels. Background and paint layers are
            resampled; this creates an undo step.
          </p>
          <label className="block text-sm">
            <span className="mb-1 block text-[var(--muted)]">Width</span>
            <input
              type="number"
              min={1}
              max={8000}
              value={resizeW}
              disabled={disabled}
              onChange={(e) => setResizeW(Number(e.target.value) || 1)}
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--panel-2)] px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-[var(--muted)]">Height</span>
            <input
              type="number"
              min={1}
              max={8000}
              value={resizeH}
              disabled={disabled}
              onChange={(e) => setResizeH(Number(e.target.value) || 1)}
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--panel-2)] px-3 py-2"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={lockAspect}
              onChange={(e) => setLockAspect(e.target.checked)}
            />
            Lock aspect ratio
          </label>
          <button
            type="button"
            disabled={disabled}
            className="w-full rounded-xl bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-[var(--accent-ink)] disabled:opacity-40"
            onClick={applyResize}
          >
            Apply resize
          </button>
        </div>
      ) : null}

      {panel === "redeye" ? (
        <div className="space-y-3">
          <p className="text-sm text-[var(--muted)]">
            Click red pupils on the image. Correction is baked into the
            background and can be undone.
          </p>
          <Slider
            label="Radius"
            value={redEyeRadius}
            min={6}
            max={80}
            disabled={disabled}
            onChange={setRedEyeRadius}
          />
          <button
            type="button"
            disabled={disabled}
            className="w-full rounded-xl bg-[var(--ink)] px-3 py-2 text-sm text-[var(--paper)] disabled:opacity-40"
            onClick={() => setTool("redeye")}
          >
            Red-eye tool active
          </button>
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
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={keepExif}
              disabled={disabled}
              onChange={(e) => setKeepExif(e.target.checked)}
            />
            Keep EXIF metadata
          </label>
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

      {panel === "convert" ? <BatchConvertPanel compact={compact} /> : null}

      {panel === "projects" ? (
        <RecentProjectsPanel
          compact={compact}
          onOpen={onOpenProject}
          refreshKey={projectsRefreshKey}
        />
      ) : null}
    </div>
  );
}

function LayerRow({
  layer,
  active,
  onSelect,
  onToggle,
  onOpacity,
  onOpacityCommit,
}: {
  layer: EditorLayer;
  active: boolean;
  onSelect: () => void;
  onToggle: () => void;
  onOpacity: (opacity: number) => void;
  onOpacityCommit: () => void;
}) {
  return (
    <li
      className={cn(
        "rounded-xl border px-2 py-2",
        active ? "border-[var(--ink)] bg-[var(--panel-2)]" : "border-[var(--line)]",
      )}
    >
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 text-left text-sm"
        onClick={onSelect}
      >
        <span className="truncate font-medium">
          {layer.name}{" "}
          <span className="text-[var(--muted)]">({layer.kind})</span>
        </span>
        <span
          role="presentation"
          className="text-xs text-[var(--muted)]"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
        >
          {layer.visible ? "Hide" : "Show"}
        </span>
      </button>
      <input
        type="range"
        min={0}
        max={100}
        value={layer.opacity}
        className="mt-2 w-full accent-[var(--accent)]"
        onChange={(e) => onOpacity(Number(e.target.value))}
        onPointerUp={onOpacityCommit}
      />
    </li>
  );
}

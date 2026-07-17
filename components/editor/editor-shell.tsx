"use client";

import {
  ChangeEvent,
  DragEvent,
  PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { CropOverlay } from "@/components/editor/crop-overlay";
import { InstallPrompt } from "@/components/editor/install-prompt";
import { MobileCropBar } from "@/components/editor/mobile-crop-bar";
import { RecentProjectsPanel } from "@/components/editor/recent-projects";
import { SelectionOverlay } from "@/components/editor/selection-overlay";
import {
  PANEL_IDS,
  PanelId,
  ToolPanel,
} from "@/components/editor/tool-panel";
import { PageAgent } from "@/components/page-agent/page-agent";
import { decodeToImage, isHeicFile } from "@/lib/convert/decode";
import { readExif, type ExifPayload } from "@/lib/convert/exif";
import {
  bakeToCanvas,
  composeEdited,
  downloadBlob,
  exportDocument,
  resizeCanvas,
  stemFromName,
} from "@/lib/compose";
import { cn } from "@/lib/cn";
import { applyAspectToCrop, clampCrop } from "@/lib/crop-math";
import {
  Adjustments,
  BrushSettings,
  CropAspect,
  CropRect,
  DEFAULT_BRUSH,
  DEFAULT_RETOUCH,
  EditorDoc,
  EditorSnapshot,
  EditorTool,
  EXPORT_FORMATS,
  ExportFormat,
  LoadedImage,
  RetouchSettings,
  TextLayer,
  createId,
  createInitialDoc,
  createPaintLayer,
  createTextLayer,
} from "@/lib/editor-types";
import {
  HistoryState,
  cloneDoc,
  initHistory,
  pushHistory,
  redoHistory,
  undoHistory,
} from "@/lib/history";
import { blobToImage, persistProject } from "@/lib/offline/project-io";
import { getProject, isIndexedDbAvailable } from "@/lib/offline/projects";
import { PaintStore, loadImage } from "@/lib/paint-store";
import { removeRedEye } from "@/lib/red-eye";
import {
  activateWaitingWorker,
  registerServiceWorker,
  type SwStatus,
} from "@/lib/register-sw";
import {
  clearSelection as clearSelectionPixelsFn,
  cloneBrush,
  healBrush,
  healSelection,
} from "@/lib/retouch";

export function EditorShell() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const sourceImageRef = useRef<HTMLImageElement | null>(null);
  const backgroundCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const paintStoreRef = useRef(new PaintStore());
  const historyRef = useRef<HistoryState | null>(null);
  const paintingRef = useRef(false);
  const lastPaintRef = useRef<{ x: number; y: number } | null>(null);
  const textDragRef = useRef<{
    id: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const marqueeStartRef = useRef<{ x: number; y: number } | null>(null);
  const retouchStrokeRef = useRef(false);
  const cloneOffsetRef = useRef<{ x: number; y: number } | null>(null);
  const cloneSourceDataRef = useRef<ImageData | null>(null);
  const skipNextComposeRef = useRef(false);

  const [image, setImage] = useState<LoadedImage | null>(null);
  const [doc, setDoc] = useState<EditorDoc | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [panel, setPanel] = useState<PanelId>("adjust");
  const [tool, setTool] = useState<EditorTool>("select");
  const [brush, setBrush] = useState<BrushSettings>(DEFAULT_BRUSH);
  const [retouch, setRetouch] = useState<RetouchSettings>(DEFAULT_RETOUCH);
  const [selection, setSelection] = useState<CropRect | null>(null);
  const [draftSelection, setDraftSelection] = useState<CropRect | null>(null);
  const [cloneSource, setCloneSource] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [cropAspect, setCropAspect] = useState<CropAspect>("free");
  const [cropMode, setCropMode] = useState(false);
  const [draftCrop, setDraftCrop] = useState<CropRect | null>(null);
  const [format, setFormat] = useState<ExportFormat>("image/png");
  const [quality, setQuality] = useState(0.92);
  const [keepExif, setKeepExif] = useState(true);
  const [busyExport, setBusyExport] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [online, setOnline] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [resizeW, setResizeW] = useState(0);
  const [resizeH, setResizeH] = useState(0);
  const [lockAspect, setLockAspect] = useState(true);
  const [aspectBase, setAspectBase] = useState(1);
  const [redEyeRadius, setRedEyeRadius] = useState(28);
  const [bgVersion, setBgVersion] = useState(0);
  const docRef = useRef<EditorDoc | null>(null);
  const exifRef = useRef<ExifPayload | null>(null);
  const projectIdRef = useRef<string | null>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [projectsRefreshKey, setProjectsRefreshKey] = useState(0);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [swStatus, setSwStatus] = useState<SwStatus>({
    supported: false,
    controlling: false,
    waiting: false,
    version: null,
  });

  useEffect(() => {
    docRef.current = doc;
  }, [doc]);

  useEffect(() => {
    const unsub = registerServiceWorker(setSwStatus);
    return () => {
      unsub();
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, []);

  const syncHistoryFlags = useCallback(() => {
    const h = historyRef.current;
    setCanUndo(!!h && h.past.length > 0);
    setCanRedo(!!h && h.future.length > 0);
  }, []);

  const getBackground = useCallback((): CanvasImageSource => {
    return backgroundCanvasRef.current ?? sourceImageRef.current!;
  }, []);

  const captureSnapshot = useCallback(
    (nextDoc: EditorDoc): EditorSnapshot => {
      const paintIds = nextDoc.layers
        .filter((l) => l.kind === "paint")
        .map((l) => l.id);
      return {
        doc: cloneDoc(nextDoc),
        paintData: paintStoreRef.current.capture(paintIds),
        backgroundDataUrl: backgroundCanvasRef.current
          ? backgroundCanvasRef.current.toDataURL("image/png")
          : null,
      };
    },
    [],
  );

  const scheduleAutoSaveRef = useRef<() => void>(() => undefined);

  const saveProjectNow = useCallback(
    async (silent = false) => {
      const current = docRef.current;
      if (!current || !sourceImageRef.current) return;
      if (!isIndexedDbAvailable()) {
        if (!silent) {
          setError("IndexedDB is not available in this browser.");
        }
        return;
      }
      setSaveState("saving");
      try {
        const saved = await persistProject({
          id: projectIdRef.current ?? undefined,
          name: image?.name ?? "Untitled",
          doc: current,
          background: getBackground(),
          paintStore: paintStoreRef.current,
        });
        projectIdRef.current = saved.id;
        setSaveState("saved");
        setProjectsRefreshKey((k) => k + 1);
        if (!silent) setError(null);
      } catch (err) {
        setSaveState("error");
        if (!silent) {
          setError(err instanceof Error ? err.message : "Save failed.");
        }
      }
    },
    [getBackground, image?.name],
  );

  useEffect(() => {
    scheduleAutoSaveRef.current = () => {
      if (!isIndexedDbAvailable() || !docRef.current || !sourceImageRef.current) {
        return;
      }
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(() => {
        void saveProjectNow(true);
      }, 1800);
    };
  }, [saveProjectNow]);

  const commitSnapshot = useCallback(
    (nextDoc: EditorDoc) => {
      const snap = captureSnapshot(nextDoc);
      if (!historyRef.current) {
        historyRef.current = initHistory(snap);
      } else {
        historyRef.current = pushHistory(historyRef.current, snap);
      }
      setDoc(nextDoc);
      syncHistoryFlags();
      scheduleAutoSaveRef.current();
    },
    [captureSnapshot, syncHistoryFlags],
  );

  const restoreSnapshot = useCallback(async (snap: EditorSnapshot) => {
    const { doc: nextDoc, paintData, backgroundDataUrl } = snap;
    await paintStoreRef.current.restoreAll(
      paintData,
      nextDoc.width,
      nextDoc.height,
    );

    if (backgroundDataUrl) {
      const img = await loadImage(backgroundDataUrl);
      const canvas = document.createElement("canvas");
      canvas.width = nextDoc.width;
      canvas.height = nextDoc.height;
      canvas.getContext("2d")?.drawImage(img, 0, 0);
      backgroundCanvasRef.current = canvas;
    } else {
      backgroundCanvasRef.current = null;
    }

    setDoc(cloneDoc(nextDoc));
    setResizeW(nextDoc.width);
    setResizeH(nextDoc.height);
    setAspectBase(nextDoc.width / Math.max(1, nextDoc.height));
    setBgVersion((v) => v + 1);
    setCropMode(false);
    setDraftCrop(null);
  }, []);

  const undo = useCallback(async () => {
    const h = historyRef.current;
    if (!h) return;
    const next = undoHistory(h);
    if (!next) return;
    historyRef.current = next;
    await restoreSnapshot(next.present);
    syncHistoryFlags();
  }, [restoreSnapshot, syncHistoryFlags]);

  const redo = useCallback(async () => {
    const h = historyRef.current;
    if (!h) return;
    const next = redoHistory(h);
    if (!next) return;
    historyRef.current = next;
    await restoreSnapshot(next.present);
    syncHistoryFlags();
  }, [restoreSnapshot, syncHistoryFlags]);

  useEffect(() => {
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
    function onGoto(event: Event) {
      const panel = (event as CustomEvent<{ panel?: string }>).detail?.panel;
      if (!panel) return;
      setPanel(panel as PanelId);
      if (panel === "crop") startCrop();
      if (panel === "brush") setTool("brush");
      if (panel === "text") setTool("text");
      if (panel === "redeye") setTool("redeye");
      if (panel === "retouch") setTool("marquee");
    }
    window.addEventListener("lumen:goto-panel", onGoto);
    return () => window.removeEventListener("lumen:goto-panel", onGoto);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      if (e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        void undo();
      } else if (
        e.key.toLowerCase() === "y" ||
        (e.key.toLowerCase() === "z" && e.shiftKey)
      ) {
        e.preventDefault();
        void redo();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  useEffect(() => {
    return () => {
      if (image?.objectUrl) URL.revokeObjectURL(image.objectUrl);
    };
  }, [image?.objectUrl]);

  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas || !doc || !sourceImageRef.current) return;
    if (skipNextComposeRef.current) {
      skipNextComposeRef.current = false;
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const previewDoc =
      cropMode && draftCrop
        ? { ...doc, crop: null }
        : doc;
    composeEdited(ctx, previewDoc, getBackground(), paintStoreRef.current, {
      ignoreCrop: cropMode,
      forceIdentityTransform: cropMode,
    });
  }, [doc, cropMode, draftCrop, getBackground, bgVersion]);

  async function loadFile(file: File) {
    const looksLikeImage =
      file.type.startsWith("image/") || isHeicFile(file);
    if (!looksLikeImage) {
      setError("Please choose an image file.");
      return;
    }
    setError(null);
    if (image?.objectUrl) URL.revokeObjectURL(image.objectUrl);

    try {
      projectIdRef.current = null;
      exifRef.current = await readExif(file);
      const decoded = await decodeToImage(file);
      const img = decoded.image;
      const objectUrl = decoded.objectUrl;

      sourceImageRef.current = img;
      backgroundCanvasRef.current = null;
      paintStoreRef.current.clear();

      const nextDoc = createInitialDoc(img.naturalWidth, img.naturalHeight);
      paintStoreRef.current.ensure(
        nextDoc.layers.find((l) => l.kind === "paint")!.id,
        nextDoc.width,
        nextDoc.height,
      );

      historyRef.current = initHistory({
        doc: cloneDoc(nextDoc),
        paintData: paintStoreRef.current.capture(
          nextDoc.layers.filter((l) => l.kind === "paint").map((l) => l.id),
        ),
        backgroundDataUrl: null,
      });

      setImage({
        name: file.name || "image",
        objectUrl,
        width: img.naturalWidth,
        height: img.naturalHeight,
        fileType: file.type || "image/*",
      });
      setDoc(nextDoc);
      setResizeW(nextDoc.width);
      setResizeH(nextDoc.height);
      setAspectBase(nextDoc.width / Math.max(1, nextDoc.height));
      setCropMode(false);
      setDraftCrop(null);
      setSelection(null);
      setDraftSelection(null);
      setCloneSource(null);
      cloneOffsetRef.current = null;
      setTool("select");
      setPanel("adjust");
      setBgVersion((v) => v + 1);
      syncHistoryFlags();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open image.");
    }
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

  function onAdjustments(patch: Partial<Adjustments>, commit = false) {
    setDoc((prev) => {
      if (!prev) return prev;
      const next = {
        ...prev,
        adjustments: { ...prev.adjustments, ...patch },
      };
      docRef.current = next;
      if (commit) queueMicrotask(() => commitSnapshot(next));
      return next;
    });
  }

  const cropAspectRef = useRef(cropAspect);
  useEffect(() => {
    cropAspectRef.current = cropAspect;
  }, [cropAspect]);

  function onCommitAdjustments() {
    const current = docRef.current;
    if (!current) return;
    commitSnapshot(current);
  }

  function startCrop() {
    const current = docRef.current;
    if (!current) return;
    const aspect = cropAspectRef.current;
    setPanel("crop");
    setTool("crop");
    setCropMode(true);
    const base =
      current.crop ??
      clampCrop(
        {
          x: Math.round(current.width * 0.1),
          y: Math.round(current.height * 0.1),
          w: Math.round(current.width * 0.8),
          h: Math.round(current.height * 0.8),
        },
        current.width,
        current.height,
      );
    setDraftCrop(
      applyAspectToCrop(base, aspect, current.width, current.height),
    );
  }

  useEffect(() => {
    if (!cropMode || !draftCrop || !doc) return;
    setDraftCrop(
      applyAspectToCrop(draftCrop, cropAspect, doc.width, doc.height),
    );
    // only when aspect changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cropAspect]);

  function applyCrop() {
    if (!doc || !draftCrop || !sourceImageRef.current) return;
    const region = clampCrop(draftCrop, doc.width, doc.height);

    // Background only (no paint/text), then crop paint layers individually
    const bgOnly: EditorDoc = {
      ...doc,
      crop: null,
      adjustments: {
        ...doc.adjustments,
        rotate: 0,
        flipH: false,
        flipV: false,
        brightness: 0,
        contrast: 0,
        saturation: 0,
      },
      layers: doc.layers.filter((l) => l.kind === "background"),
    };
    const baked = bakeToCanvas(bgOnly, getBackground(), paintStoreRef.current, region);
    backgroundCanvasRef.current = baked;

    const paintLayers = doc.layers.filter((l) => l.kind === "paint");
    for (const layer of paintLayers) {
      const src = paintStoreRef.current.ensure(layer.id, doc.width, doc.height);
      const cropped = document.createElement("canvas");
      cropped.width = region.w;
      cropped.height = region.h;
      cropped
        .getContext("2d")
        ?.drawImage(
          src,
          region.x,
          region.y,
          region.w,
          region.h,
          0,
          0,
          region.w,
          region.h,
        );
      paintStoreRef.current.delete(layer.id);
      const nextCanvas = paintStoreRef.current.ensure(layer.id, region.w, region.h);
      nextCanvas.getContext("2d")?.drawImage(cropped, 0, 0);
    }

    const textLayers = doc.layers
      .filter((l): l is TextLayer => l.kind === "text")
      .map((t) => ({
        ...t,
        x: t.x - region.x,
        y: t.y - region.y,
      }));

    const bg = doc.layers.find((l) => l.kind === "background")!;
    const nextDoc: EditorDoc = {
      width: region.w,
      height: region.h,
      adjustments: doc.adjustments,
      crop: null,
      activeLayerId: doc.activeLayerId,
      layers: [bg, ...paintLayers, ...textLayers],
    };

    setCropMode(false);
    setDraftCrop(null);
    setTool("select");
    setResizeW(nextDoc.width);
    setResizeH(nextDoc.height);
    setAspectBase(nextDoc.width / Math.max(1, nextDoc.height));
    setBgVersion((v) => v + 1);
    commitSnapshot(nextDoc);
  }

  function cancelCrop() {
    setCropMode(false);
    setDraftCrop(null);
    setTool("select");
  }

  function resetCrop() {
    if (!doc) return;
    setCropMode(false);
    setDraftCrop(null);
    if (doc.crop) {
      commitSnapshot({ ...doc, crop: null });
    }
  }

  function clientToDoc(clientX: number, clientY: number) {
    const canvas = previewCanvasRef.current;
    if (!canvas || !doc) return null;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    // In crop mode preview is identity transform at doc size
    const x = ((clientX - rect.left) / rect.width) * doc.width;
    const y = ((clientY - rect.top) / rect.height) * doc.height;
    return { x, y };
  }

  function ensureBackgroundCanvas(): HTMLCanvasElement | null {
    if (!doc || !sourceImageRef.current) return null;
    if (backgroundCanvasRef.current) return backgroundCanvasRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = doc.width;
    canvas.height = doc.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(sourceImageRef.current, 0, 0, doc.width, doc.height);
    backgroundCanvasRef.current = canvas;
    return canvas;
  }

  function mutateBackground(
    mutate: (imageData: ImageData) => void,
    options?: { bump?: boolean },
  ): boolean {
    const canvas = ensureBackgroundCanvas();
    if (!canvas) return false;
    const ctx = canvas.getContext("2d");
    if (!ctx) return false;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    mutate(imageData);
    ctx.putImageData(imageData, 0, 0);
    if (options?.bump !== false) setBgVersion((v) => v + 1);
    return true;
  }

  function normalizeRect(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
  ): CropRect {
    const x = Math.min(x0, x1);
    const y = Math.min(y0, y1);
    const w = Math.abs(x1 - x0);
    const h = Math.abs(y1 - y0);
    return {
      x: Math.round(x),
      y: Math.round(y),
      w: Math.round(w),
      h: Math.round(h),
    };
  }

  function dabHeal(x: number, y: number) {
    mutateBackground(
      (imageData) => {
        healBrush(imageData, x, y, retouch.size / 2, retouch.strength);
      },
      { bump: false },
    );
  }

  function dabClone(x: number, y: number) {
    const canvas = ensureBackgroundCanvas();
    if (!canvas || !cloneOffsetRef.current || !cloneSourceDataRef.current) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    cloneBrush(
      imageData,
      cloneSourceDataRef.current,
      x,
      y,
      retouch.size / 2,
      cloneOffsetRef.current.x,
      cloneOffsetRef.current.y,
      retouch.strength,
    );
    ctx.putImageData(imageData, 0, 0);
  }

  function paintAt(x: number, y: number, layerId: string) {
    if (!doc) return;
    const canvas = paintStoreRef.current.ensure(layerId, doc.width, doc.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.save();
    ctx.globalAlpha = brush.opacity / 100;
    ctx.strokeStyle = brush.color;
    ctx.fillStyle = brush.color;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = brush.size;
    if (brush.soft) {
      ctx.shadowColor = brush.color;
      ctx.shadowBlur = brush.size * 0.35;
    }
    const prev = lastPaintRef.current;
    if (prev) {
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(x, y, brush.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    lastPaintRef.current = { x, y };
  }

  function redrawPreview() {
    const canvas = previewCanvasRef.current;
    if (!canvas || !doc || !sourceImageRef.current) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    composeEdited(ctx, doc, getBackground(), paintStoreRef.current, {
      ignoreCrop: cropMode,
      forceIdentityTransform: cropMode,
    });
  }

  function onPointerDown(e: ReactPointerEvent) {
    if (!doc || cropMode) return;
    const point = clientToDoc(e.clientX, e.clientY);
    if (!point) return;

    if (tool === "redeye") {
      e.preventDefault();
      applyRedEye(point.x, point.y);
      return;
    }

    if (tool === "marquee") {
      e.preventDefault();
      marqueeStartRef.current = { x: point.x, y: point.y };
      setDraftSelection({ x: Math.round(point.x), y: Math.round(point.y), w: 0, h: 0 });
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      return;
    }

    if (tool === "heal") {
      e.preventDefault();
      retouchStrokeRef.current = true;
      lastPaintRef.current = null;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      dabHeal(point.x, point.y);
      lastPaintRef.current = { x: point.x, y: point.y };
      redrawPreview();
      return;
    }

    if (tool === "clone") {
      e.preventDefault();
      if (e.altKey) {
        setCloneSource({ x: point.x, y: point.y });
        cloneOffsetRef.current = null;
        setError(null);
        return;
      }
      if (!cloneSource) {
        setError("Alt-click (Option-click) to set the clone source first.");
        return;
      }
      const bg = ensureBackgroundCanvas();
      if (!bg) return;
      const ctx = bg.getContext("2d");
      if (!ctx) return;
      cloneSourceDataRef.current = ctx.getImageData(0, 0, bg.width, bg.height);
      cloneOffsetRef.current = {
        x: cloneSource.x - point.x,
        y: cloneSource.y - point.y,
      };
      retouchStrokeRef.current = true;
      lastPaintRef.current = null;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      dabClone(point.x, point.y);
      lastPaintRef.current = { x: point.x, y: point.y };
      setError(null);
      redrawPreview();
      return;
    }

    if (tool === "brush") {
      const active = doc.layers.find((l) => l.id === doc.activeLayerId);
      if (!active || active.kind !== "paint") {
        setError("Select a paint layer before brushing.");
        return;
      }
      setError(null);
      paintingRef.current = true;
      lastPaintRef.current = null;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      paintAt(point.x, point.y, active.id);
      redrawPreview();
      return;
    }

    if (tool === "text" || tool === "select") {
      const active = doc.layers.find((l) => l.id === doc.activeLayerId);
      if (active?.kind === "text") {
        textDragRef.current = {
          id: active.id,
          offsetX: point.x - active.x,
          offsetY: point.y - active.y,
        };
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      }
    }
  }

  function onPointerMove(e: ReactPointerEvent) {
    if (!doc) return;
    const point = clientToDoc(e.clientX, e.clientY);
    if (!point) return;

    if (marqueeStartRef.current && tool === "marquee") {
      const start = marqueeStartRef.current;
      setDraftSelection(normalizeRect(start.x, start.y, point.x, point.y));
      return;
    }

    if (retouchStrokeRef.current && tool === "heal") {
      const prev = lastPaintRef.current;
      if (prev) {
        const dx = point.x - prev.x;
        const dy = point.y - prev.y;
        const dist = Math.hypot(dx, dy);
        const step = Math.max(2, retouch.size * 0.35);
        if (dist >= step) {
          const n = Math.floor(dist / step);
          for (let i = 1; i <= n; i++) {
            dabHeal(prev.x + (dx * i) / n, prev.y + (dy * i) / n);
          }
          lastPaintRef.current = { x: point.x, y: point.y };
          redrawPreview();
        }
      }
      return;
    }

    if (retouchStrokeRef.current && tool === "clone") {
      const prev = lastPaintRef.current;
      if (prev) {
        const dx = point.x - prev.x;
        const dy = point.y - prev.y;
        const dist = Math.hypot(dx, dy);
        const step = Math.max(2, retouch.size * 0.35);
        if (dist >= step) {
          const n = Math.floor(dist / step);
          for (let i = 1; i <= n; i++) {
            dabClone(prev.x + (dx * i) / n, prev.y + (dy * i) / n);
          }
          lastPaintRef.current = { x: point.x, y: point.y };
          redrawPreview();
        }
      }
      return;
    }

    if (paintingRef.current && tool === "brush") {
      paintAt(point.x, point.y, doc.activeLayerId);
      redrawPreview();
      return;
    }

    if (textDragRef.current) {
      const { id, offsetX, offsetY } = textDragRef.current;
      setDoc((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          layers: prev.layers.map((layer) =>
            layer.id === id && layer.kind === "text"
              ? { ...layer, x: point.x - offsetX, y: point.y - offsetY }
              : layer,
          ),
        };
      });
    }
  }

  function onPointerUp() {
    const current = docRef.current;
    if (marqueeStartRef.current) {
      marqueeStartRef.current = null;
      setDraftSelection((draft) => {
        if (draft && draft.w >= 2 && draft.h >= 2) {
          queueMicrotask(() => setSelection(draft));
        }
        return null;
      });
    }
    if (retouchStrokeRef.current && current) {
      retouchStrokeRef.current = false;
      lastPaintRef.current = null;
      cloneSourceDataRef.current = null;
      setBgVersion((v) => v + 1);
      commitSnapshot(current);
    }
    if (paintingRef.current && current) {
      paintingRef.current = false;
      lastPaintRef.current = null;
      commitSnapshot(current);
    }
    if (textDragRef.current && current) {
      textDragRef.current = null;
      commitSnapshot(current);
    }
  }

  function clearSelection() {
    setSelection(null);
    setDraftSelection(null);
  }

  function healSelectionArea() {
    if (!doc || !selection || selection.w < 2 || selection.h < 2) return;
    const ok = mutateBackground((imageData) => {
      healSelection(imageData, selection, retouch.strength);
    });
    if (ok) commitSnapshot(doc);
  }

  function clearSelectionPixels() {
    if (!doc || !selection) return;
    const active = doc.layers.find((l) => l.id === doc.activeLayerId);
    if (!active || active.kind !== "paint") {
      setError("Select a paint layer to clear a selection.");
      return;
    }
    const canvas = paintStoreRef.current.ensure(active.id, doc.width, doc.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    clearSelectionPixelsFn(imageData, selection);
    ctx.putImageData(imageData, 0, 0);
    setError(null);
    commitSnapshot(doc);
  }

  function applyRedEye(x: number, y: number) {
    if (!doc) return;
    const base = bakeToCanvas(
      {
        ...doc,
        layers: doc.layers.filter((l) => l.kind === "background"),
        crop: null,
        adjustments: {
          ...doc.adjustments,
          rotate: 0,
          flipH: false,
          flipV: false,
          brightness: 0,
          contrast: 0,
          saturation: 0,
        },
      },
      getBackground(),
      paintStoreRef.current,
      null,
    );
    const ctx = base.getContext("2d");
    if (!ctx) return;
    const imageData = ctx.getImageData(0, 0, base.width, base.height);
    removeRedEye(imageData, x, y, redEyeRadius);
    ctx.putImageData(imageData, 0, 0);
    backgroundCanvasRef.current = base;
    setBgVersion((v) => v + 1);
    commitSnapshot(doc);
  }

  function applyResize() {
    if (!doc || !sourceImageRef.current) return;
    const width = Math.max(1, Math.min(8000, Math.round(resizeW)));
    const height = Math.max(1, Math.min(8000, Math.round(resizeH)));
    if (width === doc.width && height === doc.height) return;

    const bgOnly: EditorDoc = {
      ...doc,
      crop: null,
      adjustments: {
        ...doc.adjustments,
        rotate: 0,
        flipH: false,
        flipV: false,
        brightness: 0,
        contrast: 0,
        saturation: 0,
      },
      layers: doc.layers.filter((l) => l.kind === "background"),
    };
    const flatBg = bakeToCanvas(bgOnly, getBackground(), paintStoreRef.current, null);
    backgroundCanvasRef.current = resizeCanvas(flatBg, width, height);

    for (const layer of doc.layers.filter((l) => l.kind === "paint")) {
      const src = paintStoreRef.current.ensure(layer.id, doc.width, doc.height);
      const resized = resizeCanvas(src, width, height);
      paintStoreRef.current.delete(layer.id);
      const next = paintStoreRef.current.ensure(layer.id, width, height);
      next.getContext("2d")?.drawImage(resized, 0, 0);
    }

    const scaleX = width / doc.width;
    const scaleY = height / doc.height;
    const nextLayers = doc.layers.map((layer) => {
      if (layer.kind !== "text") return layer;
      return {
        ...layer,
        x: Math.round(layer.x * scaleX),
        y: Math.round(layer.y * scaleY),
        fontSize: Math.max(8, Math.round(layer.fontSize * ((scaleX + scaleY) / 2))),
      };
    });

    const nextDoc: EditorDoc = {
      ...doc,
      width,
      height,
      crop: null,
      layers: nextLayers,
    };
    setBgVersion((v) => v + 1);
    commitSnapshot(nextDoc);
  }

  function addPaintLayer() {
    if (!doc) return;
    const paints = doc.layers.filter((l) => l.kind === "paint").length;
    const layer = createPaintLayer(paints + 1);
    paintStoreRef.current.ensure(layer.id, doc.width, doc.height);
    const next = {
      ...doc,
      layers: [...doc.layers, layer],
      activeLayerId: layer.id,
    };
    setTool("brush");
    setPanel("brush");
    commitSnapshot(next);
  }

  function addTextLayer() {
    if (!doc) return;
    const texts = doc.layers.filter((l) => l.kind === "text").length;
    const layer = createTextLayer(doc.width, doc.height, texts + 1);
    const next = {
      ...doc,
      layers: [...doc.layers, layer],
      activeLayerId: layer.id,
    };
    setTool("text");
    setPanel("text");
    commitSnapshot(next);
  }

  function selectLayer(id: string) {
    if (!doc) return;
    const layer = doc.layers.find((l) => l.id === id);
    setDoc({ ...doc, activeLayerId: id });
    if (layer?.kind === "paint") {
      setTool("brush");
      setPanel("brush");
    }
    if (layer?.kind === "text") {
      setTool("text");
      setPanel("text");
    }
  }

  function toggleLayerVisible(id: string) {
    if (!doc) return;
    const next = {
      ...doc,
      layers: doc.layers.map((l) =>
        l.id === id ? { ...l, visible: !l.visible } : l,
      ),
    };
    commitSnapshot(next);
  }

  function setLayerOpacity(id: string, opacity: number) {
    setDoc((prev) => {
      if (!prev) return prev;
      const next = {
        ...prev,
        layers: prev.layers.map((l) =>
          l.id === id ? { ...l, opacity } : l,
        ),
      };
      docRef.current = next;
      return next;
    });
  }

  function commitLayerOpacity() {
    const current = docRef.current;
    if (current) commitSnapshot(current);
  }

  function updateActiveText(patch: Partial<TextLayer>, commit = false) {
    setDoc((prev) => {
      if (!prev) return prev;
      const next = {
        ...prev,
        layers: prev.layers.map((l) =>
          l.id === prev.activeLayerId && l.kind === "text"
            ? { ...l, ...patch }
            : l,
        ),
      };
      docRef.current = next;
      if (commit) queueMicrotask(() => commitSnapshot(next));
      return next;
    });
  }

  function deleteActiveLayer() {
    if (!doc) return;
    const active = doc.layers.find((l) => l.id === doc.activeLayerId);
    if (!active || active.kind === "background") return;
    if (active.kind === "paint") paintStoreRef.current.delete(active.id);
    const layers = doc.layers.filter((l) => l.id !== active.id);
    const next = {
      ...doc,
      layers,
      activeLayerId: layers[layers.length - 1]?.id ?? layers[0].id,
    };
    commitSnapshot(next);
  }

  function moveLayer(id: string, direction: "up" | "down") {
    if (!doc) return;
    const idx = doc.layers.findIndex((l) => l.id === id);
    if (idx < 0) return;
    const layer = doc.layers[idx];
    if (layer.kind === "background") return;
    // up = toward top of stack (higher index); never swap below background at 0
    const target = direction === "up" ? idx + 1 : idx - 1;
    if (target < 1 || target >= doc.layers.length) return;
    const layers = [...doc.layers];
    [layers[idx], layers[target]] = [layers[target], layers[idx]];
    commitSnapshot({ ...doc, layers });
  }

  function cloneLayer(id: string) {
    if (!doc) return;
    const idx = doc.layers.findIndex((l) => l.id === id);
    if (idx < 0) return;
    const layer = doc.layers[idx];
    if (layer.kind === "background") return;

    if (layer.kind === "paint") {
      const paints = doc.layers.filter((l) => l.kind === "paint").length;
      const copy = createPaintLayer(paints + 1);
      copy.name = `${layer.name} copy`;
      copy.opacity = layer.opacity;
      copy.visible = layer.visible;
      const src = paintStoreRef.current.ensure(layer.id, doc.width, doc.height);
      const dest = paintStoreRef.current.ensure(copy.id, doc.width, doc.height);
      dest.getContext("2d")?.drawImage(src, 0, 0);
      const layers = [
        ...doc.layers.slice(0, idx + 1),
        copy,
        ...doc.layers.slice(idx + 1),
      ];
      commitSnapshot({ ...doc, layers, activeLayerId: copy.id });
      return;
    }

    if (layer.kind === "text") {
      const texts = doc.layers.filter((l) => l.kind === "text").length;
      const copy: TextLayer = {
        ...layer,
        id: createId("text"),
        name: `${layer.name} copy`,
        x: layer.x + 24,
        y: layer.y + 24,
      };
      // keep unique naming if already a copy
      if (!layer.name.includes("copy")) {
        copy.name = `Text ${texts + 1}`;
      }
      const layers = [
        ...doc.layers.slice(0, idx + 1),
        copy,
        ...doc.layers.slice(idx + 1),
      ];
      commitSnapshot({ ...doc, layers, activeLayerId: copy.id });
    }
  }

  async function onExport() {
    if (!doc || !sourceImageRef.current) return;
    setBusyExport(true);
    setError(null);
    try {
      const blob = await exportDocument(
        doc,
        getBackground(),
        paintStoreRef.current,
        format,
        quality,
        exifRef.current,
        keepExif,
      );
      const ext =
        EXPORT_FORMATS.find((f) => f.id === format)?.extension ?? "png";
      downloadBlob(blob, `${stemFromName(image?.name ?? "image")}.${ext}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed.");
    } finally {
      setBusyExport(false);
    }
  }

  function onResizeWidth(n: number) {
    setResizeW(n);
    if (lockAspect) setResizeH(Math.max(1, Math.round(n / aspectBase)));
  }

  function onResizeHeight(n: number) {
    setResizeH(n);
    if (lockAspect) setResizeW(Math.max(1, Math.round(n * aspectBase)));
  }

  async function openProject(id: string) {
    setError(null);
    setSaveState("idle");
    try {
      const project = await getProject(id);
      if (!project) {
        setError("Saved project not found.");
        return;
      }

      if (image?.objectUrl) URL.revokeObjectURL(image.objectUrl);

      const bgImg = await blobToImage(project.background);
      const bgCanvas = document.createElement("canvas");
      bgCanvas.width = project.width;
      bgCanvas.height = project.height;
      bgCanvas.getContext("2d")?.drawImage(bgImg, 0, 0);
      backgroundCanvasRef.current = bgCanvas;
      sourceImageRef.current = bgImg;

      paintStoreRef.current.clear();
      for (const [layerId, blob] of Object.entries(project.paints)) {
        const layerImg = await blobToImage(blob);
        const canvas = paintStoreRef.current.ensure(
          layerId,
          project.width,
          project.height,
        );
        canvas.getContext("2d")?.drawImage(layerImg, 0, 0);
        const layerUrl = (
          layerImg as HTMLImageElement & { __objectUrl?: string }
        ).__objectUrl;
        if (layerUrl) URL.revokeObjectURL(layerUrl);
      }

      const objectUrl =
        (bgImg as HTMLImageElement & { __objectUrl?: string }).__objectUrl ??
        URL.createObjectURL(project.background);

      projectIdRef.current = project.id;
      exifRef.current = null;

      const nextDoc = cloneDoc(project.doc);
      historyRef.current = initHistory({
        doc: cloneDoc(nextDoc),
        paintData: paintStoreRef.current.capture(
          nextDoc.layers.filter((l) => l.kind === "paint").map((l) => l.id),
        ),
        backgroundDataUrl: bgCanvas.toDataURL("image/png"),
      });

      setImage({
        name: project.name,
        objectUrl,
        width: project.width,
        height: project.height,
        fileType: "image/png",
      });
      setDoc(nextDoc);
      setResizeW(project.width);
      setResizeH(project.height);
      setAspectBase(project.width / Math.max(1, project.height));
      setCropMode(false);
      setDraftCrop(null);
      setSelection(null);
      setDraftSelection(null);
      setCloneSource(null);
      cloneOffsetRef.current = null;
      setTool("select");
      setPanel("adjust");
      setBgVersion((v) => v + 1);
      setSaveState("saved");
      syncHistoryFlags();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open project.");
    }
  }

  const toolPanelProps = {
    panel,
    setPanel,
    disabled: !doc,
    doc,
    tool,
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
    setResizeW: onResizeWidth,
    setResizeH: onResizeHeight,
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
    moveLayer,
    cloneLayer,
    retouch,
    setRetouch,
    selection,
    clearSelection,
    healSelectionArea,
    clearSelectionPixels,
    cloneSourceSet: !!cloneSource,
    onOpenProject: (id: string) => void openProject(id),
    projectsRefreshKey,
  };

  return (
    <div className="relative flex min-h-full flex-1 flex-col">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(214,180,120,0.16),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(90,120,100,0.18),_transparent_45%)]" />

      <header className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <h1 className="font-[family-name:var(--font-display)] text-3xl leading-none tracking-tight text-[var(--ink)] sm:text-4xl">
            Lumen
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {!online
              ? "Offline"
              : swStatus.controlling
                ? "Offline-ready"
                : "Edit in the browser"}
            {swStatus.version ? ` · SW ${swStatus.version}` : ""}
            {saveState === "saving"
              ? " · Saving…"
              : saveState === "saved"
                ? " · Saved on device"
                : saveState === "error"
                  ? " · Save failed"
                  : ""}
            {tool !== "select" ? ` · Tool: ${tool}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.heic,.heif,image/heic,image/heif"
            className="hidden"
            onChange={onFileChange}
          />
          {swStatus.waiting ? (
            <button
              type="button"
              className="rounded-xl border border-[var(--line)] bg-[var(--panel)] px-3 py-2 text-sm"
              onClick={() => void activateWaitingWorker()}
            >
              Update app
            </button>
          ) : null}
          <InstallPrompt />
          <button
            type="button"
            data-lumen-id="undo"
            data-lumen-label="Undo"
            disabled={!canUndo}
            className="rounded-xl border border-[var(--line)] bg-[var(--panel)] px-3 py-2 text-sm disabled:opacity-40"
            onClick={() => void undo()}
          >
            Undo
          </button>
          <button
            type="button"
            data-lumen-id="redo"
            data-lumen-label="Redo"
            disabled={!canRedo}
            className="rounded-xl border border-[var(--line)] bg-[var(--panel)] px-3 py-2 text-sm disabled:opacity-40"
            onClick={() => void redo()}
          >
            Redo
          </button>
          <button
            type="button"
            data-lumen-id="save-project"
            data-lumen-label="Save project"
            disabled={!doc || saveState === "saving"}
            className="rounded-xl border border-[var(--line)] bg-[var(--panel)] px-3 py-2 text-sm disabled:opacity-40"
            onClick={() => void saveProjectNow(false)}
          >
            Save project
          </button>
          <button
            type="button"
            data-lumen-id="projects"
            data-lumen-label="Projects"
            className="rounded-xl border border-[var(--line)] bg-[var(--panel)] px-3 py-2 text-sm"
            onClick={() => setPanel("projects")}
          >
            Projects
          </button>
          <button
            type="button"
            data-lumen-id="open-image"
            data-lumen-label="Open image"
            className="rounded-xl bg-[var(--ink)] px-4 py-2 text-sm font-medium text-[var(--paper)]"
            onClick={() => fileInputRef.current?.click()}
          >
            Open image
          </button>
        </div>
      </header>

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 p-4 pb-[calc(7.5rem+env(safe-area-inset-bottom))] sm:p-6 lg:grid lg:grid-cols-[1fr_320px] lg:pb-6">
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
          {!image || !doc ? (
            <div className="flex flex-1 flex-col gap-6 overflow-auto p-4 sm:p-6">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[var(--line)] px-6 py-12 text-center"
              >
                <span className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
                  Drop an image here
                </span>
                <span className="max-w-sm text-sm text-[var(--muted)]">
                  Edit offline after the first visit. Projects auto-save to this
                  device.
                </span>
              </button>
              <RecentProjectsPanel
                onOpen={(id) => void openProject(id)}
                refreshKey={projectsRefreshKey}
              />
            </div>
          ) : (
            <div
              className={cn(
                "flex flex-1 items-center justify-center overflow-auto p-3 sm:p-6",
                cropMode && "pb-2 lg:pb-6",
              )}
            >
              <div
                ref={stageRef}
                data-lumen-id="canvas"
                data-lumen-label="Canvas"
                className="relative max-h-full max-w-full"
              >
                <canvas
                  ref={previewCanvasRef}
                  className={cn(
                    "max-w-full touch-none rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.25)]",
                    cropMode
                      ? "max-h-[min(48vh,560px)] sm:max-h-[min(60vh,720px)]"
                      : "max-h-[min(62vh,720px)] sm:max-h-[min(70vh,720px)]",
                    (tool === "brush" ||
                      tool === "heal" ||
                      tool === "clone" ||
                      tool === "marquee") &&
                      "cursor-crosshair",
                    tool === "redeye" && "cursor-cell",
                    (tool === "text" || tool === "select") && "cursor-move",
                  )}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                />
                {cropMode && draftCrop ? (
                  <CropOverlay
                    imageWidth={doc.width}
                    imageHeight={doc.height}
                    crop={draftCrop}
                    aspect={cropAspect}
                    onChange={setDraftCrop}
                  />
                ) : null}
                {!cropMode &&
                (selection || draftSelection || cloneSource) ? (
                  <SelectionOverlay
                    imageWidth={doc.width}
                    imageHeight={doc.height}
                    selection={selection}
                    draft={draftSelection}
                    cloneSource={cloneSource}
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
          {image && doc ? (
            <p className="border-t border-[var(--line)] px-4 py-2 text-xs text-[var(--muted)]">
              {image.name} · {doc.width}×{doc.height} · {doc.layers.length}{" "}
              layers · Ctrl/Cmd+Z undo
            </p>
          ) : null}
        </section>

        <aside className="hidden lg:block">
          <ToolPanel {...toolPanelProps} />
        </aside>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--line)] bg-[var(--panel)]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
        {cropMode ? (
          <MobileCropBar
            cropAspect={cropAspect}
            setCropAspect={setCropAspect}
            onApply={applyCrop}
            onCancel={cancelCrop}
            onRotate={() => {
              if (!doc) return;
              onAdjustments(
                {
                  rotate: (((doc.adjustments.rotate + 90) %
                    360) as typeof doc.adjustments.rotate),
                },
                true,
              );
            }}
          />
        ) : null}
        <div className="flex gap-1 overflow-x-auto px-2 pt-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
                if (id === "retouch") setTool("marquee");
              }}
              className={cn(
                "min-h-11 shrink-0 rounded-xl px-3 py-2 text-xs capitalize",
                panel === id
                  ? "bg-[var(--ink)] text-[var(--paper)]"
                  : "text-[var(--muted)]",
              )}
            >
              {id === "redeye" ? "Red-eye" : id}
            </button>
          ))}
        </div>
        <div
          className={cn(
            "overflow-y-auto px-3 pb-3",
            cropMode ? "max-h-[22vh]" : "max-h-[34vh]",
          )}
        >
          <ToolPanel {...toolPanelProps} compact />
        </div>
      </nav>

      <PageAgent />
    </div>
  );
}

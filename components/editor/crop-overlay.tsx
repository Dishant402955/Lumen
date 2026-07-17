"use client";

import { useRef } from "react";
import type { CropAspect, CropRect } from "@/lib/editor-types";
import type { CropHandle } from "@/lib/crop-math";
import { resizeCropFromHandle } from "@/lib/crop-math";

const HANDLES: Array<{ id: CropHandle; cursor: string; x: number; y: number }> = [
  { id: "nw", cursor: "nwse-resize", x: 0, y: 0 },
  { id: "n", cursor: "ns-resize", x: 0.5, y: 0 },
  { id: "ne", cursor: "nesw-resize", x: 1, y: 0 },
  { id: "e", cursor: "ew-resize", x: 1, y: 0.5 },
  { id: "se", cursor: "nwse-resize", x: 1, y: 1 },
  { id: "s", cursor: "ns-resize", x: 0.5, y: 1 },
  { id: "sw", cursor: "nesw-resize", x: 0, y: 1 },
  { id: "w", cursor: "ew-resize", x: 0, y: 0.5 },
];

export function CropOverlay({
  imageWidth,
  imageHeight,
  crop,
  aspect,
  onChange,
}: {
  imageWidth: number;
  imageHeight: number;
  crop: CropRect;
  aspect: CropAspect;
  onChange: (crop: CropRect) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    handle: CropHandle;
    origin: CropRect;
    startPointer: { x: number; y: number };
    grabOffset?: { x: number; y: number };
  } | null>(null);

  function clientToImage(clientX: number, clientY: number) {
    const el = wrapRef.current;
    if (!el) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * imageWidth,
      y: ((clientY - rect.top) / rect.height) * imageHeight,
    };
  }

  function begin(handle: CropHandle, clientX: number, clientY: number) {
    const pointer = clientToImage(clientX, clientY);
    dragRef.current = {
      handle,
      origin: { ...crop },
      startPointer: pointer,
      grabOffset:
        handle === "move"
          ? { x: pointer.x - crop.x, y: pointer.y - crop.y }
          : undefined,
    };
  }

  function move(clientX: number, clientY: number) {
    const drag = dragRef.current;
    if (!drag) return;
    const pointer = clientToImage(clientX, clientY);
    if (drag.handle === "move" && drag.grabOffset) {
      onChange(
        resizeCropFromHandle(
          drag.origin,
          "move",
          {
            x: pointer.x - drag.grabOffset.x,
            y: pointer.y - drag.grabOffset.y,
          },
          imageWidth,
          imageHeight,
          aspect,
        ),
      );
      return;
    }
    onChange(
      resizeCropFromHandle(
        drag.origin,
        drag.handle,
        pointer,
        imageWidth,
        imageHeight,
        aspect,
      ),
    );
  }

  return (
    <div ref={wrapRef} className="absolute inset-0">
      {/* dim outside */}
      <div className="pointer-events-none absolute inset-0 bg-black/35" />
      <div
        className="absolute cursor-move border-2 border-[var(--accent)] shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]"
        style={{
          left: `${(crop.x / imageWidth) * 100}%`,
          top: `${(crop.y / imageHeight) * 100}%`,
          width: `${(crop.w / imageWidth) * 100}%`,
          height: `${(crop.h / imageHeight) * 100}%`,
          background: "transparent",
        }}
        onPointerDown={(e) => {
          e.preventDefault();
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          begin("move", e.clientX, e.clientY);
        }}
        onPointerMove={(e) => move(e.clientX, e.clientY)}
        onPointerUp={() => {
          dragRef.current = null;
        }}
      >
        {HANDLES.map((handle) => (
          <button
            key={handle.id}
            type="button"
            aria-label={`Crop ${handle.id}`}
            className="absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-sm border border-[var(--ink)] bg-[var(--accent)]"
            style={{
              left: `${handle.x * 100}%`,
              top: `${handle.y * 100}%`,
              cursor: handle.cursor,
            }}
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
              begin(handle.id, e.clientX, e.clientY);
            }}
            onPointerMove={(e) => {
              e.stopPropagation();
              move(e.clientX, e.clientY);
            }}
            onPointerUp={(e) => {
              e.stopPropagation();
              dragRef.current = null;
            }}
          />
        ))}
      </div>
    </div>
  );
}

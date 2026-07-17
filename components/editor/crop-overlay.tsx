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
    <div
      ref={wrapRef}
      className="absolute inset-0 touch-none select-none"
      style={{ touchAction: "none" }}
    >
      <div className="pointer-events-none absolute inset-0 bg-black/40" />
      <div
        className="absolute cursor-move border-2 border-[var(--accent)] shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]"
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
        onPointerCancel={() => {
          dragRef.current = null;
        }}
      >
        {/* rule-of-thirds guides */}
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <div className="absolute left-1/3 top-0 h-full w-px bg-white/70" />
          <div className="absolute left-2/3 top-0 h-full w-px bg-white/70" />
          <div className="absolute left-0 top-1/3 h-px w-full bg-white/70" />
          <div className="absolute left-0 top-2/3 h-px w-full bg-white/70" />
        </div>

        {HANDLES.map((handle) => (
          <button
            key={handle.id}
            type="button"
            aria-label={`Crop ${handle.id}`}
            className="absolute z-10 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center touch-none sm:h-8 sm:w-8"
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
            onPointerCancel={(e) => {
              e.stopPropagation();
              dragRef.current = null;
            }}
          >
            <span className="h-4 w-4 rounded-sm border-2 border-[var(--ink)] bg-[var(--accent)] shadow sm:h-3.5 sm:w-3.5" />
          </button>
        ))}
      </div>
    </div>
  );
}

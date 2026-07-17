/**
 * Wrap a JPEG bitstream in a minimal HEIF/HEIC container (JPEG codec, brand mif1/heic).
 * EXIF stays inside the embedded JPEG.
 */
export function wrapJpegAsHeic(
  jpeg: Uint8Array,
  width: number,
  height: number,
): Uint8Array {
  const ftyp = box(
    "ftyp",
    concat(
      fourcc("mif1"),
      u32(0),
      fourcc("mif1"),
      fourcc("heic"),
      fourcc("jpeg"),
      fourcc("iso8"),
    ),
  );

  const hdlr = fullBox(
    "hdlr",
    0,
    0,
    concat(u32(0), fourcc("pict"), u32(0), u32(0), u32(0), str0("LumenHEIF")),
  );
  const pitm = fullBox("pitm", 0, 0, u16(1));
  const ispe = fullBox("ispe", 0, 0, concat(u32(width), u32(height)));
  const ipco = box("ipco", ispe);
  const ipma = fullBox(
    "ipma",
    0,
    0,
    concat(u32(1), u16(1), u8(1), u8(0x81)),
  );
  const iprp = box("iprp", concat(ipco, ipma));
  const infe = fullBox(
    "infe",
    2,
    0,
    concat(u16(1), u16(0), fourcc("jpeg"), str0("image.jpg")),
  );
  const iinf = fullBox("iinf", 0, 0, concat(u16(1), infe));

  const iloc = fullBox(
    "iloc",
    0,
    0,
    concat(
      u8(0x44),
      u8(0x00),
      u16(1),
      u16(1),
      u16(0),
      u16(1),
      u32(0),
      u32(jpeg.length),
    ),
  );

  const meta = fullBox(
    "meta",
    0,
    0,
    concat(hdlr, pitm, iloc, iinf, iprp),
  );

  const beforeMdat = concat(ftyp, meta);
  const extentOffset = beforeMdat.length + 8;
  const patchedMeta = patchIlocOffset(meta, extentOffset);
  return concat(ftyp, patchedMeta, box("mdat", jpeg));
}

function patchIlocOffset(metaBox: Uint8Array, offset: number): Uint8Array {
  const out = new Uint8Array(metaBox);
  for (let i = 4; i < out.length - 8; i++) {
    if (
      out[i] === 0x69 &&
      out[i + 1] === 0x6c &&
      out[i + 2] === 0x6f &&
      out[i + 3] === 0x63
    ) {
      const size =
        (out[i - 4] << 24) |
        (out[i - 3] << 16) |
        (out[i - 2] << 8) |
        out[i - 1];
      const end = i - 4 + size;
      const offPos = end - 8;
      out[offPos] = (offset >>> 24) & 0xff;
      out[offPos + 1] = (offset >>> 16) & 0xff;
      out[offPos + 2] = (offset >>> 8) & 0xff;
      out[offPos + 3] = offset & 0xff;
      return out;
    }
  }
  return out;
}

function box(type: string, payload: Uint8Array): Uint8Array {
  return concat(u32(8 + payload.length), fourcc(type), payload);
}

function fullBox(
  type: string,
  version: number,
  flags: number,
  payload: Uint8Array,
): Uint8Array {
  const vf = new Uint8Array(4);
  vf[0] = version & 0xff;
  vf[1] = (flags >> 16) & 0xff;
  vf[2] = (flags >> 8) & 0xff;
  vf[3] = flags & 0xff;
  return box(type, concat(vf, payload));
}

function fourcc(s: string): Uint8Array {
  return new Uint8Array([
    s.charCodeAt(0),
    s.charCodeAt(1),
    s.charCodeAt(2),
    s.charCodeAt(3),
  ]);
}

function u8(n: number) {
  return new Uint8Array([n & 0xff]);
}
function u16(n: number) {
  return new Uint8Array([(n >> 8) & 0xff, n & 0xff]);
}
function u32(n: number) {
  const v = n >>> 0;
  return new Uint8Array([
    (v >>> 24) & 0xff,
    (v >>> 16) & 0xff,
    (v >>> 8) & 0xff,
    v & 0xff,
  ]);
}
function str0(s: string) {
  const out = new Uint8Array(s.length + 1);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}
function concat(...parts: Uint8Array[]): Uint8Array {
  const len = parts.reduce((a, p) => a + p.length, 0);
  const out = new Uint8Array(len);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

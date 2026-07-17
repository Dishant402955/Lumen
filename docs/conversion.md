# Format conversion

Lumen converts images entirely in the browser.

## Single-file export (editor)

In **Export**, choose PNG, JPEG, WebP, AVIF, or HEIC, set quality when relevant, optionally **Keep EXIF**, then Download. The current edited canvas is encoded.

## Batch convert

Open the **Convert** panel:

1. Add one or many images (JPEG/PNG/WebP/AVIF/GIF/HEIC/HEIF, …)
2. Pick an output format and quality
3. Toggle Keep EXIF
4. **Convert all** — progress per file
5. Download each file, or **Download ZIP** for everything that succeeded

## Formats

| Format | Encode | Decode | EXIF |
|--------|--------|--------|------|
| PNG | Canvas | Native | Best-effort `eXIf` chunk |
| JPEG | Canvas | Native | Full (piexifjs) |
| WebP | Canvas | Native | Best-effort RIFF `EXIF` chunk |
| AVIF | Canvas `toBlob('image/avif')` (Chrome/Edge) | Native / browser | Not injected (pixels only) |
| HEIC | JPEG bitstream wrapped in HEIF (`mif1`/`heic` brands) | `heic2any` on open/batch | Kept inside embedded JPEG |

### HEIC notes

- **Input**: HEIC/HEIF files are decoded for editing and batch conversion.
- **AVIF encode** needs a browser that supports `canvas.toBlob('image/avif')` (Chrome and Edge do; Firefox/Safari may not yet).

## Privacy

Conversion never uploads your images. Batch results and ZIPs are generated locally.

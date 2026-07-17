declare module "elheif" {
  export type DecodeImageResult = {
    err: string;
    data: Array<{
      width: number;
      height: number;
      /** RGBA8888 bitmap */
      data: Uint8Array;
    }>;
  };

  export type EncodeImageResult = {
    err: string;
    data: Uint8Array;
  };

  export function ensureInitialized(): Promise<void>;
  export function jsDecodeImage(buf: Uint8Array): DecodeImageResult;
  export function jsEncodeImage(
    buf: Uint8Array,
    width: number,
    height: number,
  ): EncodeImageResult;
}

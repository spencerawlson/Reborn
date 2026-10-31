/**
 * Vector barcodes for shipping labels (server-only): Code 128 and QR as SVG
 * strings, via bwip-js. SVG keeps labels crisp on thermal printers and
 * respects the vector-only rule.
 */
import bwipjs from "bwip-js/node";

/** Only these characters ever go into a barcode (tracking codes like SIA-T00000001). */
const SAFE = /^[A-Z0-9-]{1,40}$/;

export function code128Svg(text: string): string {
  if (!SAFE.test(text)) throw new Error("unsupported barcode text");
  return bwipjs.toSVG({ bcid: "code128", text, height: 14, includetext: false, paddingwidth: 0, paddingheight: 0 });
}

export function qrSvg(text: string): string {
  if (!SAFE.test(text)) throw new Error("unsupported barcode text");
  return bwipjs.toSVG({ bcid: "qrcode", text });
}

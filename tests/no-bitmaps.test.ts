/**
 * Founder rule: the website uses vector graphics only. No emoji (drawn as
 * bitmaps on many phones), no raster image files or references in src/
 * or public/. Icons go through src/components/Icon.tsx (inline SVG).
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(__dirname, "..");
const RASTER = /\.(png|jpe?g|gif|webp|bmp|avif|ico)$/i;
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
const RASTER_REF = /\.(png|jpe?g|gif|webp|bmp|avif)\b|next\/image/i;

function files(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

describe("vector-only website", () => {
  const all = [...files(join(ROOT, "src")), ...files(join(ROOT, "public"))];

  it("has no raster image files", () => {
    expect(all.filter((f) => RASTER.test(f)).map((f) => relative(ROOT, f))).toEqual([]);
  });

  it("uses no emoji or raster image references in source", () => {
    const offenders = all
      .filter((f) => /\.(tsx?|css|mdx?)$/.test(f))
      .filter((f) => {
        const text = readFileSync(f, "utf8");
        return EMOJI.test(text) || RASTER_REF.test(text);
      })
      .map((f) => relative(ROOT, f));
    expect(offenders).toEqual([]);
  });
});

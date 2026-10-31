/**
 * Founder rule: the website uses vector graphics only. No emoji (drawn as
 * bitmaps on many phones), no raster image files or references in src/
 * or public/. Icons go through src/components/Icon.tsx (inline SVG).
 *
 * No exceptions: the logo parcel is an inline SVG too.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(__dirname, "..");
const RASTER = /\.(png|jpe?g|gif|webp|bmp|avif|ico)$/i;
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
const RASTER_REF = /\.(png|jpe?g|gif|webp|bmp|avif)\b|next\/image/gi;

function files(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

const rel = (f: string) => relative(ROOT, f).split(sep).join("/");

describe("vector-only website", () => {
  const all = [...files(join(ROOT, "src")), ...files(join(ROOT, "public"))];

  it("has no raster image files", () => {
    expect(all.filter((f) => RASTER.test(f)).map(rel)).toEqual([]);
  });

  it("uses no emoji anywhere in source", () => {
    const offenders = all.filter((f) => /\.(tsx?|css|mdx?)$/.test(f) && EMOJI.test(readFileSync(f, "utf8")));
    expect(offenders.map(rel)).toEqual([]);
  });

  it("references no bitmaps", () => {
    const offenders = all
      .filter((f) => /\.(tsx?|css|mdx?)$/.test(f))
      .flatMap((f) => {
        const text = readFileSync(f, "utf8");
        return [...text.matchAll(RASTER_REF)].map((m) => `${rel(f)}: ${m[0]}`);
      });
    expect(offenders).toEqual([]);
  });
});

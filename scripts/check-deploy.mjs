#!/usr/bin/env node
// Is what the Worker serves the same as what this commit has? (docs/adr/0010)
//
// ⚠ "The deploy succeeded" is not "it is being served". Fetch what is served and compare it with
//   the files here. ⚠ The verdict lives in judgeFile / judgeEvaluate only, so a test can call them
//   and see each case (hidetzu/konjaku does the same).
//
// Usage: node scripts/check-deploy.mjs --origin=https://… --cb=<commit>
// Exit: 0 when every check passed, 1 otherwise.

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

/** Files Cloudflare serves from public/, and the path each is served at. */
export const SERVED = [
  ["index.html", "/"],
  ["view.js", "/view.js"],
  ["icon.svg", "/icon.svg"],
  ["icon-512.png", "/icon-512.png"],
  ["apple-touch-icon.png", "/apple-touch-icon.png"],
  ["favicon.ico", "/favicon.ico"],
  ["og.png", "/og.png"],
];
/** An issue that exists, is public, and is closed for good: its verdict does not drift. */
export const KNOWN_ISSUE = "https://github.com/hidetzu/decide-first/issues/1";

/**
 * One served file against the local one, byte for byte (images are served too).
 * ⚠ `served === null` means it could not be fetched. ⚠ That is not "it is not served"
 *   (rules/evidence.md: could not be obtained ≠ not there).
 * @param {Uint8Array} local
 * @param {Uint8Array | null} served
 * @returns {{ ok: boolean, why: string }}
 */
export function judgeFile(local, served) {
  if (served === null) return { ok: false, why: "取れなかった（配られていない、とは言えない）" };
  return Buffer.from(local).equals(Buffer.from(served)) ? { ok: true, why: "1 バイトも違わない" } : { ok: false, why: "中身が違う" };
}

/**
 * What /api/evaluate answered for KNOWN_ISSUE.
 * @param {number | null} status null when nothing came back
 * @param {string | null} body
 * @returns {{ ok: boolean, why: string }}
 */
export function judgeEvaluate(status, body) {
  if (status === null || body === null) return { ok: false, why: "取れなかった（動いていない、とは言えない）" };
  let json;
  try {
    json = JSON.parse(body);
  } catch {
    return { ok: false, why: `JSON でない応答（HTTP ${status}）` };
  }
  if (status === 200 && json?.ok === true && typeof json.evaluation?.verdict === "string") {
    return { ok: true, why: `判定 ${json.evaluation.verdict}` };
  }
  return { ok: false, why: `判定が返らなかった（HTTP ${status}: ${String(json?.message ?? "").slice(0, 80)}）` };
}

/** @param {string} url @returns {Promise<{ status: number | null, body: Uint8Array | null }>} */
async function get(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    return { status: res.status, body: new Uint8Array(await res.arrayBuffer()) };
  } catch {
    return { status: null, body: null };
  }
}

async function main() {
  const arg = (/** @type {string} */ name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
  const origin = arg("origin");
  const cb = arg("cb") ?? String(Date.now());
  if (!origin) {
    console.error("--origin=https://… が要ります（repository variable SITE_ORIGIN が未設定かもしれません）");
    process.exit(1);
  }
  let failed = 0;
  for (const [file, path] of SERVED) {
    const local = await readFile(fileURLToPath(new URL(`../public/${file}`, import.meta.url)));
    // ⚠ ?cb=<commit>, so an edge copy from before this deploy is not read as the current one.
    const r = await get(`${origin}${path}?cb=${cb}`);
    const v = judgeFile(local, r.status === 200 ? r.body : null);
    if (!v.ok) failed++;
    console.log(`${v.ok ? "ok  " : "FAIL"} ${path} — ${v.why}${r.status !== null && r.status !== 200 ? `（HTTP ${r.status}）` : ""}`);
  }
  const e = await get(`${origin}/api/evaluate?url=${encodeURIComponent(KNOWN_ISSUE)}`);
  const v = judgeEvaluate(e.status, e.body === null ? null : new TextDecoder().decode(e.body));
  if (!v.ok) failed++;
  console.log(`${v.ok ? "ok  " : "FAIL"} /api/evaluate — ${v.why}`);
  console.log(`check-deploy: ${SERVED.length + 1 - failed} of ${SERVED.length + 1} passed`);
  process.exit(failed ? 1 : 0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();

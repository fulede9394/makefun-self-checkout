// The Self-Checkout Is Judging You — make.fun entry
//
// One smug remark from the till, written to /output/entry.txt (or
// $MAKEFUN_OUTPUT_DIR/entry.txt). The machine caught the shopper
// weighing grapes as bananas — and it is not letting it go.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join, resolve } from "node:path";

// The remark, kept as three beats so the sting lands last.
const REMARK_SEGMENTS = [
  "I watched you weigh the grapes as bananas.",
  "Twice.",
  "The scale and I both know what you did.",
] as const;

// Gate from the competition rules: 1-200 UTF-8 chars, not whitespace only.
const TILL_VOICE = Object.freeze({
  minChars: 1,
  maxChars: 200,
  outFile: "entry.txt",
  fallbackDir: "/output",
});

// Stitch the beats into the single line the till delivers.
function speakRemark(): string {
  return REMARK_SEGMENTS.join(" ");
}

// Judge the remark the way the gate does: length, single line, real text.
function scrutinizeRemark(text: string): void {
  if (text.length < TILL_VOICE.minChars || text.length > TILL_VOICE.maxChars) {
    throw new Error(`remark must be ${TILL_VOICE.minChars}-${TILL_VOICE.maxChars} chars, got ${text.length}`);
  }
  if (text.trim().length === 0) {
    throw new Error("remark must not be only whitespace");
  }
  if (text.includes("\n")) {
    throw new Error("remark must be a single line");
  }
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u0008\u000b-\u001f]/.test(text)) {
    throw new Error("remark must not contain control characters");
  }
  if (!text.includes("grapes") || !text.includes("bananas")) {
    throw new Error("remark lost the weighing scam");
  }
}

// Where the entry lands: $MAKEFUN_OUTPUT_DIR, else /output.
function locateOutput(): { dir: string; file: string } {
  const dir = process.env.MAKEFUN_OUTPUT_DIR ?? TILL_VOICE.fallbackDir;
  return { dir, file: join(dir, TILL_VOICE.outFile) };
}

// Write the remark, then read it back and compare byte for byte.
async function handOver(): Promise<void> {
  const remark = speakRemark();
  scrutinizeRemark(remark);
  const { dir, file } = locateOutput();
  await mkdir(dir, { recursive: true });
  await writeFile(file, remark, "utf8");
  const roundTrip = await readFile(file, "utf8");
  if (roundTrip !== remark) {
    throw new Error("round-trip check failed: file differs from remark");
  }
  const fingerprint = createHash("sha256").update(remark, "utf8").digest("hex");
  console.log(`wrote ${remark.length} chars to ${resolve(file)} (sha256 ${fingerprint})`);
  console.log(remark);
}

await handOver();

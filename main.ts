import { mkdirSync, writeFileSync, readFileSync, chmodSync } from "node:fs";
import { join, resolve } from "node:path";

const ROAST = "My agent cites itself from ten minutes ago and calls it a second opinion.";

const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

const UNITS: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
};

const TENS: Record<string, number> = {
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
};

interface RoastFacts {
  target: string;
  minutes: number;
  characters: number;
  bytes: number;
}

function fail(message: string): never {
  process.stderr.write(`error: ${message}\n`);
  process.exit(1);
}

function charCount(text: string): number {
  return [...text].length;
}

function wordToNumber(word: string): number | null {
  const clean = word.toLowerCase().replace(/[^a-z-]/g, "");
  if (clean.length === 0) return null;
  if (/^\d+$/.test(clean)) return Number(clean);
  const parts = clean.split("-");
  let total = 0;
  for (const part of parts) {
    if (part in TENS) {
      total += TENS[part];
    } else if (part in UNITS) {
      total += UNITS[part];
    } else {
      return null;
    }
  }
  return total;
}

function roastFacts(text: string): RoastFacts {
  const targetMatch = text.match(/\bmy\s+([a-z][a-z'-]*)/i);
  const target = targetMatch ? targetMatch[1].toLowerCase() : "";

  const minutesMatch = text.match(/\b([a-z\d]+(?:-[a-z]+)?)\s+minutes?\b/i);
  const minutes = minutesMatch ? wordToNumber(minutesMatch[1]) : null;

  return {
    target,
    minutes: minutes === null ? Number.NaN : minutes,
    characters: charCount(text),
    bytes: Buffer.byteLength(text, "utf8"),
  };
}

function validate(text: string, facts: RoastFacts): void {
  if (text.trim().length === 0) {
    fail("text is empty after trim");
  }
  if (/[\r\n]/.test(text)) {
    fail("text contains a newline character");
  }
  if (!text.includes("agent")) {
    fail('text does not contain "agent"');
  }
  if (facts.target.length === 0) {
    fail('could not extract the target noun (expected "my <noun>")');
  }
  if (!Number.isFinite(facts.minutes) || facts.minutes <= 0) {
    fail(`could not extract a positive minutes value, got ${facts.minutes}`);
  }
  if (!text.endsWith(".")) {
    fail("text does not end with a period");
  }
  if (facts.characters < 1 || facts.characters > 200) {
    fail(`character count ${facts.characters} is outside 1..200`);
  }
  if (facts.bytes < 1 || facts.bytes > 200) {
    fail(`byte count ${facts.bytes} is outside 1..200`);
  }
}

const facts = roastFacts(ROAST);
validate(ROAST, facts);

const filePath = resolve(join(outputDir, "entry.txt"));
const contents = ROAST + "\n";
const expected = Buffer.from(contents, "utf8");

mkdirSync(outputDir, { recursive: true });
chmodSync(outputDir, 0o755);
writeFileSync(filePath, expected);
chmodSync(filePath, 0o644);

const actual = readFileSync(filePath);
if (!actual.equals(expected)) {
  fail(`read-back of ${filePath} does not match the bytes written`);
}

process.stdout.write(`path: ${filePath}\n`);
process.stdout.write(`text: ${ROAST}\n`);
process.stdout.write(`target: ${facts.target}\n`);
process.stdout.write(`minutes: ${facts.minutes}\n`);
process.stdout.write(`characters: ${facts.characters}\n`);
process.stdout.write(`bytes: ${facts.bytes}\n`);

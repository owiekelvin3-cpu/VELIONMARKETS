const fs = require("fs");
const path = require("path");

const ROOT = path.join("src", "i18n", "locales");
const LANGS = [
  { code: "es", tl: "es" },
  { code: "fr", tl: "fr" },
  { code: "de", tl: "de" },
  { code: "ar", tl: "ar" },
  { code: "zh", tl: "zh-CN" },
];

const CONCURRENCY = 8;

function isPlainObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function protectTokens(text) {
  const tokens = [];
  const protectedText = String(text).replace(/\{\{[^}]+\}\}/g, (m) => {
    const i = tokens.length;
    tokens.push(m);
    return `__T${i}__`;
  });
  return { protectedText, tokens };
}

function restoreTokens(text, tokens) {
  return String(text).replace(/__T(\d+)__/g, (_, n) => tokens[Number(n)] ?? "");
}

async function translateText(text, tl) {
  if (!text || !String(text).trim()) return text;
  if (!/[A-Za-z\u00C0-\u024F]/.test(text)) return text;

  const { protectedText, tokens } = protectTokens(text);
  const url =
    "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=" +
    encodeURIComponent(tl) +
    "&dt=t&q=" +
    encodeURIComponent(protectedText);

  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      const translated = (data[0] || []).map((chunk) => chunk[0]).join("");
      return restoreTokens(translated, tokens);
    } catch {
      await sleep(250 * (attempt + 1));
    }
  }
  return text;
}

async function mapPool(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;

  async function run() {
    while (next < items.length) {
      const i = next++;
      results[i] = await worker(items[i], i);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => run()));
  return results;
}

function collectJobs(enNode, existingNode, pathParts, jobs) {
  if (typeof enNode === "string") {
    if (typeof existingNode === "string" && existingNode.trim()) {
      jobs.push({ path: pathParts, en: enNode, existing: existingNode, needsTranslate: false });
    } else {
      jobs.push({ path: pathParts, en: enNode, existing: null, needsTranslate: true });
    }
    return;
  }

  if (Array.isArray(enNode)) {
    for (let i = 0; i < enNode.length; i++) {
      collectJobs(enNode[i], Array.isArray(existingNode) ? existingNode[i] : undefined, [...pathParts, i], jobs);
    }
    return;
  }

  if (isPlainObject(enNode)) {
    for (const key of Object.keys(enNode)) {
      collectJobs(
        enNode[key],
        isPlainObject(existingNode) ? existingNode[key] : undefined,
        [...pathParts, key],
        jobs
      );
    }
  }
}

function setPath(root, parts, value) {
  let cur = root;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    const next = parts[i + 1];
    if (cur[p] === undefined) cur[p] = typeof next === "number" ? [] : {};
    cur = cur[p];
  }
  cur[parts[parts.length - 1]] = value;
}

function cloneShape(enNode) {
  if (typeof enNode === "string") return "";
  if (Array.isArray(enNode)) return enNode.map(cloneShape);
  if (isPlainObject(enNode)) {
    const out = {};
    for (const key of Object.keys(enNode)) out[key] = cloneShape(enNode[key]);
    return out;
  }
  return enNode;
}

async function translateLocale(code, tl, en) {
  const file = path.join(ROOT, `${code}.json`);
  let existing = {};
  try {
    existing = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    /* empty */
  }

  const jobs = [];
  collectJobs(en, existing, [], jobs);
  const todo = jobs.filter((j) => j.needsTranslate);
  console.log(`\n${code}: ${jobs.length} strings, translating ${todo.length}…`);

  let done = 0;
  await mapPool(todo, CONCURRENCY, async (job) => {
    job.result = await translateText(job.en, tl);
    done++;
    if (done % 50 === 0 || done === todo.length) {
      process.stdout.write(`  ${code}: ${done}/${todo.length}\n`);
    }
  });

  const out = cloneShape(en);
  for (const job of jobs) {
    setPath(out, job.path, job.needsTranslate ? job.result : job.existing);
  }

  fs.writeFileSync(file, JSON.stringify(out, null, 2) + "\n", "utf8");
  console.log(`Done ${code}`);
}

async function main() {
  const only = process.argv.slice(2);
  const en = JSON.parse(fs.readFileSync(path.join(ROOT, "en.json"), "utf8"));
  const targets = only.length ? LANGS.filter((l) => only.includes(l.code)) : LANGS;

  for (const { code, tl } of targets) {
    await translateLocale(code, tl, en);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

#!/usr/bin/env node
// locales/content/source.txt → service-areas.en.js / service-areas.ko.js
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const SOURCE_PATH = path.join(ROOT, "locales/content/source.txt");
const sourceText = fs.readFileSync(SOURCE_PATH, "utf8");

const AREA_MARKERS = [
  { key: "depression", start: /\*\*Depression\*\*/i, end: /\*\*Trauma\s*&\s*PTSD\*\*/i },
  { key: "traumaPtsd", start: /\*\*Trauma\s*&\s*PTSD\*\*/i, end: /\*\*Anxiety Panic Attacks\*\*/i },
  { key: "anxietyPanic", start: /\*\*Anxiety Panic Attacks\*\*/i, end: /\*\*Suicidal Thoughts\*\*/i },
  {
    key: "suicidalThoughts",
    start: /\*\*Suicidal Thoughts\*\*/i,
    end: /\*\*Cultural Identity\*\*/i,
  },
  {
    key: "culturalIdentity",
    start: /\*\*Cultural Identity\*\*/i,
    end: /\*\*Bipolar Disorder\*\*/i,
  },
  { key: "bipolar", start: /\*\*Bipolar Disorder\*\*/i, end: /\*\*ADHD\b/i },
  { key: "adhd", start: /\*\*ADHD\b/i, end: /\*\*Relationship Counseling\*\*/i },
  {
    key: "relationship",
    start: /\*\*Relationship Counseling\*\*/i,
    end: /\*\*Obsessive-Compulsive Disorder \(OCD\)\*\*/i,
  },
  {
    key: "ocd",
    start: /\*\*Obsessive-Compulsive Disorder \(OCD\)\*\*/i,
    end: /\*\*Eating Disorders\*\*/i,
  },
  {
    key: "eatingDisorders",
    start: /\*\*Eating Disorders\*\*/i,
    end: /\*\*Autism Spectrum Disorder \(ASD\)\*\*/i,
  },
  {
    key: "asd",
    start: /\*\*Autism Spectrum Disorder \(ASD\)\*\*/i,
    end: /\*\*Life Stress\*\*/i,
  },
  { key: "lifeStress", start: /\*\*Life Stress\*\*/i, end: /\*\*Grief\s*&\s*Loss\*\*/i },
  { key: "griefLoss", start: /\*\*Grief\s*&\s*Loss\*\*/i, end: /\*\*Sleep Disturbances\*\*/i },
  {
    key: "sleep",
    start: /\*\*Sleep Disturbances\*\*/i,
    end: /\*\*Footer\*\*/i,
  },
];

const CLOSING_START_RE =
  /^(Your First Step|You Are Still Here|Rediscovering Possibility|A First Step Toward)/i;

const SKIP_LINES = new Set(["Schedule a Consultation"]);

function unwrapBold(line) {
  const t = line.trim();
  if (t.startsWith("**") && t.endsWith("**")) {
    return t.slice(2, -2).trim();
  }
  return t;
}

function isBoldLine(line) {
  const t = line.trim();
  return t.startsWith("**") && t.endsWith("**");
}

function extractSectionSlice(meta) {
  const startMatch = sourceText.search(meta.start);
  if (startMatch === -1) {
    throw new Error(`Section not found in source.txt: ${meta.key}`);
  }
  let endIdx = sourceText.length;
  if (meta.end) {
    const after = sourceText.slice(startMatch + 1);
    const relEnd = after.search(meta.end);
    if (relEnd !== -1) endIdx = startMatch + 1 + relEnd;
  }
  return sourceText.slice(startMatch, endIdx);
}

function sliceToParagraphs(slice) {
  const lines = slice.split("\n").map((l) => l.trim());
  let i = 0;
  while (i < lines.length && !lines[i]) i++;
  if (i >= lines.length) return { title: "", tagline: "", paras: [] };

  const title = unwrapBold(lines[i]);
  i++;
  while (i < lines.length && !lines[i]) i++;
  const tagline = lines[i] ?? "";
  i++;

  const paras = [];
  for (; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    if (SKIP_LINES.has(line)) continue;
    if (line === "---") continue;
    paras.push(line);
  }
  return { title, tagline, paras };
}

function isCallout(p) {
  const t = p.trim();
  if (isBoldLine(t)) return false;
  return t.startsWith("*");
}

function toItalic(p) {
  const inner = p.trim().replace(/^\*+|\*+$/g, "").trim();
  return `*${inner}*`;
}

function isBulletLine(p) {
  return p.trim().startsWith("- ");
}

function bulletText(p) {
  return p.trim().replace(/^-+\s+/, "");
}

function isCategoryListLine(p) {
  return false;
}

function isTherapyNameOnly() {
  return false;
}

function isMajorHeading(p) {
  const t = p.trim();
  if (isCallout(t)) return false;
  if (!isBoldLine(t)) return false;
  const inner = unwrapBold(t);
  if (inner.length > 160) return false;
  if (CLOSING_START_RE.test(inner)) return false;
  if (/^Psychotherapy & Counseling$/i.test(inner)) return false;
  if (/^Lifestyle Support/i.test(inner) && inner.length < 70) return false;
  if (/^Lifestyle &/i.test(inner) && inner.length < 70) return false;
  if (/^Communication &/i.test(inner) && inner.length < 90) return false;
  if (/^Self-Care &/i.test(inner) && inner.length < 90) return false;
  if (/^Nutritional Guidance/i.test(inner)) return false;
  if (/^Social Support/i.test(inner)) return false;
  if (/^Medication\b/i.test(inner) && inner.length < 60) return false;
  if (
    /following|feel familiar|sound familiar|may be time to|may be time for|may help:/i.test(
      inner,
    )
  ) {
    return false;
  }
  if (/^If (you|any|you've|someone|these)/i.test(inner) && inner.length < 200) {
    return false;
  }
  if (/^Trauma can show up/i.test(inner)) return false;
  if (/^If You'?re a Parent/i.test(inner)) return true;
  if (inner.includes(":")) return true;
  if (
    /^(Listening|When |Understanding |Recognizing |Rediscovering|Reclaiming|Creating |Finding |Helping |Supporting |Healing |Gentle |Freeing |Embracing |Restoring |Anorexia|Bulimia|Binge)/i.test(
      inner,
    )
  ) {
    return true;
  }
  return false;
}

function isListLead(p) {
  const t = p.trim();
  if (isBoldLine(t)) {
    const inner = unwrapBold(t);
    if (/^Psychotherapy|^Lifestyle|^Medication|^Nutritional|^Social Support|^Communication|^Self-Care/i.test(inner)) {
      return true;
    }
  }
  if (isMajorHeading(t) || CLOSING_START_RE.test(t) || isCallout(t) || isBulletLine(t)) {
    return false;
  }
  if (/following|familiar|may help|may be time|sound familiar|resonate/i.test(t)) {
    return true;
  }
  return false;
}

function listLeadText(p) {
  if (isBoldLine(p)) return unwrapBold(p);
  return p.replace(/^•\s*/, "").trim();
}

function collectBulletItems(paras, startIdx) {
  const items = [];
  let i = startIdx;
  while (i < paras.length) {
    const p = paras[i];
    if (CLOSING_START_RE.test(p) || isMajorHeading(p) || isCallout(p) || isListLead(p)) {
      break;
    }
    if (!isBulletLine(p)) break;
    items.push(bulletText(p));
    i++;
  }
  return { items, nextIndex: i };
}

function parseSection(title, tagline, paras) {
  const section = {
    title,
    tagline,
    groups: [],
    lists: [],
    subsections: [],
    closing: [],
  };

  let i = 0;
  let groupBuf = [];
  let currentSub = null;
  let inClosing = false;

  const targetLists = () => (currentSub ? currentSub.lists : section.lists);

  const flushGroup = () => {
    if (!groupBuf.length) return;
    if (inClosing) {
      for (const p of groupBuf) section.closing.push(p);
    } else if (currentSub) {
      currentSub.groups.push([...groupBuf]);
    } else {
      section.groups.push([...groupBuf]);
    }
    groupBuf = [];
  };

  const flushSub = () => {
    if (!currentSub) return;
    flushGroup();
    if (!currentSub.closing?.length) delete currentSub.closing;
    if (!currentSub.groups.length) delete currentSub.groups;
    if (currentSub.groups?.length || currentSub.lists.length || currentSub.closing?.length) {
      section.subsections.push(currentSub);
    }
    currentSub = null;
  };

  while (i < paras.length) {
    const p = paras[i];
    const plain = isBoldLine(p) ? unwrapBold(p) : p;

    if (CLOSING_START_RE.test(plain)) {
      flushGroup();
      flushSub();
      inClosing = true;
      section.closing.push(`**${plain.trim()}**`);
      i++;
      continue;
    }

    if (inClosing) {
      section.closing.push(p);
      i++;
      continue;
    }

    if (isCallout(p)) {
      flushGroup();
      const italic = toItalic(p);
      if (currentSub) {
        if (!currentSub.closing) currentSub.closing = [];
        currentSub.closing.push(italic);
      } else {
        groupBuf.push(italic);
      }
      i++;
      continue;
    }

    if (isMajorHeading(p)) {
      flushGroup();
      flushSub();
      currentSub = { heading: unwrapBold(p), groups: [], lists: [] };
      i++;
      continue;
    }

    if (isListLead(p)) {
      flushGroup();
      const lead = listLeadText(p);
      i++;
      const { items, nextIndex } = collectBulletItems(paras, i);
      i = nextIndex;
      if (items.length) {
        targetLists().push({ lead, items });
      } else {
        groupBuf.push(lead);
      }
      continue;
    }

    if (isBulletLine(p)) {
      flushGroup();
      const { items, nextIndex } = collectBulletItems(paras, i);
      i = nextIndex;
      if (items.length) {
        targetLists().push({ items });
      }
      continue;
    }

    if (p.length < 95 && i + 1 < paras.length && isBulletLine(paras[i + 1]) && !isMajorHeading(p)) {
      flushGroup();
      const lead = p;
      i++;
      const { items, nextIndex } = collectBulletItems(paras, i);
      i = nextIndex;
      targetLists().push({ lead, items });
      continue;
    }

    groupBuf.push(p);
    i++;
  }

  flushGroup();
  flushSub();

  if (!section.subsections.length) delete section.subsections;
  if (!section.lists.length) delete section.lists;
  if (!section.closing.length) delete section.closing;

  return section;
}

const result = {};
for (const meta of AREA_MARKERS) {
  const slice = extractSectionSlice(meta);
  const { title, tagline, paras } = sliceToParagraphs(slice);
  result[meta.key] = parseSection(title, tagline, paras);
  console.error(meta.key, "paras:", paras.length);
}

function writeLocaleFile(filename, exportName, comment) {
  const outPath = path.join(ROOT, "locales/content", filename);
  fs.writeFileSync(
    outPath,
    `${comment}\nexport const ${exportName} = ${JSON.stringify(result, null, 2)};\n`,
    "utf8",
  );
  console.error("Wrote", outPath);
}

writeLocaleFile(
  "service-areas.en.js",
  "serviceAreasSectionsEn",
  "// 서비스 분야 영문 본문 (source.txt — groups/lists/subsections)",
);
writeLocaleFile(
  "service-areas.ko.js",
  "serviceAreasSectionsKo",
  "// 서비스 분야 한국어 본문 (source.txt — groups/lists/subsections, 영문 원문)",
);

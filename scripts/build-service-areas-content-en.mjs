#!/usr/bin/env node
// scraped-en.json → locales/content/service-areas.en.js
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const scraped = JSON.parse(
  fs.readFileSync(path.join(__dirname, "output/scraped-en.json"), "utf8"),
);

const AREA_MARKERS = [
  {
    key: "depression",
    start: /^Depression\b/i,
    end: /Trauma\s*&\s*PTSD/i,
    title: "Depression",
    tagline: "You Are Not Alone",
  },
  {
    key: "traumaPtsd",
    start: /Trauma\s*&\s*PTSD/i,
    end: /Anxiety.*Panic/i,
    title: "Trauma & PTSD",
    tagline: "You Are Not Defined by What Happened to You — You Deserve to Feel Safe Again",
  },
  {
    key: "anxietyPanic",
    start: /Anxiety.*Panic/i,
    end: /Suicidal Thought/i,
    title: "Anxiety Panic Attacks",
    tagline: "Reclaiming Calm — You Are Not Defined by Your Fear",
  },
  {
    key: "suicidalThoughts",
    start: /Suicidal Thought/i,
    end: /Cultural Identity/i,
    title: "Suicidal Thoughts",
    tagline: "You are not alone in this. And hope—though it may feel distant—still lives.",
  },
  {
    key: "culturalIdentity",
    start: /Cultural Identity/i,
    end: /Bipolar Disorder/i,
    title: "Cultural Identity",
    tagline: "Understanding Your Story, Embracing Your True Self",
  },
  {
    key: "bipolar",
    start: /Bipolar Disorder/i,
    end: /^ADHD\b/i,
    title: "Bipolar Disorder",
    tagline: "Finding Steady Ground in the Shifts of Emotion",
  },
  {
    key: "adhd",
    start: /^ADHD\b/i,
    end: /Relationship Counseling/i,
    title: "ADHD",
    tagline:
      "With the right support, your child can grow—with more focus, confidence, and self-understanding.",
  },
  {
    key: "relationship",
    start: /Relationship Counseling/i,
    end: /Obsessive-Compulsive/i,
    title: "Relationship Counseling",
    tagline: "For connections that feel safe, honest, and true to you",
  },
  {
    key: "ocd",
    start: /Obsessive-Compulsive/i,
    end: /Eating Disorders/i,
    title: "Obsessive-Compulsive Disorder (OCD)",
    tagline: "Finding Your Way Back to a Calmer, More Centered Life",
  },
  {
    key: "eatingDisorders",
    start: /Eating Disorders/i,
    end: /Autism Spectrum/i,
    title: "Eating Disorders",
    tagline: "A Gentle Beginning Toward a Healthier Body and Mind",
  },
  {
    key: "asd",
    start: /Autism Spectrum/i,
    end: /Life Stress/i,
    title: "Autism Spectrum Disorder (ASD)",
    tagline: "For every unique way of being—there is space to grow, connect, and thrive.",
  },
  {
    key: "lifeStress",
    start: /Life Stress/i,
    end: /Grief\s*&\s*Loss/i,
    title: "Life Stress",
    tagline: "Lighten the weight you carry — and make space for an easier tomorrow",
  },
  {
    key: "griefLoss",
    start: /Grief\s*&\s*Loss/i,
    end: /Sleep Disturbances/i,
    title: "Grief & Loss",
    tagline: "Holding the Memories, Finding Your Way Forward",
  },
  {
    key: "sleep",
    start: /Sleep Disturbances/i,
    end: null,
    title: "Sleep Disturbances",
    tagline: "A Restful Night Can Be Yours Again",
  },
];

const CLOSING_START_RE =
  /^(Your First Step|You Are Still Here|Rediscovering Possibility|A First Step Toward)/i;

const SKIP_EXACT = new Set([
  "Services Areas",
  "Service Areas",
  "(Attention Deficit Hyperactivity Disorder)",
  "or connections that feel safe, honest, and true to you",
  "Depression You Are Not Alone",
]);

function filterParagraph(p, meta) {
  const t = p.trim();
  if (t.length < 3) return false;
  if (SKIP_EXACT.has(t)) return false;
  if (t === meta.title) return false;
  if (t === meta.tagline) return false;
  return true;
}

function getCanonicalParagraphs(meta) {
  const blocks = scraped.serviceAreas?.blocks || [];
  let inSection = false;
  let best = [];
  let bestScore = 0;

  for (const b of blocks) {
    const ps = b.paragraphs || [];
    const probe = ps.join(" ");
    if (!inSection && (meta.start.test(probe) || ps.some((p) => meta.start.test(p)))) {
      inSection = true;
    }
    if (!inSection) continue;
    if (meta.end && (meta.end.test(probe) || ps.some((p) => meta.end.test(p)))) break;
    const score = ps.join("").length;
    if (score > bestScore) {
      bestScore = score;
      best = ps;
    }
  }
  return preprocessParagraphs(
    best.filter((p) => filterParagraph(p, meta)),
  );
}

function isCategoryListLine(p) {
  const t = p.trim();
  return (
    /^(Communication|Self-Care|Lifestyle Support|Lifestyle Support &|Medication|School &|Family |Parent )/i.test(
      t,
    ) &&
    t.includes(" – ") &&
    !t.startsWith("•")
  );
}

function preprocessParagraphs(paras) {
  const out = [];
  for (let i = 0; i < paras.length; i++) {
    let p = paras[i];
    if (
      i + 1 < paras.length &&
      paras[i + 1].trim().startsWith("–") &&
      (/\((?:CBT|IPT|BA|ERP|EMDR|ACT|DBT|SST)\)\s*$/.test(p.trim()) ||
        (p.includes("•") && !/\s[–—]\s/.test(p.replace(/^•\s*/, ""))))
    ) {
      p = `${p} – ${paras[i + 1].trim().replace(/^[–-]\s*/, "")}`;
      i++;
    }
    out.push(p);
  }
  return out;
}

function isCallout(p) {
  const t = p.trim();
  return t.startsWith("*") && t.endsWith("*");
}

function toItalic(p) {
  return `*${p.trim().replace(/^\*+|\*+$/g, "").trim()}*`;
}

function isBulletLine(p) {
  const t = p.trim();
  return t.startsWith("•") || t.startsWith("–") || t.startsWith("- ");
}

function isTherapyNameOnly(p) {
  const t = p.trim();
  if (t.length > 100) return false;
  if (isBulletLine(t)) return false;
  return (
    /^(Cognitive Behavioral|Interpersonal|Behavioral Activation|Client-Centered|Exposure Therapy|Eye Movement|Stress Management|Relationship Pattern|Crisis Support|Social Skills|Speech & Language|Sensory Integration|Behavioral Therapy|Organizational)/i.test(
      t,
    ) && !t.includes(" – ") && !/\s—\s/.test(t)
  );
}

function isMajorHeading(p) {
  const t = p.trim();
  if (t.length > 160) return false;
  if (CLOSING_START_RE.test(t)) return false;
  if (isCallout(t) || isBulletLine(t) || isTherapyNameOnly(t)) return false;
  if (/^Psychotherapy & Counseling$/i.test(t)) return false;
  if (/^Lifestyle Support/i.test(t) && t.length < 70) return false;
  if (/^Communication &/i.test(t) && t.length < 90) return false;
  if (/^Self-Care &/i.test(t) && t.length < 90) return false;
  if (/^Medication\b/i.test(t) && t.length < 60) return false;
  if (
    /following|feel familiar|sound familiar|may be time to|may be time for|may help:/i.test(
      t,
    )
  ) {
    return false;
  }
  if (/^If (you|any|you've|someone|these)/i.test(t) && t.length < 200) return false;
  if (/^Trauma can show up/i.test(t)) return false;
  if (/^If You'?re a Parent/i.test(t)) return true;
  if (t.includes(":")) return true;
  if (
    /^(Listening|When |Understanding |Recognizing |Rediscovering|Reclaiming|Creating |Finding |Helping |Supporting |Healing |Gentle |A Path|Your Path|If You|You Are Still|Anorexia|Bulimia|Binge)/i.test(
      t,
    )
  ) {
    return true;
  }
  return false;
}

function isListLead(p) {
  const t = p.trim();
  if (isCategoryListLine(t)) return false;
  if (isMajorHeading(t) || CLOSING_START_RE.test(t) || isCallout(t) || isBulletLine(t)) return false;
  if (/^Psychotherapy|^Lifestyle|^Medication/i.test(t)) return true;
  if (/^Communication|^Self-Care/i.test(t)) return t.length < 80;
  if (/following|familiar|may help|may be time|sound familiar|resonate|may be time to/i.test(t)) {
    return true;
  }
  if (/^•\s*(Inattention|Hyperactivity)/i.test(t)) return true;
  return false;
}

function formatTherapyItem(raw) {
  let t = raw.replace(/^[•–-]\s*/, "").trim();
  const paren = t.match(/^(.+?\((?:CBT|IPT|BA|ERP|EMDR|ACT|DBT|SST|PMT)[^)]*\))\s*(.+)$/i);
  if (paren && !paren[2].startsWith("–")) {
    return `**${paren[1].trim()}** — ${paren[2].trim()}`;
  }
  const dash = t.match(/^(.+?)\s+[–—]\s+(.+)$/);
  if (dash && dash[1].length < 90) {
    return `**${dash[1].trim()}** — ${dash[2].trim()}`;
  }
  const noDash = t.match(/^(.+?\((?:CBT|IPT|BA|ERP|EMDR|ACT|DBT|SST)\))\s+(.+)$/i);
  if (noDash) {
    return `**${noDash[1].trim()}** — ${noDash[2].trim()}`;
  }
  return t;
}

function splitBulletLine(line) {
  const t = line.trim();
  if (t.startsWith("•")) {
    const chunks = t.split(/(?=•\s)/).map((s) => s.trim()).filter(Boolean);
    return chunks.flatMap((c) => {
      if (/^•\s*[^–—]+[–—]/.test(c)) return parseCategoryBullet(c);
      return [formatTherapyItem(c)];
    });
  }
  if (t.startsWith("–") || t.startsWith("-")) {
    const inner = t.replace(/^[–-]\s*/, "");
    if (inner.includes(" • ")) {
      return inner.split(/\s+•\s+/).map((s) => formatTherapyItem(s.trim()));
    }
    const parts = t
      .split(/\s+–\s+/)
      .map((s) => s.replace(/^[–-]\s*/, "").trim())
      .filter(Boolean);
    return parts.map((part) => formatTherapyItem(part));
  }
  return [formatTherapyItem(t)];
}

function parseCategoryBullet(line) {
  const t = line.replace(/^•\s*/, "").trim();
  const sep = t.indexOf(" – ");
  if (sep === -1) return [formatTherapyItem(`• ${t}`)];
  const cat = t.slice(0, sep).trim();
  const rest = t.slice(sep + 3);
  return rest
    .split(/\s+–\s+/)
    .map((s) => `**${cat}** — ${s.trim()}`)
    .filter(Boolean);
}

function collectBulletItems(paras, startIdx) {
  const items = [];
  let i = startIdx;
  while (i < paras.length) {
    const p = paras[i];
    if (CLOSING_START_RE.test(p) || isMajorHeading(p) || isCallout(p) || isListLead(p)) break;
    if (!isBulletLine(p)) break;
    items.push(...splitBulletLine(p));
    i++;
  }
  return { items, nextIndex: i };
}

function dedupeItems(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = item.replace(/\*\*/g, "").toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function parseSection(meta, paras) {
  const section = {
    title: meta.title,
    tagline: meta.tagline,
    groups: [],
    lists: [],
    subsections: [],
    closing: [],
  };

  let i = 0;
  let groupBuf = [];
  let currentSub = null;
  let inClosing = false;

  const targetGroups = () => {
    if (inClosing) return section.closing;
    if (currentSub) return currentSub.groups;
    return section.groups;
  };

  const targetLists = () => {
    if (currentSub) return currentSub.lists;
    return section.lists;
  };

  const flushGroup = () => {
    if (!groupBuf.length) return;
    const target = inClosing ? section.closing : currentSub ? currentSub.groups : section.groups;
    if (inClosing) {
      for (const p of groupBuf) section.closing.push(p);
    } else {
      target.push([...groupBuf]);
    }
    groupBuf = [];
  };

  const flushSub = () => {
    if (!currentSub) return;
    flushGroup();
    if (currentSub.groups.length || currentSub.lists.length) {
      section.subsections.push(currentSub);
    }
    currentSub = null;
  };

  while (i < paras.length) {
    const p = paras[i];

    if (CLOSING_START_RE.test(p)) {
      flushGroup();
      flushSub();
      inClosing = true;
      section.closing.push(`**${p.trim()}**`);
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
      groupBuf.push(toItalic(p));
      i++;
      continue;
    }

    if (isMajorHeading(p)) {
      flushGroup();
      flushSub();
      currentSub = { heading: p, groups: [], lists: [] };
      i++;
      continue;
    }

    if (isCategoryListLine(p)) {
      flushGroup();
      const parts = p.split(/\s+–\s+/).map((s) => s.trim()).filter(Boolean);
      const lead = parts[0];
      const items = parts.slice(1);
      targetLists().push({ lead, items });
      i++;
      continue;
    }

    if (isListLead(p)) {
      flushGroup();
      const lead = p.replace(/^•\s*/, "").trim();
      i++;
      const { items, nextIndex } = collectBulletItems(paras, i);
      i = nextIndex;
      if (items.length) {
        targetLists().push({ lead, items: dedupeItems(items) });
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
        targetLists().push({ items: dedupeItems(items) });
      }
      continue;
    }

    if (p.length < 95 && i + 1 < paras.length && isBulletLine(paras[i + 1]) && !isMajorHeading(p)) {
      flushGroup();
      const lead = p;
      i++;
      const { items, nextIndex } = collectBulletItems(paras, i);
      i = nextIndex;
      targetLists().push({ lead, items: dedupeItems(items) });
      continue;
    }

    groupBuf.push(p);
    i++;
  }

  flushGroup();
  flushSub();

  // Dedupe closing paragraphs
  if (section.closing.length) {
    const seen = new Set();
    section.closing = section.closing.filter((p) => {
      if (seen.has(p)) return false;
      seen.add(p);
      return true;
    });
  }

  if (!section.subsections.length) delete section.subsections;
  if (!section.lists.length) delete section.lists;
  if (!section.closing.length) delete section.closing;

  return section;
}

const result = {};
for (const meta of AREA_MARKERS) {
  const paras = getCanonicalParagraphs(meta);
  result[meta.key] = parseSection(meta, paras);
  console.error(
    meta.key,
    "paras:",
    paras.length,
    "groups:",
    result[meta.key].groups?.length,
    "lists:",
    result[meta.key].lists?.length ?? 0,
    "subs:",
    result[meta.key].subsections?.length ?? 0,
    "closing:",
    result[meta.key].closing?.length ?? 0,
  );
}

const outPath = path.join(__dirname, "..", "locales", "content", "service-areas.en.js");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(
  outPath,
  `// 서비스 분야 영문 본문 (groups/lists/subsections 구조)\nexport const serviceAreasSectionsEn = ${JSON.stringify(result, null, 2)};\n`,
  "utf8",
);
console.error("Wrote", outPath);

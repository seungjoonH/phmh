#!/usr/bin/env node
// Wix 페이지 HTML에서 wixui-rich-text 텍스트 추출
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import * as cheerio from "cheerio";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "output");

const PAGES = {
  whoWeAre: "https://www.phmhservices.com/%EB%B3%B5%EC%A0%9C-about",
  ourVision: "https://www.phmhservices.com/about-1-1",
  servicesTypes: "https://www.phmhservices.com/%EB%B3%B5%EC%A0%9C-services-2",
  serviceAreas: "https://www.phmhservices.com/%EB%B3%B5%EC%A0%9C-services",
  gettingStarted: "https://www.phmhservices.com/services-2",
  fee: "https://www.phmhservices.com/%EB%B3%B5%EC%A0%9C-fee",
  koreaCenter: "https://www.phmhservices.com/%EB%B3%B5%EC%A0%9C-contact-us-2",
  philippinesCenter: "https://www.phmhservices.com/%EB%B3%B5%EC%A0%9C-contact-us-1",
};

function cleanText(s) {
  return s
    .replace(/\u200B|\u200C|\u200D|\uFEFF/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractRichTexts(html) {
  const $ = cheerio.load(html);
  const blocks = [];
  $('[class*="wixui-rich-text"], [data-testid="richTextElement"]').each((_, el) => {
    const tag = el.tagName?.toLowerCase() || "motion.div";
    const text = cleanText($(el).text());
    if (text.length < 2) return;
    const isHeading =
      $(el).find("h1, h2, h3, h4, h5, h6").length > 0 ||
      /^h[1-6]$/.test(tag) ||
      $(el).attr("role") === "heading";
    const hasList = $(el).find("li").length > 0;
    const bullets = [];
    if (hasList) {
      $(el)
        .find("li")
        .each((__, li) => {
          const t = cleanText($(li).text());
          if (t) bullets.push(t);
        });
    }
    const paragraphs = [];
    if (!hasList) {
      $(el)
        .find("p")
        .each((__, p) => {
          const t = cleanText($(p).text());
          if (t) paragraphs.push(t);
        });
      if (paragraphs.length === 0 && text) paragraphs.push(text);
    }
    blocks.push({
      isHeading,
      text: hasList ? "" : text,
      paragraphs: hasList ? [] : paragraphs.length ? paragraphs : [text],
      bullets,
    });
  });
  return blocks;
}

function blocksToParagraphs(blocks) {
  const paras = [];
  for (const b of blocks) {
    if (b.isHeading && b.text) continue;
    if (b.bullets.length) continue;
    for (const p of b.paragraphs) {
      if (p.length > 20) paras.push(p);
    }
  }
  return [...new Set(paras)];
}

async function fetchPage(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "PHMH-scraper/1.0 (migration)" },
  });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.text();
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const scraped = {};

  for (const [key, url] of Object.entries(PAGES)) {
    console.log("Fetching", key, url);
    try {
      const html = await fetchPage(url);
      const blocks = extractRichTexts(html);
      scraped[key] = {
        url,
        blocks,
        paragraphs: blocksToParagraphs(blocks),
        headings: blocks.filter((b) => b.isHeading).map((b) => b.text || b.paragraphs[0]),
      };
    } catch (e) {
      console.error("Failed", key, e.message);
      scraped[key] = { url, error: e.message, blocks: [], paragraphs: [] };
    }
  }

  fs.writeFileSync(
    path.join(OUT_DIR, "scraped-en.json"),
    JSON.stringify(scraped, null, 2),
    "utf8",
  );
  console.log("Wrote", path.join(OUT_DIR, "scraped-en.json"));
}

main();

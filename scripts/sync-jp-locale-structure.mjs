#!/usr/bin/env node --experimental-strip-types
// jp locale·content — en.js / services.en.js 구조·규격에 맞춤 (기존 일문 보존)
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

/** @param {string} s */
function hasJapanese(s) {
  return /[\u3040-\u30ff\u4e00-\u9fff]/.test(s);
}

/** @param {string} s */
function isMostlyEnglish(s) {
  return typeof s === "string" && /[A-Za-z]{4,}/.test(s) && !hasJapanese(s);
}

/** @param {unknown} value */
function flattenGroups(groups) {
  if (!Array.isArray(groups)) return [];
  return groups.flatMap((g) => (Array.isArray(g) ? g : []));
}

/** @param {unknown} value */
function formatValue(value, indent = 0) {
  const sp = "  ".repeat(indent);
  if (typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    const lines = value.map((item) => `${sp}  ${formatValue(item, indent + 1)},`);
    return `[\n${lines.join("\n")}\n${sp}]`;
  }
  if (value && typeof value === "object") {
    const lines = Object.entries(value).map(([key, val]) => {
      const k = /^[a-zA-Z_$][\w$]*$/.test(key) ? key : JSON.stringify(key);
      return `${sp}  ${k}: ${formatValue(val, indent + 1)},`;
    });
    return `{\n${lines.join("\n")}\n${sp}}`;
  }
  return "null";
}

/**
 * @param {string} filePath
 * @param {string} exportName
 * @param {string} headerComment
 * @param {unknown} obj
 */
function writeJsModule(filePath, exportName, headerComment, obj) {
  const body = `${headerComment}\nexport const ${exportName} = ${formatValue(obj, 0)};\n`;
  fs.writeFileSync(filePath, body, "utf8");
}

const JP_LIST_LEADS = {
  "Common issues addressed in individual Therapy include:":
    "個人カウンセリングで扱う主なテーマは次のとおりです。",
  "Therapeutic approaches may include:":
    "用いる主なアプローチには次のようなものがあります。",
  "Through Therapy, you will:":
    "カウンセリングを通じて、次のような変化が期待できます。",
  "Couples Therapy helps you:":
    "カップルカウンセリングでは、次のような支援ができます。",
  "Family therapy focuses on:":
    "家族カウンセリングの焦点：",
  "Therapists observe and guide play sessions to help children:":
    "カウンセラーは遊びのセッションを観察・導きながら、子どもたちが次を育めるよう支援します：",
  "It is especially effective for those dealing with:":
    "特に次のような方に効果的です：",
  "For those seeking spiritual guidance alongside psychological support, Christian counseling integrates Biblical principles with professional therapy. This approach focuses on:":
    "心理的サポートとともに精神的な導きを求める方のために、キリスト教カウンセリングは聖書の原則と専門的な療法を統合します。このアプローチの焦点は次のとおりです。",
};

const EN_ITEM_JP = {
  Depression: "うつ病",
  "Anxiety disorders": "不安症",
  "Stress management": "ストレス管理",
  "Low self-esteem": "自尊心の低下",
  "Interpersonal conflicts": "対人関係の葛藤",
  "Life transitions": "人生の転換期",
  "Cognitive Behavioral Therapy (CBT): Restructures negative thought patterns":
    "認知行動療法（CBT）：否定的な思考パターンを再構造化します",
  "Psychoanalytic Therapy: Explores past experiences and unconscious emotions":
    "精神分析療法：過去の経験や無意識の感情を探求します",
  "Person-Centered Therapy: Encourages self-discovery and personal growth":
    "人間中心療法：自己発見と個人的な成長を促進します",
  "Gain self-awareness": "自己理解を深める",
  "Improve emotional regulation": "感情の調整力を高める",
  "Develop problem-solving skills": "問題解決力を養う",
  "Heal emotional wounds": "心の傷を癒す",
  "Enhance overall well-being": "全体的なウェルビーイングを高める",
  "Identify and break negative relationship patterns":
    "ネガティブな関係パターンを把握し、変えていく",
  "Improve communication skills": "コミュニケーションの取り方を改善する",
  "Develop empathy and understanding": "共感力と相互理解を深める",
  "Express emotions effectively": "感情を効果的に伝える",
  "Rebuild trust and intimacy": "信頼と親密さを取り戻す",
  "Strengthening emotional bonds between parents and children":
    "親子間の情緒的な絆を強める",
  "Improving communication and understanding":
    "コミュニケーションと相互理解を改善する",
  "Identifying and modifying dysfunctional patterns":
    "機能不全のパターンを把握し、変化させる",
  "Creating a healthier and more supportive home environment":
    "より健全で温かい家庭環境を作る",
  "Art materials": "美術材料",
  "Dolls and figurines": "人形やフィギュア",
  "Toys and games": "おもちゃやゲーム",
  "Develop problem-solving skills": "問題解決能力を伸ばす",
  "Improve self-esteem": "自尊心を高める",
  "Regulate emotions": "感情を調整する",
  "Enhance social skills": "社会性を育む",
  Anxiety: "不安",
  Stress: "ストレス",
  "Relationship difficulties": "人間関係の困難",
  "Strengthening faith": "信仰を強める",
  "Overcoming guilt and anxiety": "罪悪感や不安を乗り越える",
  "Healing relationships": "関係を癒す",
  "Finding peace through prayer, scripture, and reflection":
    "祈り、聖書の言葉、黙想を通じて平安を見つける",
};

/**
 * @param {string} s
 */
function toJpItem(s) {
  if (!s || hasJapanese(s)) return s;
  return EN_ITEM_JP[s] ?? s;
}

/**
 * @param {string} lead
 */
function toJpLead(lead) {
  if (!lead) return lead;
  if (hasJapanese(lead)) return lead;
  return JP_LIST_LEADS[lead] ?? lead;
}

/**
 * @param {unknown} enList
 * @param {unknown} oldList
 */
function mergeList(enList, oldList) {
  /** @type {Record<string, unknown>} */
  const out = {};
  if (enList.lead !== undefined) {
    out.lead = toJpLead(
      typeof oldList?.lead === "string" && !isMostlyEnglish(oldList.lead)
        ? oldList.lead
        : enList.lead,
    );
  }
  out.items = enList.items.map((_, ii) =>
    toJpItem(oldList?.items?.[ii] ?? ""),
  );
  return out;
}

/**
 * @param {string} key
 * @param {Record<string, unknown>} enSec
 * @param {Record<string, unknown> | undefined} oldSec
 */
function mergeServiceSection(key, enSec, oldSec) {
  const result = structuredClone(enSec);
  if (!oldSec) return result;

  if (typeof oldSec.title === "string") result.title = oldSec.title;

  const flat = flattenGroups(oldSec.groups);

  if (key === "individual") {
    result.groups = [
      [flat[0] ?? "", flat[1] ?? ""],
      [flat[2] ?? ""],
      [
        "個人カウンセリングは、専門のカウンセラーと一人対一人の秘密が守られた場で、自分の考えや感情を探求できる環境を提供します。",
        flat[4] ??
          "カウンセラーは皆さまが抱える困難を深く理解できるよう助け、エビデンスに基づいた治療的アプローチを活用して、実践的な解決策を一緒に探します。",
      ],
    ];
  } else if (key === "couples") {
    result.groups = [
      [flat[0] ?? ""],
      ["でも希望はあります。"],
      [flat[1] ?? ""],
    ];
    result.lists = [mergeList(enSec.lists[0], { items: flat.slice(2, 7) })];
    if (Array.isArray(oldSec.closing) && oldSec.closing.length > 0) {
      result.closing = oldSec.closing;
    }
    return result;
  } else if (key === "family") {
    result.groups = [[flat[0] ?? "", flat[1] ?? ""]];
  } else if (key === "play") {
    result.groups = [
      [
        flat[0] ??
          "子どもは感情を言葉にするのが難しく、不安や怒り、悲しみを処理するのに苦労することがよくあります。遊び療法は、次を通じて感情表現の安全で創造的な場を提供します：",
      ],
    ];
  } else if (key === "group") {
    result.groups = [
      [
        flat[0] ?? "",
        "グループカウンセリングは、参加者が洞察を分かち合い、励まし合い、共に成長できる支援的な場を提供します。",
      ],
    ];
  } else if (key === "christian") {
    result.groups = [];
    const oldFlat = flattenGroups(oldSec.groups);
    result.lists = [
      mergeList(enSec.lists[0], {
        lead: enSec.lists[0].lead,
        items: [
          oldFlat[0] ?? "",
          oldFlat[1] ?? "",
          ...(oldSec.lists?.[0]?.items ?? []).map(toJpItem),
        ].slice(0, enSec.lists[0].items.length),
      }),
    ];
    if (Array.isArray(oldSec.closing) && oldSec.closing.length > 0) {
      result.closing = oldSec.closing;
    }
    return result;
  } else {
    let i = 0;
    result.groups = enSec.groups.map((g) => g.map(() => flat[i++] ?? ""));
  }

  result.lists = enSec.lists.map((enList, li) =>
    mergeList(enList, oldSec.lists?.[li]),
  );

  if (Array.isArray(oldSec.closing) && oldSec.closing.length > 0) {
    result.closing = oldSec.closing;
  }

  return result;
}

/**
 * @param {Record<string, unknown>} enSub
 * @param {Record<string, unknown> | undefined} oldSub
 */
function mergeSubsection(enSub, oldSub) {
  const result = structuredClone(enSub);
  if (!oldSub) return result;

  if (typeof oldSub.heading === "string" && oldSub.heading) {
    result.heading = oldSub.heading;
  }

  const flat = flattenGroups(oldSub.groups);
  let i = 0;
  result.groups = enSub.groups.map((g) => g.map(() => flat[i++] ?? ""));

  result.lists = enSub.lists.map((enList, li) =>
    mergeList(enList, oldSub.lists?.[li]),
  );

  return result;
}

/**
 * @param {Record<string, unknown>} enSec
 * @param {Record<string, unknown> | undefined} oldSec
 */
function mergeAreaSection(enSec, oldSec) {
  const result = structuredClone(enSec);
  if (!oldSec) return result;

  if (typeof oldSec.title === "string") result.title = oldSec.title;
  if (typeof oldSec.tagline === "string") result.tagline = oldSec.tagline;

  const flat = flattenGroups(oldSec.groups);
  let i = 0;
  result.groups = enSec.groups.map((g) => g.map(() => flat[i++] ?? ""));

  result.subsections = enSec.subsections.map((enSub, si) =>
    mergeSubsection(enSub, oldSec.subsections?.[si]),
  );

  if (Array.isArray(oldSec.closing) && oldSec.closing.length > 0) {
    result.closing = oldSec.closing.map((s) =>
      typeof s === "string" && isMostlyEnglish(s) ? s : s,
    );
  }

  return result;
}

const jp = (await import(pathToFileURL(path.join(ROOT, "locales/jp.js")).href)).default;
const { servicesSectionsEn } = await import(
  pathToFileURL(path.join(ROOT, "locales/content/services.en.js")).href,
);
const { servicesSectionsJp: oldServices } = await import(
  pathToFileURL(path.join(ROOT, "locales/content/services.jp.js")).href,
);
const { serviceAreasSectionsEn } = await import(
  pathToFileURL(path.join(ROOT, "locales/content/service-areas.en.js")).href,
);
const { serviceAreasSectionsJp: oldAreas } = await import(
  pathToFileURL(path.join(ROOT, "locales/content/service-areas.jp.js")).href,
);

/** @type {Record<string, unknown>} */
const servicesSectionsJp = {};
for (const key of Object.keys(servicesSectionsEn)) {
  servicesSectionsJp[key] = mergeServiceSection(
    key,
    servicesSectionsEn[key],
    oldServices[key],
  );
}

/** @type {Record<string, unknown>} */
const serviceAreasSectionsJp = {};
for (const key of Object.keys(serviceAreasSectionsEn)) {
  serviceAreasSectionsJp[key] = mergeAreaSection(
    serviceAreasSectionsEn[key],
    oldAreas[key],
  );
}

writeJsModule(
  path.join(ROOT, "locales/content/services.jp.js"),
  "servicesSectionsJp",
  "// サービス種別 日本語本文",
  servicesSectionsJp,
);
writeJsModule(
  path.join(ROOT, "locales/content/service-areas.jp.js"),
  "serviceAreasSectionsJp",
  "// サービス分野 日本語本文 (groups/lists/subsections 構造)",
  serviceAreasSectionsJp,
);

const jpMain = structuredClone(jp);
jpMain.services = {
  ...jp.services,
  sections: "__SECTIONS_SERVICES__",
};
jpMain.serviceAreas = {
  ...jp.serviceAreas,
  sections: "__SECTIONS_AREAS__",
};

let body = JSON.stringify(jpMain, null, 2);
body = body
  .replace('"__SECTIONS_SERVICES__"', "servicesSectionsJp,")
  .replace('"__SECTIONS_AREAS__"', "serviceAreasSectionsJp,");

const contactBlock = `  "contact": {
    "title": ${JSON.stringify(jp.contact?.title ?? "お問い合わせ")},
    "centerToggleLabel": ${JSON.stringify(jp.contact?.centerToggleLabel ?? "センター選択")},
    "centerKorea": ${JSON.stringify(jp.contact?.centerKorea ?? "韓国")},
    "centerPhilippines": ${JSON.stringify(jp.contact?.centerPhilippines ?? "フィリピン")},
    "form": contactFormMessages.form,
    "insuranceOptions": contactFormMessages.insuranceOptions,
    "seekingHelpOptions": contactFormMessages.seekingHelpOptions,
    "korea": ${JSON.stringify(jp.contact?.korea ?? {}, null, 4).replace(/^/gm, "    ").trimEnd()},
    "philippines": ${JSON.stringify(jp.contact?.philippines ?? {}, null, 4).replace(/^/gm, "    ").trimEnd()}
  }`;

body = body.replace(/  "contact": \{[\s\S]*?  \},\n  "payment"/, `${contactBlock},\n  "payment"`);

const mainSource = `// 日本語 locale
import { buildContactFormMessages } from "../lib/contact-form-schema.ts";
import { serviceAreasSectionsJp } from "./content/service-areas.jp.js";
import { servicesSectionsJp } from "./content/services.jp.js";

const contactFormMessages = buildContactFormMessages("jp");

export default ${body};
`;

fs.writeFileSync(path.join(ROOT, "locales/jp.js"), mainSource, "utf8");
console.log("Aligned jp.js and content/*.jp.js to en.js structure.");

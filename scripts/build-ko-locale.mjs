#!/usr/bin/env node
// en.ts 구조를 기반으로 ko.ts 생성 (합니다체)
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const enModule = await import(pathToFileURL(path.join(__dirname, "../locales/en.js")).href);
const en = enModule.default;

const UI = {
  "PHMH": "PHMH",
  "Peace & Hope Mental Health Services": "Peace & Hope Mental Health Services",
  "Schedule a Consultation": "상담 예약하기",
  "Top of site": "맨 위로",
  "Send": "보내기",
  "Back": "뒤로",
  "Continue": "계속",
  "Pay Now": "결제하기",
  "Coming soon": "준비 중",
  "Contact form will be available soon. Please email us directly.":
    "문의 폼 연동 예정입니다. 당분간 이메일로 문의해 주시기 바랍니다.",
  "Settings": "설정",
  "Close": "닫기",
  "About": "소개",
  "Who we are": "회사 소개",
  "Our Vision": "우리의 비전",
  "Services": "서비스",
  "Types of Services": "서비스 유형",
  "Service Areas": "관심 분야",
  "Getting Started": "시작하기",
  "Fee": "비용",
  "Online payment": "온라인 결제",
  "Contact Us": "문의하기",
  "Korea Center": "한국 센터",
  "Philippines Center": "필리핀 센터",
  "Menu": "메뉴",
  "System": "시스템",
  "Light": "라이트",
  "Dark": "다크",
  "Thank You": "감사합니다",
  "Payment Received": "결제 완료",
  "Our Services": "우리의 서비스",
  "Fees": "비용 안내",
  "Payment": "결제",
  "Checkout": "결제하기",
  "1. Your Details": "1. 정보 입력",
  "2. Payment Details": "2. 결제 수단",
  "1 Session for Individual Therapy + DBQ": "개인 상담 1회 + DBQ",
  "Email": "이메일",
  "Last Name": "성",
  "First Name": "이름",
  "Country": "국가",
  "Phone": "전화",
  "Phone Number": "전화번호",
  "Date of Birth": "생년월일",
  "How can we help?": "어떤 도움이 필요하신가요?",
  "Let me know your problem": "고민을 알려 주세요",
  "Insurance Types": "보험 유형",
  "What are you seeking help with?": "어떤 도움을 찾고 계신가요?",
  "If you check others, tell us your disease.":
    "기타를 선택하신 경우 상세 내용을 알려 주세요.",
  "Communicating With You": "연락에 대한 동의",
  "Yes - I agree and understand": "예, 이해하였으며 동의합니다",
  "Address": "주소",
  "Contact": "연락처",
  "Opening Hours": "운영 시간",
  "PayPal": "PayPal",
  "Stripe": "Stripe",
  "Toss Payments": "토스페이먼츠",
  "SSL Secure Payment": "SSL 안전 결제",
};

function tr(text) {
  if (!text || typeof text !== "string") return text;
  if (UI[text]) return UI[text];
  return null;
}

function translateParagraph(enText) {
  const direct = tr(enText);
  if (direct) return direct;
  if (enText.length < 3) return enText;
  return enText;
}

function walk(obj) {
  if (typeof obj === "string") {
    const ui = tr(obj);
    if (ui) return ui;
    if (obj.length > 80) {
      return translateParagraph(obj);
    }
    return translateParagraph(obj);
  }
  if (Array.isArray(obj)) return obj.map(walk);
  if (obj && typeof obj === "object") {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      out[k] = walk(v);
    }
    return out;
  }
  return obj;
}

const KO_OVERRIDES = {
  pages: {
    whoWeAre: {
      title: "회사 소개",
      paragraphs: [
        "살면서 누구나 경험·배경·성격에 따라 심리적 어려움을 겪을 수 있습니다. 힘들어하고 계시다면 혼자가 아니십니다. 전문적인 지원을 구하는 것은 치유와 성장을 위한 용기 있는 첫걸음입니다.",
        "Peace & Hope Mental Health Services(PHMH)는 균형을 되찾고 웰빙을 높이며 일상으로 돌아가실 수 있도록 돕습니다. 증상 완화를 넘어 강점을 인식하고 의미와 목적을 발견하며 성장 잠재력을 키우는 데 초점을 둡니다.",
        "대면 및 온라인 상담을 모두 제공합니다. 전 세계 어디서나 연결하실 수 있으며, 센터 방문 또는 집에서의 상담 모두 비밀이 보장되는 안전한 환경에서 진행됩니다.",
        "상담 시작에 대해 궁금하신 점이 있으시면 언제든지 문의해 주시기 바랍니다. 가장 어려운 순간에도 희망은 있습니다. PHMH가 함께하겠습니다.",
      ],
      signOff: "도움이 필요하시면 언제든지 말씀해 주세요.",
      team: "진심을 담아,\nPeace & Hope Mental Health Services 팀 드림",
    },
    ourVision: {
      title: "우리의 비전",
      paragraphs: [
        "우리는 어떻게 세상을 바꿀 수 있을까요?",
        "거창한 구호보다 한 사람에게 집중하는 것이 우리의 방식입니다.",
        "한 사람의 변화는 주변으로 퍼져 나가는 파급 효과를 만듭니다.",
        "PHMH 전문가들은 치유와 성장의 여정을 함께 걸어갑니다.",
        "변화는 한 사람에게서 시작됩니다.",
      ],
    },
    gettingStarted: {
      title: "시작하기",
      steps: [
        { number: "01", title: "탐색", description: "우리의 철학과 접근 방식을 알아보세요." },
        { number: "02", title: "문의하기", description: "질문하시고 예약하세요." },
        { number: "03", title: "온라인 양식 작성", description: "첫 상담에 필요합니다." },
        { number: "04", title: "초기 상담 참석", description: "치료 목표를 설정합니다." },
        { number: "05", title: "치료 시작", description: "전문가와 함께 치유를 진행합니다." },
        { number: "06", title: "문제 해결", description: "목표를 향해 나아갑니다." },
      ],
    },
    thankYou: {
      title: "감사합니다",
      paragraphs: [
        "문의가 접수되었습니다. Peace & Hope Mental Health Services를 찾아 주셔서 감사합니다.",
        "담당자가 내용을 검토한 후 가능한 한 빨리 연락드리겠습니다.",
      ],
    },
    paymentSuccess: {
      title: "결제 완료",
      paragraphs: [
        "결제해 주셔서 감사합니다. 세션 또는 영수증에 관한 문의는 문의하기 페이지를 이용해 주시기 바랍니다.",
      ],
    },
  },
  contact: {
    form: {
      consentBody:
        "본 양식을 제출하시면 문의에 대한 연락에 동의하신 것으로 간주됩니다. 제공하신 정보는 비밀로 처리됩니다.",
    },
  },
  payment: {
    paypalNotice:
      "주문 후 PayPal로 이동하여 결제를 완료하실 수 있습니다.",
  },
};

function deepMerge(base, over) {
  if (!over) return base;
  if (typeof over !== "object" || over === null) return over;
  if (Array.isArray(over)) return over;
  const out = { ...base };
  for (const k of Object.keys(over)) {
    out[k] = deepMerge(base?.[k], over[k]);
  }
  return out;
}

let ko = walk(en);
ko = deepMerge(ko, KO_OVERRIDES);

const areaKoTitles = {
  depression: "우울",
  traumaPtsd: "트라우마 및 PTSD",
  anxietyPanic: "불안·공황",
  suicidalThoughts: "자살 사고",
  culturalIdentity: "문화적 정체성",
  bipolar: "양극성 장애",
  adhd: "ADHD",
  relationship: "관계 상담",
  ocd: "강박장애(OCD)",
  eatingDisorders: "섭식 장애",
  asd: "자폐 스펙트럼 장애(ASD)",
  lifeStress: "생활 스트레스",
  griefLoss: "슬픔과 상실",
  sleep: "수면 장애",
};

for (const [key, section] of Object.entries(en.serviceAreas.sections)) {
  const enSec = section;
  const koSec = {
    title: areaKoTitles[key] || enSec.title,
    tagline: enSec.tagline ? `${enSec.tagline} (한국어 번역 예정)` : "",
    intro: enSec.intro.map(
      (p) =>
        `PHMH는 ${areaKoTitles[key] || key} 관련 어려움을 겪는 분들을 전문적으로 지원합니다. ${p.slice(0, 120)}…`,
    ),
    blocks: enSec.blocks,
    bullets: enSec.bullets.map((b) => `• ${b}`),
  };
  ko.serviceAreas.sections[key] = koSec;
}

for (const [key, section] of Object.entries(en.services.sections)) {
  const titles = {
    individual: "개인 상담",
    couples: "부부 상담",
    family: "가족 상담",
    play: "놀이 치료",
    group: "그룹 상담",
    christian: "기독교 상담",
  };
  ko.services.sections[key] = {
    title: titles[key] || section.title,
    paragraphs: section.paragraphs.map(
      (p, i) =>
        i === 0
          ? `${titles[key]}은 내담자의 필요에 맞춘 전문 지원을 제공합니다.`
          : `${p.slice(0, 100)}… (상세 한국어 번역은 추후 보완 예정)`,
    ),
    bullets: section.bullets,
  };
}

const outPath = path.join(__dirname, "..", "locales", "ko.js");
fs.writeFileSync(
  outPath,
  `// 한국어 locale (합니다체)\nexport default ${JSON.stringify(ko, null, 2)};\n`,
  "utf8",
);
console.log("Wrote", outPath);

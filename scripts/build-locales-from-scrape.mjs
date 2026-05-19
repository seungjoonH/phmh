#!/usr/bin/env node
// scraped-en.json → locales/en.js 구조 생성
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const scraped = JSON.parse(
  fs.readFileSync(path.join(__dirname, "output/scraped-en.json"), "utf8"),
);

function dedupe(arr) {
  return [...new Set(arr.filter(Boolean))];
}

function uniqueParagraphs(key, minLen = 40) {
  return dedupe(scraped[key]?.paragraphs?.filter((p) => p.length >= minLen) || []);
}

const THERAPY_MARKERS = [
  { key: "individual", id: "individual-therapy", match: /Individual Therapy/i },
  { key: "couples", id: "couples-therapy", match: /Couples Therapy/i },
  { key: "family", id: "family-therapy", match: /Family Therapy/i },
  { key: "play", id: "play-therapy", match: /Play Therapy/i },
  { key: "group", id: "group-therapy", match: /Group Therapy/i },
  { key: "christian", id: "christian-counseling", match: /Christian Counseling/i },
];

const AREA_MARKERS = [
  { key: "depression", match: /^Depression\b/i },
  { key: "traumaPtsd", match: /Trauma\s*&\s*PTSD/i },
  { key: "anxietyPanic", match: /Anxiety.*Panic/i },
  { key: "suicidalThoughts", match: /Suicidal Thought/i },
  { key: "culturalIdentity", match: /Cultural Identity/i },
  { key: "bipolar", match: /Bipolar Disorder/i },
  { key: "adhd", match: /^ADHD\b/i },
  { key: "relationship", match: /Relationship Counseling/i },
  { key: "ocd", match: /Obsessive-Compulsive|^\s*OCD\b/i },
  { key: "eatingDisorders", match: /Eating Disorders/i },
  { key: "asd", match: /Autism Spectrum|ASD/i },
  { key: "lifeStress", match: /Life Stress/i },
  { key: "griefLoss", match: /Grief\s*&\s*Loss/i },
  { key: "sleep", match: /Sleep Disturbances/i },
];

function splitByMarkers(blocks, markers) {
  const texts = blocks
    .map((b) => ({
      text: b.text || b.paragraphs?.join(" ") || "",
      paragraphs: b.paragraphs || [],
      bullets: b.bullets || [],
    }))
    .filter((b) => b.text.length > 3);

  const sections = {};
  let current = null;

  for (const b of texts) {
    const hit = markers.find((m) => m.match.test(b.text));
    if (hit) {
      current = hit.key;
      if (!sections[current]) {
        sections[current] = { paragraphs: [], bullets: [], title: b.text.split("\n")[0] };
      }
      continue;
    }
    if (!current) continue;
    sections[current].paragraphs.push(...b.paragraphs.filter((p) => p.length > 25));
    sections[current].bullets.push(...b.bullets);
  }

  for (const k of Object.keys(sections)) {
    sections[k].paragraphs = dedupe(sections[k].paragraphs);
    sections[k].bullets = dedupe(sections[k].bullets);
  }
  return sections;
}

function buildServiceTypes() {
  const blocks = scraped.servicesTypes?.blocks || [];
  const split = splitByMarkers(blocks, THERAPY_MARKERS);
  const result = {};
  for (const m of THERAPY_MARKERS) {
    const s = split[m.key] || { paragraphs: [], bullets: [] };
    result[m.key] = {
      title: m.key === "individual" ? "Individual Therapy" : m.match.source.replace(/\\b|\\^|\\$/g, "").replace(/i$/, ""),
      paragraphs: s.paragraphs.slice(0, 8),
      bullets: s.bullets.slice(0, 12),
    };
    if (m.key === "individual") result[m.key].title = "Individual Therapy";
    if (m.key === "couples") result[m.key].title = "Couples Therapy";
    if (m.key === "family") result[m.key].title = "Family Therapy";
    if (m.key === "play") result[m.key].title = "Play Therapy";
    if (m.key === "group") result[m.key].title = "Group Therapy";
    if (m.key === "christian") result[m.key].title = "Christian Counseling";
  }
  const titles = {
    individual: "Individual Therapy",
    couples: "Couples Therapy",
    family: "Family Therapy",
    play: "Play Therapy",
    group: "Group Therapy",
    christian: "Christian Counseling",
  };
  for (const k of Object.keys(titles)) {
    if (!result[k]) result[k] = { title: titles[k], paragraphs: [], bullets: [] };
    result[k].title = titles[k];
  }
  return result;
}

function buildServiceAreas() {
  const blocks = scraped.serviceAreas?.blocks || [];
  const split = splitByMarkers(blocks, AREA_MARKERS);
  const labels = {
    depression: "Depression",
    traumaPtsd: "Trauma & PTSD",
    anxietyPanic: "Anxiety Panic Attacks",
    suicidalThoughts: "Suicidal Thoughts",
    culturalIdentity: "Cultural Identity",
    bipolar: "Bipolar Disorder",
    adhd: "ADHD",
    relationship: "Relationship Counseling",
    ocd: "Obsessive-Compulsive Disorder (OCD)",
    eatingDisorders: "Eating Disorders",
    asd: "Autism Spectrum Disorder (ASD)",
    lifeStress: "Life Stress",
    griefLoss: "Grief & Loss",
    sleep: "Sleep Disturbances",
  };
  const result = {};
  for (const m of AREA_MARKERS) {
    const s = split[m.key] || { paragraphs: [], bullets: [] };
    const paras = s.paragraphs.length ? s.paragraphs : [labels[m.key]];
    result[m.key] = {
      title: labels[m.key],
      tagline: paras[1] && paras[1].length < 120 ? paras[1] : "",
      intro: paras.slice(0, 3),
      blocks: [],
      bullets: s.bullets.slice(0, 20),
    };
    if (paras.length > 4) {
      result[m.key].blocks = [
        {
          heading: "Understanding & Support",
          paragraphs: paras.slice(3, 6),
          bullets: s.bullets.slice(0, 8),
        },
      ];
    }
  }
  return result;
}

function buildWhoWeAre() {
  const paras = uniqueParagraphs("whoWeAre");
  const body = paras.filter(
    (p) => !p.includes("Who We Are") && !p.startsWith("We’re here to help"),
  );
  const sign = paras.find((p) => p.startsWith("We’re here to help"));
  return {
    title: "Who We Are",
    paragraphs: body.slice(0, 5),
    signOff: sign?.split("With best wishes")[0]?.trim() || "We're here to help.",
    team:
      "With best wishes,\nThe Peace & Hope Mental Health Services Team",
  };
}

function buildOurVision() {
  const paras = uniqueParagraphs("ourVision").filter(
    (p) => !p.includes("Our Vision") && p.length > 20,
  );
  return { title: "Our Vision", paragraphs: paras.slice(0, 6) };
}

function buildGettingStarted() {
  const paras = uniqueParagraphs("gettingStarted", 15);
  const stepTitles = [
    "Explore",
    "Contact Us",
    "Complete Online Form",
    "Attend Initial Session",
    "Begin Therapy",
    "Solve Problem",
  ];
  const steps = stepTitles.map((title, i) => {
    const desc = paras.find((p) => p.toLowerCase().includes(title.toLowerCase().split(" ")[0])) ||
      paras[i + 2] ||
      "";
    return {
      number: String(i + 1).padStart(2, "0"),
      title,
      description: desc.length > 120 ? desc.slice(0, 200) : desc || title,
    };
  });
  return { title: "Getting Started", steps };
}

function buildFee() {
  const paras = uniqueParagraphs("fee").filter((p) => p.length > 30);
  return { title: "Fees", paragraphs: paras.slice(0, 8) };
}

const messagesEn = {
  common: {
    siteName: "PHMH",
    logoAlt: "Peace & Hope Mental Health Services",
    scheduleConsultation: "Schedule a Consultation",
    topOfSite: "Top of site",
    send: "Send",
    back: "Back",
    continue: "Continue",
    payNow: "Pay Now",
    comingSoon: "Coming soon",
    formNotConfigured: "Contact form will be available soon. Please email us directly.",
    settings: "Settings",
    close: "Close",
  },
  nav: {
    about: "About",
    whoWeAre: "Who we are",
    ourVision: "Our Vision",
    services: "Services",
    typesOfServices: "Types of Services",
    serviceAreas: "Service Areas",
    gettingStarted: "Getting Started",
    fee: "Fee",
    feePage: "Fee",
    onlinePayment: "Online payment",
    contact: "Contact Us",
    koreaCenter: "Korea Center",
    philippinesCenter: "Philippines Center",
    menu: "Menu",
  },
  theme: {
    system: "System",
    light: "Light",
    dark: "Dark",
  },
  footer: {
    brand: "Peace & Hope Mental Health Services",
    menu: "Menu",
    contact: "Contact",
    email: "info@phmhservices.com",
    koreaAddress:
      "81-1, Jinsaegol-gil, Chowol-eup, Gwangju-si, Gyeonggi-do, Republic of Korea",
    philippinesAddress:
      "Abby's Apartelle, B10 L3 Unit C, Elvira St, Josefa Subd. Malabanias, Angeles",
    philippinesPhone: "+63 952 479 1119",
    hoursWeekday: "Mon - Fri: 10:00 am – 7:00 pm",
    hoursWeekend: "Saturday & Sunday: Office closed",
    virtualNote: "Virtual sessions are available",
    virtualNotePh: "Virtual sessions are available outside of office hours",
  },
  pages: {
    whoWeAre: buildWhoWeAre(),
    ourVision: buildOurVision(),
    gettingStarted: buildGettingStarted(),
    fee: buildFee(),
    thankYou: {
      title: "Thank You",
      paragraphs: [
        "Your message has been received. We appreciate you reaching out to Peace & Hope Mental Health Services.",
        "Our team will review your inquiry and respond as soon as possible.",
      ],
    },
    paymentSuccess: {
      title: "Payment Received",
      paragraphs: [
        "Thank you for your payment. If you have questions about your session or receipt, please contact us.",
      ],
    },
  },
  services: {
    pageTitle: "Our Services",
    sidebar: {
      top: "Top of site",
      individual: "Individual Therapy",
      couples: "Couples Therapy",
      family: "Family Therapy",
      play: "Play Therapy",
      group: "Group Therapy",
      christian: "Christian Counseling",
    },
    sections: buildServiceTypes(),
  },
  serviceAreas: {
    pageTitle: "Service Areas",
    sidebar: {
      top: "Top of site",
      depression: "Depression",
      traumaPtsd: "Trauma & PTSD",
      anxietyPanic: "Anxiety Panic Attacks",
      suicidalThoughts: "Suicidal Thoughts",
      culturalIdentity: "Cultural Identity",
      bipolar: "Bipolar Disorder",
      adhd: "ADHD",
      relationship: "Relationship Counseling",
      ocd: "Obsessive-Compulsive Disorder (OCD)",
      eatingDisorders: "Eating Disorders",
      asd: "Autism Spectrum Disorder (ASD)",
      lifeStress: "Life Stress",
      griefLoss: "Grief & Loss",
      sleep: "Sleep Disturbances",
    },
    sections: buildServiceAreas(),
  },
  contact: {
    title: "Contact Us",
    form: {
      firstName: "First Name",
      lastName: "Last Name",
      email: "Email",
      phone: "Phone Number",
      dateOfBirth: "Date of Birth",
      howCanWeHelp: "How can we help?",
      howCanWeHelpPlaceholder: "Let me know your problem",
      scheduling:
        "Scheduling availability (Mornings (10am-12pm) Afternoon (12-5pm) Evenings (5-7pm)).",
      schedulingPlaceholder: "If you are flexible, type 'I'm flexible'.",
      insuranceTypes: "Insurance Types",
      seekingHelp: "What are you seeking help with?",
      othersDetail: "If you check others, tell us your disease.",
      consentTitle: "Communicating With You",
      consentBody:
        "By submitting this form, you agree that we may contact you regarding your inquiry. Your information will be handled confidentially.",
      consentCheckbox: "Yes - I agree and understand",
      submit: "Send",
    },
    insuranceOptions: [
      "FMP (Veterans Affairs)",
      "TRICARE Active Duty",
      "TRICARE Retired (Veteran)",
      "Military Dependent / Spouse",
      "Tricare",
      "Afspa",
      "Aetna",
      "GeoBlue",
      "Others",
      "None / Uninsured",
    ],
    seekingHelpOptions: [
      "Depression",
      "Anxiety",
      "Panic attacks",
      "Trauma",
      "Stress",
      "Relationship issues(Individual)",
      "Couples Therapy",
      "Family therapy (with children)",
      "Grief & Loss",
      "Adjusting to life transition Academic stress and pressure",
      "Child or Teen Therapy",
      "Low self-esteem",
      "Speech & Language Therapy",
      "ADHD",
      "ASD",
      "Addiction",
      "Psychological Evaluation",
      "Others (Specify Below)",
    ],
    korea: {
      addressTitle: "Address",
      contactTitle: "Contact",
      hoursTitle: "Opening Hours",
      hoursWeekday: "Mon - Fri 10:00 am – 7:00 pm",
      hoursWeekend: "Saturday& Sunday Office closed",
      virtualNote: "Virtual sessions are available",
    },
    philippines: {
      addressTitle: "Address",
      contactTitle: "Contact",
      hoursTitle: "Opening Hours",
      hoursWeekday: "Mon - Fri: 10:00 am – 7:00 pm",
      hoursWeekend: "Saturday & Sunday: Office closed",
      virtualNote: "Virtual sessions are available outside of office hours",
    },
  },
  payment: {
    pageTitle: "Payment",
    checkoutTitle: "Checkout",
    stepDetails: "1. Your Details",
    stepPayment: "2. Payment Details",
    products: {
      individualSessionDbq: {
        label: "1 Session for Individual Therapy + DBQ",
      },
    },
    fields: {
      email: "Email",
      lastName: "Last Name",
      firstName: "First Name",
      country: "Country",
      phone: "Phone",
    },
    continue: "Continue",
    payNow: "Pay Now",
    back: "Back",
    paypalNotice:
      "After placing the order, you'll be redirected to PayPal to complete payment.",
    sslBadge: "SSL Secure Payment",
    startPayment: "Payment",
    providers: {
      paypal: "PayPal",
      stripe: "Stripe",
      toss: "Toss Payments",
    },
  },
};

const outPath = path.join(__dirname, "..", "locales", "en.js");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(
  outPath,
  `// 영문 locale (Wix scrape 기반)\nexport default ${JSON.stringify(messagesEn, null, 2)};\n`,
  "utf8",
);
console.log("Wrote", outPath);

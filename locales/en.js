// 영문 locale (Wix scrape 기반)
import { buildContactFormMessages } from "../lib/contact-form-schema.ts";
import { serviceAreasSectionsEn } from "./content/service-areas.en.js";
import { servicesSectionsEn } from "./content/services.en.js";

const contactFormMessages = buildContactFormMessages("en");

export default {
  "common": {
    "siteName": "PHMH",
    "logoAlt": "Peace & Hope Mental Health Services",
    "scheduleConsultation": "Schedule a Consultation",
    "topOfSite": "Top of site",
    "send": "Send",
    "back": "Back",
    "continue": "Continue",
    "payNow": "Pay Now",
    "comingSoon": "Coming soon",
    "settings": "Settings",
    "close": "Close"
  },
  "nav": {
    "about": "About",
    "whoWeAre": "Who We Are",
    "ourVision": "Our Vision",
    "services": "Services",
    "typesOfServices": "Types of Services",
    "serviceAreas": "Service Areas",
    "gettingStarted": "Getting Started",
    "fee": "Fee",
    "center": "Center",
    "contact": "Contact Us",
    "koreaCenter": "Korea Center",
    "philippinesCenter": "Philippines Center",
    "therapists": "Therapists",
    "menu": "Menu"
  },
  "therapists": {
    "list": {
      "pageTitle": "Therapists",
      "breadcrumb": "Therapists"
    }
  },
  "centers": {
    "list": {
      "pageTitle": "Centers",
      "intro": "Explore our counseling centers and local spaces for in-person care.",
      "viewCenter": "View center"
    }
  },
  "theme": {
    "system": "System",
    "light": "Light",
    "dark": "Dark"
  },
  "contactInfo": {
    "email": "Email",
    "address": "Address",
    "tel": "Tel"
  },
  "siteContact": {
    "email": "hsj6831@gmail.com",
    "korea": {
      "address":
        "81-1, Jinsaegol-gil, Chowol-eup, Gwangju-si, Gyeonggi-do, Republic of Korea",
      "phone": "",
      "email": "hsj6831@gmail.com"
    },
    "philippines": {
      "addressShort":
        "Abby's Apartelle, B10 L3 Unit C, Elvira St, Josefa Subd. Malabanias, Angeles",
      "addressFull":
        "McArthur Highway, Brgy. Camachiles, Skytech IT Park Building A, Mabalacat, Pampanga, 2010",
      "phone": "+63 952 479 1119",
      "phoneViber": "+63 952 479 1119 (Viber)",
      "email": "hsj6831@gmail.com"
    }
  },
  "footer": {
    "brand": "Peace & Hope Mental Health Services",
    "menu": "Menu",
    "contact": "Contact",
    "hoursWeekday": "Mon - Fri: 10:00 am – 7:00 pm",
    "hoursWeekend": "Saturday & Sunday: Office closed",
    "virtualNote": "Virtual sessions are available",
    "virtualNotePh": "Virtual sessions are available outside of office hours"
  },
  "pages": {
    "whoWeAre": {
      "title": "Who We Are",
      "paragraphs": [
    "We're here to help.\nWith best wishes,\nThe Peace & Hope Mental Health Services Team"
  ],
      "flowText": {
        "mpuvilgj6": {
          "p": "To accommodate your needs, we offer both in-person and online counseling. No matter where you are in the world, you can connect with us. Whether you prefer visiting our center or receiving counseling from the comfort of your home, we provide a confidential and secure platform for your sessions."
        },
        "mpuvimpf7": { "heading": "" },
        "mpuvinp28": { "heading": "" },
        "mpuxksaf1": {
          "p": "If you have any questions or would like to learn more about starting therapy, don't hesitate to reach out. Even in your hardest moments, there is hope. Peace & Hope Mental Health Services is here to support you every step of the way."
        },
        "mpuxmlbl1": {
          "p": "Everyone faces psychological challenges at some point in life, shaped by their unique experiences, background, and personality. If you're struggling, know that you're not alone. Seeking professional support is a courageous and vital step toward healing and growth."
        },
        "mpuxn57c2": {
          "p": "At Peace & Hope Mental Health Services, our goal is to help you regain balance, improve well-being, and restore your ability to navigate daily life. Our approach goes beyond simply addressing symptoms—we help you recognize your strengths, discover meaning and purpose, and unlock your potential for personal growth, even in difficult times."
        },
        "mpuxn6ci3": { "heading": "" },
        "mpuxp7l48": { "heading": "" }
      },
      "lists": [],
    





  "flow": [
        { type: "p", textKey: "pages.whoWeAre.flowText.mpuxmlbl1.p" },
        { type: "p", textKey: "pages.whoWeAre.flowText.mpuxn57c2.p" },
        { type: "p", textKey: "pages.whoWeAre.flowText.mpuvilgj6.p" },
        { type: "p", textKey: "pages.whoWeAre.flowText.mpuxksaf1.p" },
        { type: "p", textKey: "pages.whoWeAre.paragraphs.0" }
      ]},
    "ourVision": {
      "title": "Our Vision",
      "paragraphs": [
        "Many seek to make an impact by creating groundbreaking innovations or shaping history in significant ways. While these efforts are valuable, we believe in a different approach—one that is small yet deeply meaningful.",
        "In a world of billions, changing the life of just one person may seem insignificant. Most may never notice the change. But for that one individual, it can be life-changing. And the impact doesn’t stop there. When one person experiences transformation, the effect ripples outward—touching their loved ones, their community, and beyond.",
        "At Peace & Hope Mental Health Services, we believe that helping one person overcome challenges, regain confidence, and build a fulfilling life is the first step toward changing the world. Through the expertise of our dedicated professionals, our clients find the strength to heal and grow. And as they thrive, they inspire others to do the same.",
        "Change begins with one person. One becomes two, two become three. With every step forward, the impact expands. At Peace & Hope Mental Health Services, the journey of transformation has begun, and together, we are making a difference."
      ]
    },
    "gettingStarted": {
      "title": "Getting Started",
      "body": {
        "flow": [],
        "paragraphs": []
      },
      "steps": [
        {
          "number": "01",
          "title": "Explore",
          "description": "Ask questions and book an appointment"
        },
        {
          "number": "02",
          "title": "Contact Us",
          "description": "Work toward healing with professional support."
        },
        {
          "number": "03",
          "title": "Complete Online Form",
          "description": "Complete Online Forms"
        },
        {
          "number": "04",
          "title": "Attend Initial Session",
          "description": "Attend Initial Session"
        },
        {
          "number": "05",
          "title": "Begin Therapy",
          "description": "Peace & Hope Mental Health Services"
        },
        {
          "number": "06",
          "title": "Solve Problem",
          "description": "Mental Health Services"
        }
      ]
    },
    "fee": {
      "title": "Fees",
      "paragraphs": [
    "**We provide direct billing services!**",
    "Most of our clients use their insurance to pay for sessions and we accept major international insurances. We know it is confusing and complicated to navigate the insurance process, but don’t worry, we are here to help you! We offer direct billing services, meaning that we will take care of submitting claims and other hassles so you can be in therapy without the headaches!",
    "**Don’t have an insurance plan?**",
    "**Please contact us.** We will inform you of other options and assist you accordingly. Please be aware that Korean health insurance does not cover mental health services.",
    "We accept major international insurance"
  ]
    },
    "thankYou": {
      "title": "Thank You",
      "paragraphs": [
        "Your message has been received. We appreciate you reaching out to Peace & Hope Mental Health Services.",
        "Our team will review your inquiry and respond as soon as possible."
      ]
    },
    "paymentSuccess": {
      "title": "Payment Received",
      "paragraphs": [
        "Thank you for your payment. If you have questions about your session or receipt, please contact us."
      ]
    },
    "notFound": {
      "title": "Page Not Found",
      "description": "The page you're looking for doesn't exist or may have been moved.",
      "linksHeading": "Helpful links",
      "homeLink": "Home",
      "homeCta": "Back to Home"
    }
  },
  "services": {
    "pageTitle": "Our Services",
    "sidebar": {
      "top": "Top of site"
    },
    "sectionOrder": [
      "individual",
      "couples",
      "family",
      "play",
      "group",
      "christian"
    ],
    "sections": servicesSectionsEn,
  },
  "serviceAreas": {
    "pageTitle": "Service Areas",
    "sidebar": {
      "top": "Top of site"
    },
    "sectionOrder": [
      "depression",
      "traumaPtsd",
      "anxietyPanic",
      "suicidalThoughts",
      "culturalIdentity",
      "bipolar",
      "adhd",
      "relationship",
      "ocd",
      "eatingDisorders",
      "asd",
      "lifeStress",
      "griefLoss",
      "sleep"
    ],
    "sections": serviceAreasSectionsEn,
  },
  "contact": {
    "title": "Contact Us",
    "centerToggleLabel": "Select center",
    "centerKorea": "Korea",
    "centerPhilippines": "Philippines",
    "mapTitleKorea": "Korea center location map",
    "mapTitlePhilippines": "Philippines center location map",
    "form": contactFormMessages.form,
    "insuranceOptions": contactFormMessages.insuranceOptions,
    "seekingHelpOptions": contactFormMessages.seekingHelpOptions,
    "korea": {
      "body": {
        "flow": [],
        "paragraphs": []
      },
      "addressTitle": "Address",
      "contactTitle": "Contact",
      "hoursTitle": "Opening Hours",
      "hoursWeekday": "Mon - Fri 10:00 am – 7:00 pm",
      "hoursWeekend": "Saturday& Sunday Office closed",
      "virtualNote": "Virtual sessions are available"
    },
    "philippines": {
      "body": {
        "flow": [],
        "paragraphs": []
      },
      "addressTitle": "Address",
      "contactTitle": "Contact",
      "hoursTitle": "Opening Hours",
      "hoursWeekday": "Mon - Fri: 10:00 am – 7:00 pm",
      "hoursWeekend": "Saturday & Sunday: Office closed",
      "virtualNote": "Virtual sessions are available outside of office hours"
    }
  }
};

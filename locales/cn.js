// cn locale (빈 번역 — 편집 모드에서 채움)
import { buildContactFormMessages, registerContactFormLocale } from "../lib/contact-form-schema.ts";
import { contactFormLocaleCn } from "../lib/contact-form-locale/cn.js";
import { serviceAreasSectionsCn } from "./content/service-areas.cn.js";
import { servicesSectionsCn } from "./content/services.cn.js";

registerContactFormLocale("cn", contactFormLocaleCn);
const contactFormMessages = buildContactFormMessages("cn");

export default {
  "common": {
    "siteName": "",
    "logoAlt": "",
    "scheduleConsultation": "",
    "topOfSite": "",
    "send": "",
    "back": "",
    "continue": "",
    "payNow": "",
    "comingSoon": "",
    "settings": "",
    "close": ""
  },
  "nav": {
    "about": "",
    "whoWeAre": "",
    "ourVision": "",
    "services": "",
    "typesOfServices": "",
    "serviceAreas": "",
    "gettingStarted": "",
    "fee": "",
    "feePage": "",
    "onlinePayment": "",
    "contact": "",
    "koreaCenter": "",
    "philippinesCenter": "",
    "therapists": "",
    "menu": ""
  },
  "therapists": {
    "list": {
      "pageTitle": "",
      "breadcrumb": ""
    }
  },
  "theme": {
    "system": "",
    "light": "",
    "dark": ""
  },
  "contactInfo": {
    "email": "",
    "address": "",
    "tel": ""
  },
  "siteContact": {
    "email": "hsj6831@gmail.com",
    "korea": {
      "address":
        "81-1, Jinsaegol-gil, Chowol-eup, Gwangju-si, Gyeonggi-do, Republic of Korea"
    },
    "philippines": {
      "addressShort":
        "Abby's Apartelle, B10 L3 Unit C, Elvira St, Josefa Subd. Malabanias, Angeles",
      "addressFull":
        "McArthur Highway, Brgy. Camachiles, Skytech IT Park Building A, Mabalacat, Pampanga, 2010",
      "phone": "+63 952 479 1119",
      "phoneViber": "+63 952 479 1119 (Viber)"
    }
  },
  "footer": {
    "brand": "",
    "menu": "",
    "contact": "",
    "hoursWeekday": "",
    "hoursWeekend": "",
    "virtualNote": "",
    "virtualNotePh": ""
  },
  "pages": {
    "whoWeAre": {
      "title": "",
      "paragraphs": [
        "",
        "",
        "",
        "",
        "",
        ""
      ]
    },
    "ourVision": {
      "title": "",
      "paragraphs": [
        "",
        "",
        "",
        ""
      ]
    },
    "gettingStarted": {
      "title": "",
      "body": {
        "flow": [],
        "paragraphs": []
      },
      "steps": [
        {
          "number": "",
          "title": "",
          "description": ""
        },
        {
          "number": "",
          "title": "",
          "description": ""
        },
        {
          "number": "",
          "title": "",
          "description": ""
        },
        {
          "number": "",
          "title": "",
          "description": ""
        },
        {
          "number": "",
          "title": "",
          "description": ""
        },
        {
          "number": "",
          "title": "",
          "description": ""
        }
      ]
    },
    "fee": {
      "title": "费用",
      "paragraphs": [
        "**我们提供直接计费服务！**",
        "大多数客户使用保险支付咨询费用，我们接受主要国际保险。我们了解保险流程可能令人困惑且复杂，但请放心，我们随时为您提供帮助！我们提供直接计费服务，这意味着我们将负责提交理赔及其他繁琐事务，让您可以安心接受咨询，无需为琐事烦恼。",
        "**没有保险计划？**",
        "**请联系我们。** 我们将告知您其他选择并相应协助您。请注意，韩国健康保险不涵盖心理健康服务。",
        "我们接受主要国际保险"
      ]
    },
    "thankYou": {
      "title": "",
      "paragraphs": [
        "",
        ""
      ]
    },
    "paymentSuccess": {
      "title": "",
      "paragraphs": [
        ""
      ]
    },
    "notFound": {
      "title": "",
      "description": "",
      "linksHeading": "",
      "homeLink": "",
      "homeCta": ""
    }
  },
  "services": {
    "pageTitle": "",
    "sidebar": {
      "top": "",
      "individual": "",
      "couples": "",
      "family": "",
      "play": "",
      "group": "",
      "christian": ""
    },
    "sections": servicesSectionsCn
  },
  "serviceAreas": {
    "pageTitle": "",
    "sidebar": {
      "top": "",
      "depression": "",
      "traumaPtsd": "",
      "anxietyPanic": "",
      "suicidalThoughts": "",
      "culturalIdentity": "",
      "bipolar": "",
      "adhd": "",
      "relationship": "",
      "ocd": "",
      "eatingDisorders": "",
      "asd": "",
      "lifeStress": "",
      "griefLoss": "",
      "sleep": ""
    },
    "sections": serviceAreasSectionsCn
  },
  "contact": {
    "title": "",
    "centerToggleLabel": "",
    "centerKorea": "",
    "centerPhilippines": "",
    "mapTitleKorea": "",
    "mapTitlePhilippines": "",
    "form": contactFormMessages.form,
    "insuranceOptions": contactFormMessages.insuranceOptions,
    "seekingHelpOptions": contactFormMessages.seekingHelpOptions,
    "korea": {
      "body": {
        "flow": [],
        "paragraphs": []
      },
      "addressTitle": "",
      "contactTitle": "",
      "hoursTitle": "",
      "hoursWeekday": "",
      "hoursWeekend": "",
      "virtualNote": ""
    },
    "philippines": {
      "body": {
        "flow": [],
        "paragraphs": []
      },
      "addressTitle": "",
      "contactTitle": "",
      "hoursTitle": "",
      "hoursWeekday": "",
      "hoursWeekend": "",
      "virtualNote": ""
    }
  },
  "payment": {
    "pageTitle": "",
    "checkoutTitle": "",
    "stepDetails": "",
    "stepPayment": "",
    "products": {
      "individualSessionDbq": {
        "label": ""
      }
    },
    "fields": {
      "email": "",
      "lastName": "",
      "firstName": "",
      "country": "",
      "phone": ""
    },
    "continue": "",
    "payNow": "",
    "back": "",
    "paypalNotice": "",
    "sslBadge": "",
    "startPayment": "",
    "providers": {
      "paypal": "",
      "stripe": "",
      "toss": ""
    }
  }
};

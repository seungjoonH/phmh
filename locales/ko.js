// 한국어 locale
import { buildContactFormMessages } from "../lib/contact-form-schema.ts";
import { serviceAreasSectionsKo } from "./content/service-areas.ko.js";
import { servicesSectionsKo } from "./content/services.ko.js";

const contactFormMessages = buildContactFormMessages("ko");

export default {
  "common": {
    "siteName": "PHMH",
    "logoAlt": "Peace & Hope 정신건강 서비스",
    "scheduleConsultation": "상담 예약하기",
    "topOfSite": "페이지 상단",
    "send": "전송",
    "back": "뒤로",
    "continue": "다음",
    "payNow": "결제하기",
    "comingSoon": "준비 중",
    "settings": "설정",
    "close": "닫기"
  },
  "nav": {
    "about": "소개",
    "whoWeAre": "회사 소개",
    "ourVision": "우리의 비전",
    "services": "서비스",
    "typesOfServices": "서비스 유형",
    "serviceAreas": "서비스 분야",
    "gettingStarted": "시작하기",
    "fee": "비용",
    "center": "센터",
    "contact": "문의하기",
    "koreaCenter": "한국 센터",
    "philippinesCenter": "필리핀 센터",
    "therapists": "상담사",
    "menu": "메뉴"
  },
  "therapists": {
    "list": {
      "pageTitle": "상담사",
      "breadcrumb": "상담사"
    }
  },
  "centers": {
    "list": {
      "pageTitle": "센터",
      "intro": "대면 상담을 받을 수 있는 센터와 현지 공간을 확인하세요.",
      "viewCenter": "센터 보기"
    }
  },
  "theme": {
    "system": "시스템",
    "light": "라이트",
    "dark": "다크"
  },
  "contactInfo": {
    "email": "이메일",
    "address": "주소",
    "tel": "전화"
  },
  "siteContact": {
    "email": "hsj6831@gmail.com",
    "korea": {
      "address": "경기도 광주시 초월읍 진새골길 81-1",
      "phone": "",
      "email": "hsj6831@gmail.com"
    },
    "philippines": {
      "addressShort":
        "McArthur Highway, Brgy. Camachiles, Skytech IT Park Building A, Mabalacat, Pampanga, 2010",
      "addressFull":
        "McArthur Highway, Brgy. Camachiles, Skytech IT Park Building A, Mabalacat, Pampanga, 2010",
      "phone": "+63 952 479 1119",
      "phoneViber": "+63 952 479 1119 (Viber)",
      "email": "hsj6831@gmail.com"
    }
  },
  "footer": {
    "brand": "Peace & Hope 정신건강 서비스",
    "menu": "메뉴",
    "contact": "문의",
    "hoursWeekday": "월 - 금: 오전 10:00 – 오후 7:00",
    "hoursWeekend": "토요일 및 일요일: 휴무",
    "virtualNote": "화상 상담 가능",
    "virtualNotePh": "진료 시간 외 화상 상담 가능"
  },
  "pages": {
    "whoWeAre": {
      "title": "저희는 누구인가요",
      "paragraphs": [
    "도움이 필요하시면 언제든지 말씀해 주세요."
  ],
      "flowText": {
        "mpuvilgj6": {
          "p": "대면 및 온라인 상담을 모두 제공합니다. 전 세계 어디서나 연결하실 수 있으며, 센터 방문 또는 집에서의 상담 모두 비밀이 보장되는 안전한 환경에서 진행됩니다."
        },
        "mpuvimpf7": { "heading": "" },
        "mpuvinp28": { "heading": "" },
        "mpuxksaf1": {
          "p": "상담 시작에 대해 궁금하신 점이 있으시면 언제든지 문의해 주시기 바랍니다. 가장 어려운 순간에도 희망은 있습니다. PHMH가 함께하겠습니다."
        },
        "mpuxmlbl1": {
          "p": "살면서 누구나 경험·배경·성격에 따라 심리적 어려움을 겪을 수 있습니다. 힘들어하고 계시다면 혼자가 아니십니다. 전문적인 지원을 구하는 것은 치유와 성장을 위한 용기 있는 첫걸음입니다."
        },
        "mpuxn57c2": {
          "p": "Peace & Hope Mental Health Services(PHMH)는 균형을 되찾고 웰빙을 높이며 일상으로 돌아가실 수 있도록 돕습니다. 증상 완화를 넘어 강점을 인식하고 의미와 목적을 발견하며 성장 잠재력을 키우는 데 초점을 둡니다."
        },
        "mpuxn6ci3": { "heading": "" },
        "mpuxp7l48": { "heading": "" }
      },
      "lists": [],
      "flow": [
        { type: "p", textKey: "pages.whoWeAre.flowText.mpuxmlbl1.p" },
        { type: "p", textKey: "pages.whoWeAre.flowText.mpuxn57c2.p" }
      ]
    },
    





    "ourVision": {
      "title": "우리의 비전",
      "paragraphs": [
    "혁신적인 발명이나 역사에 길이 남을 업적으로 세상에 영향을 미치고자 하는 사람들이 많습니다. 그런 노력은 분명 가치 있는 일입니다. 그러나 저희는 조금 다른 방식을 믿습니다—작지만, 깊이 있는 변화를 만드는 방식을요.",
    "수십억 명이 사는 세상에서 단 한 사람의 삶을 바꾸는 일은 미미해 보일 수 있습니다. 대부분의 사람들은 그 변화를 알아채지 못할지도 모릅니다. 하지만 그 한 사람에게는 삶을 바꾸는 일이 될 수 있습니다. 그리고 그 영향은 거기서 멈추지 않습니다. 한 사람이 변화를 경험하면, 그 파장은 주변의 소중한 사람들에게, 나아가 더 넓은 세상으로 퍼져 나갑니다.",
    "Peace & Hope 정신건강 서비스는 한 사람이 어려움을 극복하고, 자신감을 되찾으며, 의미 있는 삶을 만들어 가도록 돕는 것이 세상을 변화시키는 첫걸음이라 믿습니다. 저희 전문가들의 헌신적인 노력을 통해, 내담자들은 치유하고 성장할 힘을 찾습니다. 그리고 그들이 빛을 발하면서, 주변 사람들에게도 같은 가능성을 전합니다.",
    "변화는 한 사람으로부터 시작됩니다. 한 명이 두 명이 되고, 두 명이 세 명이 됩니다. 한 걸음 한 걸음 나아갈수록 그 영향은 점점 커집니다. Peace & Hope 정신건강 서비스에서 변화의 여정은 이미 시작되었습니다. 우리는 함께 그 변화를 만들어 가고 있습니다."
  ]
    ,
      lists: [],
        "flowText": {
          "mq4tgoto1": {
            "p": "우리는 어떻게 세상을 변화시킬까요?"
          }
        },
      "flow": [
        { type: "p", textKey: "pages.ourVision.flowText.mq4tgoto1.p" },
        { type: "p", textKey: "pages.ourVision.paragraphs.0" },
        { type: "p", textKey: "pages.ourVision.paragraphs.1" },
        { type: "p", textKey: "pages.ourVision.paragraphs.2" },
        { type: "p", textKey: "pages.ourVision.paragraphs.3" }
      ]
    },
    "gettingStarted": {
      "title": "시작하기",
      "body": {
        "flow": [],
        "paragraphs": []
      },
      "steps": [
    {
      number: "01",
      title: "알아보기",
      description: "저희의 철학과 접근 방식에 대해 알아보세요."
    },
    {
      number: "02",
      title: "문의하기",
      description: "궁금한 점이 있으면 문의하고 예약을 하세요."
    },
    {
      number: "03",
      title: "온라인 양식 작성",
      description: "첫 수업에 필수적인 사항입니다."
    },
    {
      number: "04",
      title: "초기 상담 참석",
      description: "치료 목표를 설정하세요."
    },
    {
      number: "05",
      title: "치료 시작",
      description: "전문가의 도움으로 치유를 향해 나아가세요."
    },
    {
      number: "06",
      title: "문제 해결",
      description: "문제를 해결하세요."
    }
  ]
    },
    "fee": {
      "title": "비용",
      "paragraphs": [
    "**직접 청구 서비스를 제공합니다!**",
    "대부분의 내담자분들은 보험을 통해 상담 비용을 처리하시며, 저희는 주요 국제 보험을 수락하고 있습니다. 보험 처리 과정이 복잡하고 어렵게 느껴지실 수 있다는 점 잘 알고 있습니다. 걱정하지 마세요, 저희가 도와드리겠습니다! 저희는 직접 청구 서비스를 제공하여 보험 청구 및 관련 절차를 저희가 대신 처리해 드립니다. 복잡한 일들은 저희에게 맡기고, 상담에만 집중하세요.",
    "**보험 플랜이 없으신가요?**",
    "**문의해 주세요.** 다른 결제 방법에 대해서도 안내해 드리며, 상황에 맞게 도움을 드리겠습니다. 단, 한국 건강보험은 정신건강 서비스를 보장하지 않는다는 점 참고해 주시기 바랍니다.",
    "주요 국제 보험을 수락하고 있습니다"
  ]
    },
    "thankYou": {
      "title": "감사합니다",
      "paragraphs": [
        "메시지가 잘 접수되었습니다. Peace & Hope 정신건강 서비스에 연락해 주셔서 감사합니다.",
        "담당 팀이 문의 내용을 검토한 후 최대한 빠르게 답변드리겠습니다."
      ]
    },
    "paymentSuccess": {
      "title": "결제가 완료되었습니다",
      "paragraphs": [
        "결제해 주셔서 감사합니다. 상담 또는 영수증 관련 문의 사항이 있으시면 저희에게 연락해 주세요."
      ]
    },
    "notFound": {
      "title": "페이지를 찾을 수 없습니다",
      "description": "요청하신 페이지가 존재하지 않거나 주소가 변경되었을 수 있습니다.",
      "linksHeading": "바로가기",
      "homeLink": "홈",
      "homeCta": "홈으로 돌아가기"
    }
  },
  "services": {
    "pageTitle": "서비스 안내",
    "sidebar": {
      "top": "페이지 상단"
    },
    "sectionOrder": [
      "individual",
      "couples",
      "family",
      "play",
      "group",
      "christian"
    ],
    "sections": servicesSectionsKo,
  },
  "serviceAreas": {
    "pageTitle": "서비스 분야",
    "sidebar": {
      "top": "페이지 상단"
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
    "sections": serviceAreasSectionsKo,
  },
  "contact": {
    "title": "문의하기",
    "centerToggleLabel": "센터 선택",
    "centerKorea": "한국",
    "centerPhilippines": "필리핀",
    "mapTitleKorea": "한국 센터 위치 지도",
    "mapTitlePhilippines": "필리핀 센터 위치 지도",
    "form": contactFormMessages.form,
    "insuranceOptions": contactFormMessages.insuranceOptions,
    "seekingHelpOptions": contactFormMessages.seekingHelpOptions,
    "korea": {
      "body": {
        "flow": [],
        "paragraphs": []
      },
      "addressTitle": "주소",
      "contactTitle": "연락처",
      "hoursTitle": "운영 시간",
      "hoursWeekday": "월 - 금 오전 10:00 – 오후 7:00",
      "hoursWeekend": "토요일 및 일요일 휴무",
      "virtualNote": "화상 상담 가능"
    },
    "philippines": {
      "body": {
        "flow": [],
        "paragraphs": []
      },
      "addressTitle": "주소",
      "contactTitle": "연락처",
      "hoursTitle": "운영 시간",
      "hoursWeekday": "월 - 금: 오전 10:00 – 오후 7:00",
      "hoursWeekend": "토요일 및 일요일: 휴무",
      "virtualNote": "화상 상담 가능"
    }
  }
};

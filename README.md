# PHMH — Peace & Hope Mental Health Services

정적 Next.js 사이트 (M1–M4). 상세 기획: [`docs/design.md`](docs/design.md).

## 로컬 개발

```bash
npm install
npm run dev
```

## 빌드·검증

```bash
npm run scrape              # Wix → scripts/output/scraped-en.json
node scripts/build-locales-from-scrape.mjs
node scripts/build-ko-locale.mjs
npm run build               # out/ 생성
npm run test:locale
npm run lint
```

Preview 정적 산출물:

```bash
npx serve out
```

## 환경 변수

`.env.example` 참고.

| 변수 | 용도 |
|------|------|
| (없음) | Contact Formspree ID는 `lib/config.ts` → `siteConfig.formspree` |

## 배포 (운영자)

1. GitHub에 push
2. [Cloudflare Pages](https://pages.cloudflare.com/) — Build: `npm run build`, Output: `out`
3. `public/_redirects` 로 구 Wix 경로 301
4. Formspree 계정 + `info@` 수신 설정 (M5)
5. `phmhservices.com` DNS 연결 (M5)

## 이미지 교체

`public/services/`, `public/service-areas/`, `public/logo.png` 등 **동일 경로·파일명**으로 교체하면 됩니다.

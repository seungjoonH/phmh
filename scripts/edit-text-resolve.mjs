// locale 키 → 패치 대상 파일·export·내부 경로
import * as fs from "fs";
import * as path from "path";

/**
 * @param {string} locale
 */
function contactExportName(locale) {
  return `contactFormLocale${locale.charAt(0).toUpperCase()}${locale.slice(1)}`;
}

/**
 * @param {"services"|"serviceAreas"} domain
 * @param {string} locale
 */
function contentSectionExport(domain, locale) {
  const cap = locale.charAt(0).toUpperCase() + locale.slice(1);
  return domain === "services" ? `servicesSections${cap}` : `serviceAreasSections${cap}`;
}

/**
 * @param {"services"|"serviceAreas"} domain
 */
function contentDomainFile(domain) {
  return domain === "services" ? "services" : "service-areas";
}

/**
 * @param {string} keyPath
 */
export function resolveTextTarget(keyPath) {
  if (keyPath.startsWith("services.sections.")) {
    return {
      kind: "content",
      domain: "services",
      innerPath: keyPath.slice("services.sections.".length),
    };
  }
  if (keyPath.startsWith("serviceAreas.sections.")) {
    return {
      kind: "content",
      domain: "serviceAreas",
      innerPath: keyPath.slice("serviceAreas.sections.".length),
    };
  }
  if (keyPath.startsWith("contactForm.")) {
    return {
      kind: "contact",
      innerPath: keyPath.slice("contactForm.".length),
    };
  }
  return { kind: "main", innerPath: keyPath };
}

/**
 * @param {string} root
 * @param {string} locale
 * @param {ReturnType<typeof resolveTextTarget>} target
 */
function resolveContentLocaleFile(root, locale, target) {
  const domainFile = contentDomainFile(target.domain);
  const contentPath = path.join(root, `locales/content/${domainFile}.${locale}.js`);
  if (fs.existsSync(contentPath)) {
    return {
      file: contentPath,
      exportName: contentSectionExport(target.domain, locale),
      patchPath: target.innerPath,
    };
  }
  const mainPath =
    target.domain === "services"
      ? `services.sections.${target.innerPath}`
      : `serviceAreas.sections.${target.innerPath}`;
  return {
    file: path.join(root, `locales/${locale}.js`),
    exportName: "default",
    patchPath: mainPath,
  };
}

/**
 * @param {string} root
 * @param {string} locale
 * @param {ReturnType<typeof resolveTextTarget>} target
 */
export function getTextLocaleFile(root, locale, target) {
  if (target.kind === "content") {
    return resolveContentLocaleFile(root, locale, target);
  }
  if (target.kind === "contact") {
    return {
      file: path.join(root, `lib/contact-form-locale/${locale}.js`),
      exportName: contactExportName(locale),
      patchPath: target.innerPath,
    };
  }
  return {
    file: path.join(root, `locales/${locale}.js`),
    exportName: "default",
    patchPath: target.innerPath,
  };
}

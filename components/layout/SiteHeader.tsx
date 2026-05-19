"use client";

// 글로벌 헤더·내비게이션
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { useEditDraftOptional } from "@/components/edit/EditDraftProvider";
import { EditableNavLabel } from "@/components/edit/EditableNavLabel";
import { useEditImageSrc } from "@/components/edit/useEditImageSrc";
import { editImageAttrs, editTextAttrs } from "@/lib/edit/attrs";
import { isEditMode } from "@/lib/edit/env";
import { getNavigation, type NavItem } from "@/lib/navigation";
import { siteAssets } from "@/lib/site-assets";
import { useLocale, useTranslations } from "@/components/i18n/LocaleProvider";
import { SettingsModal } from "@/components/settings/SettingsModal";
import {
  accordionPanel,
  dropdownPanel,
  duration,
  mobileMenuPanel,
  motionTransition,
} from "@/lib/motion";

const navLinkClass =
  "interactive-link cursor-pointer text-base font-medium tracking-wide text-secondary whitespace-nowrap";

function isCurrentNavPath(pathname: string, href: string) {
  return pathname === href.split("#")[0];
}

function NavAnchor({
  href,
  className,
  children,
  onClick,
  role,
}: {
  href: string;
  className: string;
  children: React.ReactNode;
  onClick?: () => void;
  role?: string;
}) {
  const pathname = usePathname();

  if (isCurrentNavPath(pathname, href)) {
    return (
      <span
        className={className}
        aria-current="page"
        role={role}
        onClick={onClick}
      >
        {children}
      </span>
    );
  }

  return (
    <Link href={href} className={className} onClick={onClick} role={role}>
      {children}
    </Link>
  );
}

type LogoImageKey = "site.logo" | "site.logoLight";

function EditableLogoImage({
  editKey,
  src,
  alt,
  className,
}: {
  editKey: LogoImageKey;
  src: string;
  alt: string;
  className: string;
}) {
  const edit = isEditMode();
  const editCtx = useEditDraftOptional();

  if (!edit) {
    return (
      <Image
        src={src}
        alt={alt}
        width={600}
        height={212}
        className={className}
        priority
      />
    );
  }

  return (
    <span
      role="button"
      tabIndex={0}
      className={`inline-block cursor-pointer ${className}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          editCtx?.openImageEditor(editKey);
        }
      }}
      title="길게 눌러 로고 이미지 편집"
      {...editImageAttrs(editKey)}
    >
      <Image
        src={src}
        alt={alt}
        width={600}
        height={212}
        className={className}
        priority
        unoptimized
        draggable={false}
      />
    </span>
  );
}

function HeaderLogo({ alt }: { alt: string }) {
  const logoSrc = useEditImageSrc("site.logo", siteAssets.logo);
  const logoLightSrc = useEditImageSrc("site.logoLight", siteAssets.logoLight);

  return (
    <>
      <EditableLogoImage
        editKey="site.logo"
        src={logoSrc}
        alt={alt}
        className="h-10 w-auto md:h-12 dark:hidden"
      />
      <EditableLogoImage
        editKey="site.logoLight"
        src={logoLightSrc}
        alt={alt}
        className="hidden h-10 w-auto md:h-12 dark:block"
      />
    </>
  );
}

export function SiteHeader() {
  const { locale } = useLocale();
  const t = useTranslations();
  const nav = getNavigation(locale);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const reduce = useReducedMotion();
  const edit = isEditMode();

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 w-full overflow-visible transition-colors duration-300 ease-calm ${
          mobileOpen ? "bg-page-bg" : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between overflow-visible px-6 py-6 md:py-8">
          <Link
            href="/about/who-we-are"
            className="interactive-link shrink-0"
            onClick={(e) => {
              if (edit) e.preventDefault();
            }}
          >
            <HeaderLogo alt={t("common.logoAlt")} />
          </Link>

          <nav
            className="hidden items-center gap-10 overflow-visible lg:flex xl:gap-12"
            aria-label="Main"
          >
            {nav.map((item) => (
              <DesktopNavItem key={item.labelKey} item={item} t={t} reduce={reduce} />
            ))}
            <motion.button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="interactive-button rounded p-2 text-secondary hover:bg-secondary/10"
              aria-label={t("common.settings")}
              whileTap={reduce ? undefined : { scale: 0.94 }}
              {...(edit ? editTextAttrs("common.settings", { longPress: true }) : {})}
            >
              <SettingsIcon />
            </motion.button>
          </nav>

          <div className="flex items-center gap-2 lg:hidden">
            <motion.button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="interactive-button rounded p-2 text-secondary"
              aria-label={t("common.settings")}
              whileTap={reduce ? undefined : { scale: 0.94 }}
              {...(edit ? editTextAttrs("common.settings", { longPress: true }) : {})}
            >
              <SettingsIcon />
            </motion.button>
            <motion.button
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              className="interactive-button rounded p-2 text-secondary"
              aria-expanded={mobileOpen}
              aria-label="Menu"
              whileTap={reduce ? undefined : { scale: 0.94 }}
            >
              <span className="block h-0.5 w-6 bg-secondary transition-transform duration-300 ease-calm" />
              <span className="mt-1.5 block h-0.5 w-6 bg-secondary transition-transform duration-300 ease-calm" />
              <span className="mt-1.5 block h-0.5 w-6 bg-secondary transition-transform duration-300 ease-calm" />
            </motion.button>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              key="mobile-nav"
              className="overflow-hidden border-t border-page-body/10 bg-page-bg lg:hidden"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={mobileMenuPanel}
              transition={motionTransition(reduce, { duration: duration.fast })}
            >
              <div className="px-6 pb-6 pt-2">
                {nav.map((item) => (
                  <MobileNavItem
                    key={item.labelKey}
                    item={item}
                    t={t}
                    reduce={reduce}
                    onNavigate={() => setMobileOpen(false)}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}

function DesktopNavItem({
  item,
  t,
  reduce,
}: {
  item: NavItem;
  t: (k: string) => string;
  reduce: boolean | null;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (!item.children) {
    return (
      <NavAnchor href={item.href} className={navLinkClass}>
        <EditableNavLabel labelKey={item.labelKey}>{t(item.labelKey)}</EditableNavLabel>
      </NavAnchor>
    );
  }

  return (
    <div
      className="relative inline-block cursor-pointer"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <NavAnchor
        href={item.href}
        className={navLinkClass}
        onClick={() => setOpen(false)}
      >
        <EditableNavLabel labelKey={item.labelKey}>{t(item.labelKey)}</EditableNavLabel>
      </NavAnchor>
      <div
        className="absolute inset-x-0 top-full z-50 flex cursor-pointer flex-col items-center pt-3"
        aria-hidden={!open}
      >
        <AnimatePresence>
          {open && (
            <motion.div
              role="menu"
              className="nav-dropdown-panel flex w-max flex-col items-stretch gap-2 whitespace-nowrap"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={dropdownPanel}
              transition={motionTransition(reduce, { duration: duration.fast })}
            >
              {item.children.map((child) => (
                <NavAnchor
                  key={child.href}
                  href={child.href}
                  role="menuitem"
                  className={`${navLinkClass} block w-full text-center`}
                  onClick={() => setOpen(false)}
                >
                  <EditableNavLabel labelKey={child.labelKey}>
                    {t(child.labelKey)}
                  </EditableNavLabel>
                </NavAnchor>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function MobileNavItem({
  item,
  t,
  reduce,
  onNavigate,
}: {
  item: NavItem;
  t: (k: string) => string;
  reduce: boolean | null;
  onNavigate: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-page-body/10 py-3">
      {item.children ? (
        <>
          <motion.button
            type="button"
            className="interactive-button flex w-full justify-between text-base text-secondary"
            onClick={() => setOpen((o) => !o)}
            whileTap={reduce ? undefined : { scale: 0.99 }}
          >
            <EditableNavLabel labelKey={item.labelKey}>{t(item.labelKey)}</EditableNavLabel>
            <motion.span
              key={open ? "open" : "closed"}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={motionTransition(reduce, { duration: duration.fast })}
            >
              {open ? "−" : "+"}
            </motion.span>
          </motion.button>
          <AnimatePresence initial={false}>
            {open && (
              <motion.div
                className="overflow-hidden"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={accordionPanel}
                transition={motionTransition(reduce, { duration: duration.fast })}
              >
                <div className="mt-2 space-y-2 pl-4">
                  {item.children.map((child) => (
                    <NavAnchor
                      key={child.href}
                      href={child.href}
                      onClick={onNavigate}
                      className="interactive-link block text-base"
                    >
                      <EditableNavLabel labelKey={child.labelKey}>
                        {t(child.labelKey)}
                      </EditableNavLabel>
                    </NavAnchor>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      ) : (
        <NavAnchor
          href={item.href}
          onClick={onNavigate}
          className="interactive-link text-base text-secondary"
        >
          <EditableNavLabel labelKey={item.labelKey}>{t(item.labelKey)}</EditableNavLabel>
        </NavAnchor>
      )}
    </div>
  );
}

function SettingsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 15a3 3 0 100-6 3 3 0 000 6z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}
// Contact 센터 Google Maps iframe embed URL
import type { ContactCenter } from "@/components/contact/ContactCenterToggle";
import type { Messages } from "@/lib/i18n/messages";
import { siteContactKoreaAddress } from "@/lib/site-contact";

/** Abby's Apartelle — 공식 Google Maps 장소 */
export const PHILIPPINES_MAP_PLACE_URL =
  "https://www.google.com/maps/place/Abby's+Apartelle/@15.1614847,120.5822805,17z/data=!3m1!4b1!4m6!3m5!1s0x3396f3623a4db7f5:0xc266f2a73fa9f2e6!8m2!3d15.1614847!4d120.5822805!16s%2Fg%2F11rpd94t6n?hl=en-US&entry=ttu";

const PHILIPPINES_MAP_LAT = 15.1614847;
const PHILIPPINES_MAP_LNG = 120.5822805;
const PHILIPPINES_MAP_ZOOM = 17;

export function buildGoogleMapsEmbedSrc(address: string): string {
  const q = encodeURIComponent(address.trim());
  return `https://www.google.com/maps?q=${q}&output=embed`;
}

export function getPhilippinesMapEmbedSrc(): string {
  return `https://www.google.com/maps?q=${PHILIPPINES_MAP_LAT},${PHILIPPINES_MAP_LNG}&z=${PHILIPPINES_MAP_ZOOM}&hl=en&output=embed`;
}

export function getContactMapEmbedSrc(
  center: ContactCenter,
  messages: Messages,
): string {
  if (center === "philippines") return getPhilippinesMapEmbedSrc();
  return buildGoogleMapsEmbedSrc(siteContactKoreaAddress(messages));
}

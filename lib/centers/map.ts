// Center mapRef를 Google Maps embed URL로 변환
import { getContactMapEmbedSrc } from "@/lib/contact-map-embed";
import type { Messages } from "@/lib/i18n/messages";
import { buildGoogleMapsEmbedSrc } from "@/lib/contact-map-embed";
import { getCenterContactDetails } from "@/lib/centers/contact";

export function getCenterMapEmbedSrc(mapRef: string, messages: Messages): string {
  if (mapRef === "korea" || mapRef === "philippines") {
    return getContactMapEmbedSrc(mapRef, messages);
  }
  const address = getCenterContactDetails(mapRef, messages).address;
  return address.trim() ? buildGoogleMapsEmbedSrc(address) : "";
}

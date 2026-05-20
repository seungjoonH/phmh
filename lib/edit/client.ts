// edit-server HTTP 클라이언트 (저장 시에만 호출)
import type {
  ContactFieldDefinition,
  ContactLayoutItem,
} from "@/lib/contact-form-schema";
import { EDIT_MODE_HEADER, EDIT_SERVER_URL } from "@/lib/edit/env";

async function editFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${EDIT_SERVER_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      [EDIT_MODE_HEADER]: "1",
      ...init?.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : `Edit server error ${res.status}`,
    );
  }
  return data;
}

export type LocaleTextValues = Record<string, string>;

export type LocaleStringArrays = Record<string, string[]>;

export type GettingStartedStepPayload = {
  number: string;
  title: string;
  description: string;
};

export type LocaleStepsArrays = Record<string, GettingStartedStepPayload[]>;

export type LocaleManifestPayload = {
  order: string[];
  hidden: string[];
};

export async function fetchTextRegistry(key: string): Promise<LocaleTextValues> {
  const data = await editFetch(`/registry/text/${encodeURIComponent(key)}`);
  return data.locales as LocaleTextValues;
}

export async function patchText(key: string, locales: LocaleTextValues) {
  return editFetch("/patch/text", {
    method: "POST",
    body: JSON.stringify({ key, locales }),
  });
}

export async function fetchArrayRegistry(key: string): Promise<LocaleStringArrays> {
  const data = await editFetch(`/registry/array/${encodeURIComponent(key)}`);
  return data.locales as LocaleStringArrays;
}

export async function patchStringArray(key: string, locales: LocaleStringArrays) {
  return editFetch("/patch/array", {
    method: "POST",
    body: JSON.stringify({ key, locales }),
  });
}

export async function fetchStepsRegistry(key: string): Promise<LocaleStepsArrays> {
  const data = await editFetch(`/registry/steps/${encodeURIComponent(key)}`);
  return data.locales as LocaleStepsArrays;
}

export async function patchStepsArray(key: string, locales: LocaleStepsArrays) {
  return editFetch("/patch/steps-array", {
    method: "POST",
    body: JSON.stringify({ key, locales }),
  });
}

export type StoredFlowBlock =
  | { type: "p"; textKey: string }
  | { type: "heading"; textKey: string }
  | { type: "bullets"; listKey: string; lead?: string }
  | { type: "hr" }
  | { type: "button"; textKey: string }
  | { type: "img"; editKey: string; src: string };

export async function patchSectionFlow(sectionKey: string, flow: StoredFlowBlock[]) {
  return editFetch("/patch/section-flow", {
    method: "POST",
    body: JSON.stringify({ sectionKey, flow }),
  });
}

export async function fetchLocaleManifest(): Promise<LocaleManifestPayload> {
  return editFetch("/registry/locales/manifest");
}

export async function patchLocaleManifest(manifest: LocaleManifestPayload) {
  return editFetch("/patch/locales/manifest", {
    method: "POST",
    body: JSON.stringify(manifest),
  });
}

export type ContactFormStructurePayload = {
  fields: ContactFieldDefinition[];
  layout: ContactLayoutItem[];
};

export async function fetchContactFormStructure(): Promise<ContactFormStructurePayload> {
  return editFetch("/registry/contact-form/structure");
}

export async function patchContactFormStructure(structure: ContactFormStructurePayload) {
  return editFetch("/patch/contact-form/structure", {
    method: "POST",
    body: JSON.stringify(structure),
  });
}

export async function addContactFormField(
  field: ContactFormStructurePayload["fields"][number],
  layout?: ContactFormStructurePayload["layout"],
) {
  return editFetch("/contact-form/fields/add", {
    method: "POST",
    body: JSON.stringify({ field, layout }),
  }) as Promise<{ ok: boolean; structure: ContactFormStructurePayload }>;
}

export async function removeContactFormField(
  fieldId: string,
  layout?: ContactFormStructurePayload["layout"],
) {
  return editFetch("/contact-form/fields/remove", {
    method: "POST",
    body: JSON.stringify({ fieldId, layout }),
  }) as Promise<{ ok: boolean; structure: ContactFormStructurePayload }>;
}

export async function createLocale(id: string) {
  return editFetch("/locales/create", {
    method: "POST",
    body: JSON.stringify({ id }),
  }) as Promise<{ ok: boolean; manifest: LocaleManifestPayload }>;
}

export type LocaleCatalogPayload = {
  messages: Record<string, unknown>;
  contact: Record<string, unknown>;
};

export async function fetchLocaleCatalog(id: string): Promise<LocaleCatalogPayload> {
  return editFetch(`/registry/locales/${encodeURIComponent(id)}/catalog`);
}

export async function fetchGitStatus(): Promise<string> {
  const data = await editFetch("/git/status");
  return data.summary as string;
}

export type DeployReleaseResult = {
  ok: boolean;
  previousVersion: string;
  version: string;
  commitMessage: string;
};

export async function deployRelease(): Promise<DeployReleaseResult> {
  return editFetch("/git/deploy", { method: "POST" }) as Promise<DeployReleaseResult>;
}

export async function fetchImageRegistry(key: string) {
  const data = await editFetch(`/registry/image/${encodeURIComponent(key)}`);
  return data as { key: string; file: string; publicPath: string; altKey?: string };
}

import type { TherapistRecord } from "@/lib/therapists/types";

export async function fetchTherapistsManifest() {
  return editFetch("/registry/therapists");
}

export async function patchTherapist(slug: string, record: TherapistRecord) {
  return editFetch("/patch/therapist", {
    method: "POST",
    body: JSON.stringify({ slug, record }),
  });
}

export async function renameTherapist(
  oldSlug: string,
  newSlug: string,
  record: TherapistRecord,
) {
  return editFetch("/therapists/rename", {
    method: "POST",
    body: JSON.stringify({ oldSlug, newSlug, record }),
  }) as Promise<{ ok: boolean; oldSlug: string; newSlug: string }>;
}

export async function createTherapist(displayName: string) {
  return editFetch("/therapists/create", {
    method: "POST",
    body: JSON.stringify({ displayName }),
  }) as Promise<{ ok: boolean; slug: string }>;
}

export async function deleteTherapist(slug: string) {
  return editFetch("/therapists/delete", {
    method: "POST",
    body: JSON.stringify({ slug }),
  });
}

export async function patchTherapistsOrder(order: string[]) {
  return editFetch("/therapists/manifest/order", {
    method: "PATCH",
    body: JSON.stringify({ order }),
  });
}

export async function fetchSitePagesRegistry() {
  return editFetch("/registry/site-pages") as Promise<{
    hidden: string[];
    therapistSlugs: string[];
  }>;
}

export async function patchSitePageVisibility(pageId: string, hidden: boolean) {
  return editFetch("/site-pages/visibility", {
    method: "PATCH",
    body: JSON.stringify({ pageId, hidden }),
  });
}

export async function putSitePagesVisibility(hidden: string[]) {
  return editFetch("/site-pages/visibility", {
    method: "PUT",
    body: JSON.stringify({ hidden }),
  }) as Promise<{ ok: boolean; hidden: string[] }>;
}

export async function writeImageFile(
  relativePath: string,
  contentBase64: string,
  mimeType: string,
) {
  return editFetch("/fs/write", {
    method: "POST",
    body: JSON.stringify({
      path: relativePath,
      content: contentBase64,
      encoding: "base64",
      mimeType,
      writeKind: "image",
    }),
  });
}

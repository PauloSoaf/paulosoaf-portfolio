/**
 * CONTRACTS ILUSTRATIVOS DE ESPECIFICAÇÃO — NÃO É IMPLEMENTAÇÃO DO REPOSITÓRIO.
 * Usar para orientar modelos/handlers; nomes e caminhos finais seguem a base real.
 */
export type WorkstationMode =
  | { kind: "boot" }
  | { kind: "desktop" }
  | { kind: "preview"; siteId: "nutriopus" | "deborah" }
  | { kind: "code"; componentId: string }
  | { kind: "focus-screen"; prior: "desktop" | "preview" | "code" }
  | { kind: "manipulate" }
  | { kind: "thrown"; impulse: readonly [number, number, number] }
  | { kind: "broken"; impactEnergy: number }
  | { kind: "fallback"; reason: "webgl" | "iframe" | "network" | "missing-code" };

export type WorkstationEvent =
  | { type: "READY" }
  | { type: "OPEN_SITE"; siteId: "nutriopus" | "deborah" }
  | { type: "INSPECT_COMPONENT"; componentId: string }
  | { type: "FOCUS_SCREEN" }
  | { type: "CLOSE_X" }
  | { type: "OPEN_LID"; angle: number }
  | { type: "CLOSE_LID" }
  | { type: "GRAB_CHASSIS" }
  | { type: "RELEASE_CHASSIS"; impulse: readonly [number, number, number] }
  | { type: "IMPACT"; energy: number }
  | { type: "RESTORE" }
  | { type: "FAIL"; reason: "webgl" | "iframe" | "network" | "missing-code" };

/** Não usar URL arbitrária vinda do usuário como src de iframe. */
export type VerifiedSite = {
  id: "nutriopus" | "deborah";
  configuredUrl: string;
  verifiedFinalUrl?: string;
  framePolicy: "unverified" | "allowed" | "denied";
  lastCheckedAt?: string;
  evidence?: string;
};

export const siteRegistry: Record<VerifiedSite["id"], VerifiedSite> = {
  nutriopus: {
    id: "nutriopus",
    configuredUrl: "https://www.nutriopus.com.br/",
    framePolicy: "unverified",
  },
  deborah: {
    id: "deborah",
    configuredUrl: "https://xn--advogadadborahlima-jwb.com.br/",
    framePolicy: "unverified",
  },
};

export type PortfolioCodeManifestItem = {
  componentId: string;
  sourcePath: `src/${string}`;
  gitSha: string;
  language: "tsx" | "ts" | "css" | "glsl";
  publicSnippetPath: string;
  /** Este manifest só contém fonte do próprio portfólio autorizada em build. */
  visibility: "portfolio-source-only";
};

/** Protocolo cooperativo: só funciona com listener implementado e autorizado NO SITE FILHO. */
export type CooperativeFrameMessage = {
  channel: "obsidian-workstation/v1";
  type: "SCROLL_BY";
  deltaY: number;
};

export function validateFrameMessage(
  event: MessageEvent,
  expectedOrigin: string,
  expectedWindow: Window | null,
): event is MessageEvent<CooperativeFrameMessage> {
  if (event.origin !== expectedOrigin || !expectedWindow || event.source !== expectedWindow) return false;
  const data: unknown = event.data;
  if (!data || typeof data !== "object") return false;
  const message = data as Record<string, unknown>;
  return message.channel === "obsidian-workstation/v1" && message.type === "SCROLL_BY" &&
    typeof message.deltaY === "number" && Number.isFinite(message.deltaY) && Math.abs(message.deltaY) <= 1200;
}

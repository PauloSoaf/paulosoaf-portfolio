import type { Locale } from "@/i18n/config";
import type { SectionId } from "@/i18n/paths";

/**
 * Curated terminal: a fixed command map parsed without shell expansion, eval or filesystem.
 * Commands are navigation of the page and the notebook, never a real system.
 */
export type TerminalEffect =
  | { type: "scroll"; section: SectionId | "top" }
  | { type: "theme" }
  | { type: "locale"; locale: Locale }
  | { type: "open"; app: "nutriopus" | "deborah" | "browser" | "notes" | "desktop" }
  | { type: "code"; file?: string }
  | { type: "notebook"; action: "hop" | "drop" | "spin" | "close-lid" | "reset" | "keyboard" }
  | { type: "inspect" } | { type: "clear" } | { type: "mute" } | { type: "focus" };
export type CommandResult = { output: string[]; effects: TerminalEffect[]; tone?: "error" | "joke" };

const MAX_INPUT = 160;
const text = {
  pt: {
    help: ["comandos:", "  projetos · sobre · especialidades · servicos · contato · topo", "  tema · idioma <pt|en|es> · som", "  abrir <nutriopus|deborah|browser|notas> · codigo [arquivo] · inspecionar", "  pular · cair · girar · fechar · teclado · reset · focar · limpar"],
    whoami: "paulo soaf · engenheiro full stack", going: (to: string) => `indo para ${to}…`, theme: "tema alternado.", locale: (to: string) => `trocando idioma para ${to}…`,
    opening: (to: string) => `abrindo ${to}…`, code: "abrindo o código do próprio portfólio…", inspect: "modo inspecionar: clique em um componente da página.",
    hop: "upa!", drop: "ops.", spin: "wheee!", close: "boa noite.", reset: "tudo no lugar.", keyboard: "alternando a visão do teclado.", mute: "som alternado.", focus: "tela em foco.",
    sudo: ["permissão negada.", "…mas o notebook levou um susto."], rm: ["boa tentativa.", "nada foi apagado — só a dignidade do notebook."],
    unknown: (name: string) => `comando não encontrado: ${name} · digite ajuda`, usage: (name: string) => `uso: ${name}`, ls: "apps/  secoes/  projetos/  codigo/",
  },
  en: {
    help: ["commands:", "  projects · about · expertise · services · contact · top", "  theme · lang <pt|en|es> · sound", "  open <nutriopus|deborah|browser|notes> · code [file] · inspect", "  jump · drop · spin · close · keyboard · reset · focus · clear"],
    whoami: "paulo soaf · full stack engineer", going: (to: string) => `going to ${to}…`, theme: "theme switched.", locale: (to: string) => `switching language to ${to}…`,
    opening: (to: string) => `opening ${to}…`, code: "opening this portfolio's own source…", inspect: "inspect mode: click a component on the page.",
    hop: "hop!", drop: "oops.", spin: "wheee!", close: "good night.", reset: "all back in place.", keyboard: "toggling the keyboard view.", mute: "sound toggled.", focus: "screen focused.",
    sudo: ["permission denied.", "…but the notebook got startled."], rm: ["nice try.", "nothing was deleted — except the notebook's dignity."],
    unknown: (name: string) => `command not found: ${name} · type help`, usage: (name: string) => `usage: ${name}`, ls: "apps/  sections/  projects/  code/",
  },
  es: {
    help: ["comandos:", "  proyectos · acerca · especialidades · servicios · contacto · inicio", "  tema · idioma <pt|en|es> · sonido", "  abrir <nutriopus|deborah|browser|notas> · codigo [archivo] · inspeccionar", "  saltar · caer · girar · cerrar · teclado · reset · enfocar · limpiar"],
    whoami: "paulo soaf · ingeniero full stack", going: (to: string) => `yendo a ${to}…`, theme: "tema cambiado.", locale: (to: string) => `cambiando idioma a ${to}…`,
    opening: (to: string) => `abriendo ${to}…`, code: "abriendo el código de este portafolio…", inspect: "modo inspeccionar: haz clic en un componente de la página.",
    hop: "¡hop!", drop: "uy.", spin: "¡wiii!", close: "buenas noches.", reset: "todo en su lugar.", keyboard: "alternando la vista del teclado.", mute: "sonido alternado.", focus: "pantalla enfocada.",
    sudo: ["permiso denegado.", "…pero el notebook se asustó."], rm: ["buen intento.", "nada fue borrado — solo la dignidad del notebook."],
    unknown: (name: string) => `comando no encontrado: ${name} · escribe ayuda`, usage: (name: string) => `uso: ${name}`, ls: "apps/  secciones/  proyectos/  codigo/",
  },
} satisfies Record<Locale, unknown>;

const sections: Record<string, SectionId | "top"> = {
  projetos: "work", projects: "work", proyectos: "work", work: "work",
  sobre: "about", about: "about", acerca: "about",
  especialidades: "expertise", expertise: "expertise",
  servicos: "services", serviços: "services", services: "services", servicios: "services",
  contato: "contact", contact: "contact", contacto: "contact",
  topo: "top", top: "top", inicio: "top", início: "top", home: "top",
};
const apps: Record<string, "nutriopus" | "deborah" | "browser" | "notes"> = {
  nutriopus: "nutriopus", deborah: "deborah", "deborah-lima": "deborah", browser: "browser", navegador: "browser", notas: "notes", notes: "notes",
};
const notebook: Record<string, "hop" | "drop" | "spin" | "close-lid" | "reset" | "keyboard"> = {
  pular: "hop", jump: "hop", saltar: "hop", cair: "drop", drop: "drop", caer: "drop", girar: "spin", spin: "spin",
  fechar: "close-lid", close: "close-lid", cerrar: "close-lid", reset: "reset", resetar: "reset", reiniciar: "reset", teclado: "keyboard", keyboard: "keyboard",
};

export function runCommand(raw: string, locale: Locale): CommandResult {
  const t = text[locale];
  const line = raw.slice(0, MAX_INPUT).trim();
  if (!line) return { output: [], effects: [] };
  const [rawName = "", ...args] = line.split(/\s+/);
  const name = rawName.toLowerCase().normalize("NFC");
  const argument = (args[0] ?? "").toLowerCase();
  if (["help", "ajuda", "ayuda", "?"].includes(name)) return { output: t.help, effects: [] };
  if (name === "whoami") return { output: [t.whoami], effects: [] };
  if (name === "ls") return { output: [t.ls], effects: [] };
  if (["clear", "limpar", "limpiar", "cls"].includes(name)) return { output: [], effects: [{ type: "clear" }] };
  if (["echo"].includes(name)) return { output: [args.join(" ").slice(0, 120)], effects: [] };
  if (["date", "data", "fecha"].includes(name)) return { output: [new Date().toLocaleString(locale === "pt" ? "pt-BR" : locale === "es" ? "es" : "en", { dateStyle: "full", timeStyle: "short" })], effects: [] };
  if (name === "sudo") return { output: t.sudo, effects: [{ type: "notebook", action: "hop" }], tone: "joke" };
  if (name === "rm") return { output: t.rm, effects: [{ type: "notebook", action: "drop" }], tone: "joke" };
  if (name === "exit" || name === "sair" || name === "salir") return { output: [], effects: [{ type: "open", app: "desktop" }] };
  if (Object.hasOwn(sections, name)) return { output: [t.going(name)], effects: [{ type: "scroll", section: sections[name]! }] };
  if (["tema", "theme"].includes(name)) return { output: [t.theme], effects: [{ type: "theme" }] };
  if (["som", "sound", "sonido", "mute", "mudo"].includes(name)) return { output: [t.mute], effects: [{ type: "mute" }] };
  if (["focar", "focus", "enfocar"].includes(name)) return { output: [t.focus], effects: [{ type: "focus" }] };
  if (["idioma", "lang", "language"].includes(name)) {
    if (argument !== "pt" && argument !== "en" && argument !== "es") return { output: [t.usage(`${name} pt|en|es`)], effects: [], tone: "error" };
    return { output: [t.locale(argument)], effects: [{ type: "locale", locale: argument }] };
  }
  if (["abrir", "open", "abre"].includes(name)) {
    if (["codigo", "código", "code"].includes(argument)) return { output: [t.code], effects: [{ type: "code" }] };
    const app = Object.hasOwn(apps, argument) ? apps[argument] : undefined;
    if (!app) return { output: [t.usage(`${name} nutriopus|deborah|browser|notas`)], effects: [], tone: "error" };
    return { output: [t.opening(argument)], effects: [{ type: "open", app }] };
  }
  if (["codigo", "código", "code", "cat"].includes(name)) return { output: [t.code], effects: [{ type: "code", ...(argument ? { file: argument.replace(/\.[a-z]+$/, "").replace(/[^a-z0-9-]/g, "-") } : {}) }] };
  if (["inspecionar", "inspect", "inspeccionar"].includes(name)) return { output: [t.inspect], effects: [{ type: "inspect" }] };
  if (Object.hasOwn(notebook, name)) {
    const action = notebook[name]!;
    const reply = { hop: t.hop, drop: t.drop, spin: t.spin, "close-lid": t.close, reset: t.reset, keyboard: t.keyboard }[action];
    return { output: [reply], effects: [{ type: "notebook", action }], tone: "joke" };
  }
  return { output: [t.unknown(name.slice(0, 40))], effects: [], tone: "error" };
}

export type ScreenApp =
  | { readonly kind: "DESKTOP" }
  | { readonly kind: "PROJECTS"; readonly automatic: boolean }
  | { readonly kind: "PREVIEW"; readonly siteId: "fixture" | "nutriopus" | "deborah" }
  | { readonly kind: "CODE"; readonly file?: string }
  | { readonly kind: "NOTES" }
  | { readonly kind: "TERMINAL" };

export type WorkstationMode =
  | ScreenApp["kind"]
  | "FOCUS_SCREEN"
  | "MANIPULATE"
  | "BROKEN";

export type WorkstationState = {
  readonly mode: WorkstationMode;
  readonly app: ScreenApp;
  readonly lidAngle: number;
  readonly rotation: readonly [number, number, number];
  readonly priorFocus: boolean;
};

export type WorkstationEvent =
  | { type: "OPEN_SITE"; siteId: unknown }
  | { type: "OPEN_CODE"; file?: unknown }
  | { type: "OPEN_NOTES" }
  | { type: "OPEN_TERMINAL" }
  | { type: "OPEN_PROJECTS"; automatic?: boolean }
  | { type: "SYNC_PROJECTS"; active: boolean }
  | { type: "CLOSE_X" }
  | { type: "FOCUS_SCREEN" }
  | { type: "EXIT_FOCUS" }
  | { type: "SET_LID"; angle: number }
  | { type: "ROTATE"; axis: 0 | 1 | 2; delta: number }
  | { type: "BEGIN_ROTATE" }
  | { type: "END_ROTATE" }
  | { type: "RESET" }
  | { type: "RESET_POSE" }
  | { type: "FAIL" };

export const initialWorkstationState: WorkstationState = {
  mode: "DESKTOP",
  app: { kind: "DESKTOP" },
  lidAngle: 108,
  rotation: [0, 0, 0],
  priorFocus: false,
};

const rotationLimits = [0.6, 1.35, 0.3] as const;
export const CODE_FILE_ID = /^[a-z0-9]+(?:-[a-z0-9]+){0,12}$/;

export function isScreenInteractive(state: WorkstationState): boolean {
  return state.lidAngle >= 15 && state.mode !== "MANIPULATE" && state.mode !== "BROKEN";
}

function openApp(state: WorkstationState, app: ScreenApp): WorkstationState {
  if (state.mode === "BROKEN" || state.mode === "MANIPULATE") return state;
  const focused = state.mode === "FOCUS_SCREEN";
  return { ...state, app, mode: focused ? "FOCUS_SCREEN" : app.kind, priorFocus: focused };
}

/** P01 has no physics events: BROKEN only represents an explicit failure until reset. */
export function workstationReducer(
  state: WorkstationState,
  event: WorkstationEvent,
): WorkstationState {
  // DOM and iframe boundaries can deliver malformed values despite compile-time types.
  if (!event || typeof event !== "object") return state;

  switch (event.type) {
    case "OPEN_SITE": {
      const siteId = event.siteId;
      if (siteId !== "fixture" && siteId !== "nutriopus" && siteId !== "deborah") return state;
      return openApp(state, { kind: "PREVIEW", siteId });
    }
    case "OPEN_CODE": {
      // Only generated manifest ids (kebab-case) are accepted; the Code app resolves them locally.
      const file = event.file;
      if (file !== undefined && (typeof file !== "string" || file.length > 64 || !CODE_FILE_ID.test(file))) return state;
      return openApp(state, file ? { kind: "CODE", file } : { kind: "CODE" });
    }
    case "OPEN_NOTES":
      return openApp(state, { kind: "NOTES" });
    case "OPEN_TERMINAL":
      return openApp(state, { kind: "TERMINAL" });
    case "OPEN_PROJECTS":
      return openApp(state, { kind: "PROJECTS", automatic: !!event.automatic });
    case "SYNC_PROJECTS":
      if (state.mode === "FOCUS_SCREEN" || state.mode === "MANIPULATE" || state.mode === "BROKEN") return state;
      if (event.active && state.app.kind === "DESKTOP") return openApp(state, { kind: "PROJECTS", automatic: true });
      if (!event.active && state.app.kind === "PROJECTS" && state.app.automatic) return openApp(state, { kind: "DESKTOP" });
      return state;
    case "CLOSE_X": {
      if (state.mode === "BROKEN") return state;
      const focused = state.mode === "FOCUS_SCREEN";
      return {
        ...state,
        app: { kind: "DESKTOP" },
        mode: focused ? "FOCUS_SCREEN" : "DESKTOP",
        priorFocus: focused,
      };
    }
    case "FOCUS_SCREEN":
      if (state.mode === "BROKEN" || state.mode === "MANIPULATE") return state;
      return { ...state, mode: "FOCUS_SCREEN", lidAngle: 108, priorFocus: true };
    case "EXIT_FOCUS":
      return state.mode === "FOCUS_SCREEN"
        ? { ...state, mode: state.app.kind, priorFocus: false }
        : state;
    case "SET_LID": {
      if (state.mode === "BROKEN" || !Number.isFinite(event.angle)) return state;
      const lidAngle = Math.min(135, Math.max(0, event.angle));
      if (lidAngle === state.lidAngle) return state;
      return {
        ...state,
        lidAngle,
        mode: lidAngle < 15 ? state.app.kind : state.mode,
        priorFocus: lidAngle < 15 ? false : state.priorFocus,
      };
    }
    case "BEGIN_ROTATE":
      if (state.mode === "FOCUS_SCREEN" || state.mode === "BROKEN") return state;
      return { ...state, mode: "MANIPULATE", priorFocus: false };
    case "ROTATE": {
      if (state.mode === "FOCUS_SCREEN" || state.mode === "BROKEN") {
        return state;
      }
      const { axis, delta } = event;
      if ((axis !== 0 && axis !== 1 && axis !== 2) || !Number.isFinite(delta)) return state;
      const limit = rotationLimits[axis];
      const value = Math.min(limit, Math.max(-limit, state.rotation[axis] + delta));
      if (value === state.rotation[axis]) return state;
      const rotation: [number, number, number] = [...state.rotation];
      rotation[axis] = value;
      return { ...state, rotation };
    }
    case "END_ROTATE":
      return state.mode === "MANIPULATE"
        ? { ...state, mode: state.app.kind, priorFocus: false }
        : state;
    case "FAIL":
      return state.mode === "BROKEN"
        ? state
        : { ...state, mode: "BROKEN", app: { kind: "DESKTOP" }, priorFocus: false };
    case "RESET":
      return initialWorkstationState;
    case "RESET_POSE":
      if (state.mode === "BROKEN") return state;
      return { ...state, rotation: [0, 0, 0], lidAngle: 108, mode: state.mode === "MANIPULATE" ? state.app.kind : state.mode };
    default:
      return state;
  }
}

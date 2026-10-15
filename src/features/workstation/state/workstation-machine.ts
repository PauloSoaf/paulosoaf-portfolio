export type ScreenApp =
  | { readonly kind: "DESKTOP" }
  | { readonly kind: "PREVIEW"; readonly siteId: "fixture" | "nutriopus" | "deborah" }
  | { readonly kind: "CODE" }
  | { readonly kind: "NOTES" };

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
  | { type: "OPEN_CODE" }
  | { type: "OPEN_NOTES" }
  | { type: "CLOSE_X" }
  | { type: "FOCUS_SCREEN" }
  | { type: "EXIT_FOCUS" }
  | { type: "SET_LID"; angle: number }
  | { type: "ROTATE"; axis: 0 | 1 | 2; delta: number }
  | { type: "BEGIN_ROTATE" }
  | { type: "END_ROTATE" }
  | { type: "RESET" }
  | { type: "FAIL" };

export const initialWorkstationState: WorkstationState = {
  mode: "DESKTOP",
  app: { kind: "DESKTOP" },
  lidAngle: 108,
  rotation: [0, 0, 0],
  priorFocus: false,
};

const rotationLimits = [0.6, 1.35, 0.3] as const;

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
    case "OPEN_CODE":
      // No component path or external source is accepted by the P01 stub.
      return openApp(state, { kind: "CODE" });
    case "OPEN_NOTES":
      return openApp(state, { kind: "NOTES" });
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
    default:
      return state;
  }
}

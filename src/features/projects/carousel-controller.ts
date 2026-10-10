export const AUTOPLAY_INTERVAL = 7_000;
export const DRAG_THRESHOLD = 40;

export interface CarouselState {
  selectedSlug: string | null;
  isPlaying: boolean;
  isHovered: boolean;
  hasFocus: boolean;
  isDragging: boolean;
  reducedMotion: boolean;
  visible: boolean;
  tabVisible: boolean;
  announcement: string;
}

export const initialCarouselState: CarouselState = {
  selectedSlug: null, isPlaying: true, isHovered: false, hasFocus: false, isDragging: false,
  reducedMotion: false, visible: false, tabVisible: true, announcement: "",
};

export function wrapIndex(index: number, count: number): number {
  return count > 0 ? ((index % count) + count) % count : 0;
}

export function selectedIndex(state: CarouselState, slugs: readonly string[]): number {
  return Math.max(0, slugs.indexOf(state.selectedSlug ?? ""));
}

export function slideOffset(index: number, selected: number, count: number): number {
  let offset = wrapIndex(index - selected, count);
  if (offset > count / 2) offset -= count;
  return offset;
}

export function shouldAutoAdvance(state: CarouselState, count: number): boolean {
  return count > 1 && state.isPlaying && !state.isHovered && !state.hasFocus && !state.isDragging &&
    !state.reducedMotion && state.visible && state.tabVisible;
}

type Action =
  | { type: "step"; delta: number; slugs: readonly string[]; announcement?: string }
  | { type: "playing"; value: boolean }
  | { type: "focus" | "hover" | "drag" | "visible" | "tab" | "reduced"; value: boolean };

export function carouselReducer(state: CarouselState, action: Action): CarouselState {
  switch (action.type) {
    case "step": {
      if (action.slugs.length < 2) return state;
      const index = wrapIndex(selectedIndex(state, action.slugs) + action.delta, action.slugs.length);
      return { ...state, selectedSlug: action.slugs[index]!, announcement: action.announcement ?? "" };
    }
    case "playing": return { ...state, isPlaying: action.value && !state.reducedMotion };
    // WAI: entering focus stops rotation until an explicit play request, even after focus leaves.
    case "focus": return { ...state, hasFocus: action.value, isPlaying: action.value && !state.hasFocus ? false : state.isPlaying };
    case "hover": return { ...state, isHovered: action.value };
    case "drag": return { ...state, isDragging: action.value };
    case "visible": return { ...state, visible: action.value };
    case "tab": return { ...state, tabVisible: action.value };
    case "reduced": return { ...state, reducedMotion: action.value, isPlaying: action.value ? false : state.isPlaying };
  }
}

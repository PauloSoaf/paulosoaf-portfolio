import { THEME_COOKIE } from "./theme";

/**
 * Inline, render-blocking bootstrap placed first in `<head>`. Runs before the first paint so the
 * saved theme never flashes (RNF-017) while pages stay statically generated:
 * - `data-js` marks that JavaScript is available (no-JS fallbacks key off its absence);
 * - `data-theme` comes from the preference cookie, accepting only `dark`/`light`.
 * Without JavaScript nothing runs and CSS falls back to the Dark tokens on `:root`.
 */
export const THEME_BOOTSTRAP_SCRIPT = `(function(){try{var d=document.documentElement;d.setAttribute("data-js","");var m=document.cookie.match(/(?:^|;\\s*)${THEME_COOKIE}=(dark|light)(?:;|$)/);d.setAttribute("data-theme",m?m[1]:"dark")}catch(e){}})();`;

/**
 * Local DES bootstrap for StreamAutomator (light-first product).
 * Supports system preference via colorMode while defaulting to light when forced.
 */
const STORAGE_KEY = "streamautomator_ui_theme_anon";

function prefersDark() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function loadMode(defaultMode = "system") {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultMode;
    const parsed = JSON.parse(raw);
    const m = String(parsed?.colorMode || raw).toLowerCase();
    if (m === "dark" || m === "light" || m === "system") return m;
  } catch {
    /* ignore */
  }
  return defaultMode;
}

function saveMode(colorMode) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ colorMode }));
  } catch {
    /* ignore */
  }
}

function resolveTheme(colorMode) {
  if (colorMode === "system") return prefersDark() ? "dark" : "light";
  return colorMode === "dark" ? "dark" : "light";
}

/**
 * @param {{ product?: string; theme?: string; colorMode?: "dark"|"light"|"system"; defaultMode?: "dark"|"light"|"system" }} [opts]
 */
export function applyDesTheme({
  product = "streamautomator",
  theme,
  colorMode,
  defaultMode = "system",
} = {}) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const mode = colorMode || loadMode(defaultMode);
  const resolved = theme || resolveTheme(mode);
  root.setAttribute("data-theme", resolved);
  root.setAttribute("data-product", product);
  root.dataset.colorMode = mode;
  root.style.colorScheme = resolved;
  saveMode(mode);
  return { colorMode: mode, appearance: resolved };
}

/**
 * Bootstrap SA appearance (system default, light when OS is light).
 */
export function bootstrapDesAppearance({
  product = "streamautomator",
  defaultMode = "system",
} = {}) {
  const applied = applyDesTheme({ product, defaultMode, colorMode: loadMode(defaultMode) });
  if (typeof window === "undefined" || !window.matchMedia) {
    return { ...applied, unsubscribe: () => {} };
  }
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const onChange = () => {
    if (loadMode(defaultMode) === "system") {
      applyDesTheme({ product, defaultMode, colorMode: "system" });
    }
  };
  mq.addEventListener?.("change", onChange);
  return {
    ...applied,
    unsubscribe: () => mq.removeEventListener?.("change", onChange),
  };
}

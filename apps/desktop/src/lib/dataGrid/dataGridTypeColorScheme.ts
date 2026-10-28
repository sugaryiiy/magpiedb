import { DATA_GRID_TYPE_VISUAL_KINDS, type DataGridTypeVisualKind } from "@/lib/dataGrid/dataGridColumnType";

/** Every visual kind except `unknown`, which deliberately stays on the neutral foreground. */
export type DataGridTypeColorKey = Exclude<DataGridTypeVisualKind, "unknown">;

export type DataGridTypeColors = Record<DataGridTypeColorKey, string>;

export interface DataGridTypeColorScheme {
  id: string;
  name: string;
  colors: DataGridTypeColors;
}

export const DATA_GRID_TYPE_COLOR_KEYS = DATA_GRID_TYPE_VISUAL_KINDS.filter((kind): kind is DataGridTypeColorKey => kind !== "unknown");

/** Sentinel scheme id meaning "leave the stylesheet defaults alone and follow light/dark". */
export const DATA_GRID_TYPE_COLOR_SCHEME_AUTO_ID = "auto";

/**
 * @param schemes Schemes from persisted settings, Vue reactive state, or dialog drafts
 * @return Plain detached copies safe to keep in another reactive buffer
 */
export function cloneDataGridTypeColorSchemes(schemes: readonly DataGridTypeColorScheme[]): DataGridTypeColorScheme[] {
  return schemes.map((scheme) => ({
    id: scheme.id,
    name: scheme.name,
    colors: { ...scheme.colors },
  }));
}

// Keep these in sync with the :root / :root.dark blocks in styles/globals.css.
// dataGridTypeColorScheme.spec.ts asserts the two stay identical.
/** Blueprint ramp: types differ by gray step, darkest first (light) / lightest first (dark). */
export const DEFAULT_DATA_GRID_TYPE_COLORS_LIGHT: DataGridTypeColors = {
  integer: "#0a0a0a",
  numeric: "#161616",
  string: "#232323",
  boolean: "#2f2f2f",
  temporal: "#3b3b3b",
  structured: "#484848",
  identifier: "#545454",
  binary: "#606060",
  spatial: "#6d6d6d",
};

export const DEFAULT_DATA_GRID_TYPE_COLORS_DARK: DataGridTypeColors = {
  integer: "#fafafa",
  numeric: "#ededed",
  string: "#dcdcdc",
  boolean: "#cccccc",
  temporal: "#bbbbbb",
  structured: "#ababab",
  identifier: "#9c9c9c",
  binary: "#969696",
  spatial: "#909090",
};

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

/**
 * @param key Type visual kind driving the cue
 * @return CSS custom property backing both the DOM class and the canvas paint theme
 */
export function dataGridTypeColorCssVar(key: DataGridTypeColorKey): string {
  return `--data-grid-type-${key}-fg`;
}

/**
 * @param isDark Whether the dark appearance is active
 * @return Built-in palette for that appearance
 */
export function defaultDataGridTypeColors(isDark: boolean): DataGridTypeColors {
  return isDark ? DEFAULT_DATA_GRID_TYPE_COLORS_DARK : DEFAULT_DATA_GRID_TYPE_COLORS_LIGHT;
}

/**
 * @param value Untrusted persisted palette
 * @param fallback Palette supplying every key the input fails to provide
 * @return Palette with all nine keys set to a valid `#rrggbb` value
 */
export function normalizeDataGridTypeColors(value: unknown, fallback: DataGridTypeColors = DEFAULT_DATA_GRID_TYPE_COLORS_LIGHT): DataGridTypeColors {
  const source = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  const out = {} as DataGridTypeColors;
  for (const key of DATA_GRID_TYPE_COLOR_KEYS) {
    const candidate = source[key];
    out[key] = typeof candidate === "string" && HEX_COLOR_RE.test(candidate) ? candidate : fallback[key];
  }
  return out;
}

/**
 * @param value Untrusted persisted scheme list
 * @return Schemes with usable ids, names, and palettes; unusable entries are dropped
 */
export function normalizeDataGridTypeColorSchemes(value: unknown): DataGridTypeColorScheme[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const out: DataGridTypeColorScheme[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const { id, name, colors } = entry as Record<string, unknown>;
    // The auto id is reserved, so a persisted scheme may never claim it.
    if (typeof id !== "string" || !id.trim() || id === DATA_GRID_TYPE_COLOR_SCHEME_AUTO_ID || seen.has(id)) continue;
    seen.add(id);
    out.push({
      id,
      name: typeof name === "string" && name.trim() ? name : id,
      colors: normalizeDataGridTypeColors(colors),
    });
  }
  return out;
}

/**
 * @param schemes Available custom schemes
 * @param activeId Selected scheme id
 * @return Selected id, or the auto sentinel when it does not resolve to a scheme
 */
export function normalizeActiveDataGridTypeColorSchemeId(schemes: DataGridTypeColorScheme[], activeId: unknown): string {
  if (typeof activeId !== "string" || !schemes.some((scheme) => scheme.id === activeId)) return DATA_GRID_TYPE_COLOR_SCHEME_AUTO_ID;
  return activeId;
}

/**
 * @param schemes Available custom schemes
 * @param activeId Selected scheme id
 * @return Palette to force onto the CSS variables, or null to keep following the theme
 */
export function resolveActiveDataGridTypeColors(schemes: DataGridTypeColorScheme[], activeId: string): DataGridTypeColors | null {
  if (activeId === DATA_GRID_TYPE_COLOR_SCHEME_AUTO_ID) return null;
  const scheme = schemes.find((entry) => entry.id === activeId);
  return scheme ? scheme.colors : null;
}

/**
 * Shared vocabulary for the research agent's per-turn model + reasoning-effort
 * selection. Used by the client (picker/dial), the backend resolver
 * (validation), and the sandbox supervisor (launch args). The model values are
 * the `claude` CLI's "latest of family" aliases (`--model fable|opus|…`) and the
 * effort values are its `--effort low|medium|high|xhigh|max` levels.
 */

export type ResearchModelAlias = 'fable' | 'opus' | 'sonnet' | 'haiku';
export type ResearchEffortLevel = 'low' | 'medium' | 'high' | 'xhigh' | 'max';

export const RESEARCH_MODEL_ALIASES: readonly ResearchModelAlias[] = ['fable', 'opus', 'sonnet', 'haiku'];
export const RESEARCH_EFFORT_LEVELS: readonly ResearchEffortLevel[] = ['low', 'medium', 'high', 'xhigh', 'max'];
export const DEFAULT_RESEARCH_EFFORT: ResearchEffortLevel = 'medium';

/**
 * The model alias the picker shows (and sends) until the user picks otherwise.
 * Kept in sync with the sandbox's server-side `RESEARCH_AGENT_MODEL` default so
 * an untouched picker reproduces the backend's default behaviour rather than
 * silently overriding it.
 */
export const DEFAULT_RESEARCH_MODEL: ResearchModelAlias = 'fable';

/** Display labels — family only, no version numbers (versions live in tooltips). */
export const MODEL_ALIAS_LABELS: Record<ResearchModelAlias, string> = {
  fable: 'Fable',
  opus: 'Opus',
  sonnet: 'Sonnet',
  haiku: 'Haiku',
};

/** Fuller "family + version" names, surfaced in the picker's option tooltips. */
export const MODEL_ALIAS_TOOLTIPS: Record<ResearchModelAlias, string> = {
  fable: 'Claude Fable 5',
  opus: 'Claude Opus 4.8',
  sonnet: 'Claude Sonnet 4.6',
  haiku: 'Claude Haiku 4.5',
};

/** Human-facing label for a reasoning-effort level (title-cased alias). */
export const EFFORT_LEVEL_LABELS: Record<ResearchEffortLevel, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  xhigh: 'Extra high',
  max: 'Max',
};

export function isResearchModelAlias(value: unknown): value is ResearchModelAlias {
  return typeof value === 'string' && (RESEARCH_MODEL_ALIASES as readonly string[]).includes(value);
}

export function isResearchEffortLevel(value: unknown): value is ResearchEffortLevel {
  return typeof value === 'string' && (RESEARCH_EFFORT_LEVELS as readonly string[]).includes(value);
}

/**
 * Map either a bare family alias (`opus`) or a full model id (`claude-opus-4-8`)
 * to its family alias, or null. Accepting both matters for the supervisor's
 * respawn check, which compares the client's per-turn alias against the
 * full-id `RESEARCH_AGENT_MODEL` default.
 */
export function modelIdToAlias(model: string | null | undefined): ResearchModelAlias | null {
  if (!model) return null;
  if (isResearchModelAlias(model)) return model;
  const family = model.match(/^claude-([a-z]+)/i)?.[1]?.toLowerCase();
  return family && isResearchModelAlias(family) ? family : null;
}

/** Fill fraction (0..1) for the effort indicator dot: low → 0.2 … max → 1. */
export function effortFillFraction(level: ResearchEffortLevel): number {
  const idx = RESEARCH_EFFORT_LEVELS.indexOf(level);
  return idx < 0 ? 0 : (idx + 1) / RESEARCH_EFFORT_LEVELS.length;
}

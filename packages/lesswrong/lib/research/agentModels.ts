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

/** Display labels — family only, no version numbers (versions live in tooltips). */
export const MODEL_ALIAS_LABELS: Record<ResearchModelAlias, string> = {
  fable: 'Fable',
  opus: 'Opus',
  sonnet: 'Sonnet',
  haiku: 'Haiku',
};

export function isResearchModelAlias(value: unknown): value is ResearchModelAlias {
  return typeof value === 'string' && (RESEARCH_MODEL_ALIASES as readonly string[]).includes(value);
}

export function isResearchEffortLevel(value: unknown): value is ResearchEffortLevel {
  return typeof value === 'string' && (RESEARCH_EFFORT_LEVELS as readonly string[]).includes(value);
}

/** Map a full model id (e.g. `claude-opus-4-8`) to its family alias, or null. */
export function modelIdToAlias(model: string | null | undefined): ResearchModelAlias | null {
  if (!model) return null;
  const family = model.match(/^claude-([a-z]+)/i)?.[1]?.toLowerCase();
  return family && isResearchModelAlias(family) ? family : null;
}

/** Fill fraction (0..1) for the effort indicator dot: low → 0.2 … max → 1. */
export function effortFillFraction(level: ResearchEffortLevel): number {
  const idx = RESEARCH_EFFORT_LEVELS.indexOf(level);
  return idx < 0 ? 0 : (idx + 1) / RESEARCH_EFFORT_LEVELS.length;
}

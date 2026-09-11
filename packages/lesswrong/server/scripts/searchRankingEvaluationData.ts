import { createHash } from "crypto";

export type EvaluationIndex = "posts" | "comments" | "users" | "tags" | "sequences";
export interface EvaluationTarget { index: EvaluationIndex; objectID: string }
export interface EvaluationEvidence { query: string; context: string; resultType: string; resultId: string; resultTitle: string; clicks: number }
export interface IntentFamily {
  id: string;
  category: string;
  observed_queries: string[];
  observed_targets: {result_type: string; result_id: string}[];
}
export interface EvaluationGroup {
  query: string;
  family: string;
  categories: string[];
  split: "training" | "holdout";
  targets: EvaluationTarget[];
}

export function evidenceIndex(resultType: string): EvaluationIndex | undefined {
  switch (resultType.toLowerCase()) {
    case "posts": return "posts";
    case "comments": return "comments";
    case "users": return "users";
    case "tags": return "tags";
    case "sequences": return "sequences";
    default: return undefined;
  }
}
export function targetKey(target: EvaluationTarget): string { return `${target.index}:${target.objectID}`; }
export function normalizeQuery(query: string): string { return query.trim().toLowerCase().replace(/\s+/g, " "); }

function connect(links: Map<string, Set<string>>, left: string, right: string) {
  if (!links.has(left)) links.set(left, new Set());
  if (!links.has(right)) links.set(right, new Set());
  links.get(left)?.add(right);
  links.get(right)?.add(left);
}

/** Connected components prevent both query variants and shared destinations leaking across splits. */
export function buildEvaluationGroups(rows: EvaluationEvidence[], families: IntentFamily[]): EvaluationGroup[] {
  const links = new Map<string, Set<string>>();
  const categories = new Map<string, Set<string>>();
  for (const family of families) {
    for (const query of family.observed_queries) {
      const normalized = normalizeQuery(query);
      connect(links, `q:${normalized}`, family.id);
      if (!categories.has(normalized)) categories.set(normalized, new Set());
      categories.get(normalized)?.add(family.category);
    }
    for (const target of family.observed_targets) {
      const index = evidenceIndex(target.result_type);
      if (index) connect(links, family.id, `t:${targetKey({index, objectID: target.result_id})}`);
    }
  }
  const targets = new Map<string, Map<string, EvaluationTarget>>();
  for (const row of rows) {
    const index = evidenceIndex(row.resultType);
    if (!index) continue;
    const query = normalizeQuery(row.query);
    const target = {index, objectID: row.resultId};
    connect(links, `q:${query}`, `t:${targetKey(target)}`);
    if (!targets.has(query)) targets.set(query, new Map());
    targets.get(query)?.set(targetKey(target), target);
  }
  const components = new Map<string, string>();
  for (const node of [...links.keys()].sort()) {
    if (components.has(node)) continue;
    const pending = [node];
    const visited = new Set<string>();
    while (pending.length) {
      const next = pending.pop();
      if (!next || visited.has(next)) continue;
      visited.add(next);
      pending.push(...(links.get(next) ?? []));
    }
    const familyIds = [...visited].filter(key => key.startsWith("intent-")).sort();
    const component = familyIds.length ? familyIds.join("+") : [...visited].sort()[0];
    for (const member of visited) components.set(member, component);
  }
  return [...targets].sort(([a], [b]) => a.localeCompare(b)).map(([query, queryTargets]) => {
    const family = components.get(`q:${query}`) ?? `q:${query}`;
    const hash = createHash("sha256").update(`unified-ranking-v1:${family}`).digest().readUInt32BE(0);
    return {query, family, categories: [...(categories.get(query) ?? [])].sort(), split: hash % 5 === 0 ? "holdout" : "training", targets: [...queryTargets.values()].sort((a, b) => targetKey(a).localeCompare(targetKey(b)))};
  });
}

export function navigationMetrics(ranks: (number | null)[]) {
  const count = ranks.length;
  return {
    queries: count,
    mrr: count ? ranks.reduce<number>((sum, rank) => sum + (rank ? 1 / rank : 0), 0) / count : null,
    successAt1: count ? ranks.filter(rank => rank === 1).length / count : null,
    successAt3: count ? ranks.filter(rank => rank !== null && rank <= 3).length / count : null,
    successAt10: count ? ranks.filter(rank => rank !== null && rank <= 10).length / count : null,
  };
}

/** Pooled nDCG excludes unjudged documents instead of silently treating them as irrelevant. */
export function judgedPoolNdcg(rankedKeys: string[], grades: Map<string, number>, limit = 10): number | null {
  const observed = rankedKeys.filter(key => grades.has(key)).slice(0, limit).map(key => grades.get(key) ?? 0);
  const ideal = [...grades.values()].sort((a, b) => b - a).slice(0, limit);
  const idealDcg = ideal.reduce((sum, grade, index) => sum + (((2 ** grade) - 1) / Math.log2(index + 2)), 0);
  return idealDcg ? observed.reduce((sum, grade, index) => sum + (((2 ** grade) - 1) / Math.log2(index + 2)), 0) / idealDcg : null;
}

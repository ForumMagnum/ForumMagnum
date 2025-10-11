import { accessFilterMultiple } from "@/lib/utils/schemaUtils";
import { getPostMarketInfo, postGetMarketInfoFromManifold } from "@/lib/collections/posts/annualReviewMarkets";
import moment from "moment";
import gql from "graphql-tag";

export const reviewPredictionGraphQLTypeDefs = gql`
  type PredictionInefficiency {
    inefficiency: Float!
    totalPredicted: Float!
  }
  extend type Query {
    reviewPredictionPosts(year: Int!, limit: Int = 50): [Post!]!
    manifoldPredictionInefficiency(year: Int!): PredictionInefficiency!
  }
`;

async function fetchMarketFull(marketId: string) {
  const res = await fetch(`https://api.manifold.markets/v0/market/${marketId}`, {
    method: "GET",
    headers: { "content-type": "application/json" },
    cache: 'force-cache',
    next: { revalidate: 300, tags: ['manifold-market', `manifold-market-${marketId}`] },
  });
  if (!res.ok) return null;
  return res.json();
}

// Estimate mana to move probability from p to pTarget for cpmm-1 given pool and liquidity.
// We use a small-step greedy integration for simplicity. For non-cpmm-1, we skip.
function estimateCpmmCostToMove(probability: number, target: number, pool: any, pParam?: number) {
  // If already on target, cost is zero
  if (typeof probability !== 'number' || typeof target !== 'number') return 0;
  if (!isFinite(probability) || !isFinite(target)) return 0;
  const eps = 1e-6;
  const p0 = Math.min(1 - eps, Math.max(eps, probability));
  const pT = Math.min(1 - eps, Math.max(eps, target));
  if (Math.abs(p0 - pT) < eps) return 0;
  const yes = (pool && (pool.yes ?? pool.YES)) as number | undefined;
  const no = (pool && (pool.no ?? pool.NO)) as number | undefined;
  if (typeof yes !== 'number' || typeof no !== 'number') return 0;
  const yesStart = yes;
  const noStart = no;
  if (!(yesStart > 0) || !(noStart > 0)) return 0;
  const p = (typeof pParam === 'number' && isFinite(pParam) && pParam > 0 && pParam < 1) ? pParam : 0.5;
  const outcome: 'YES' | 'NO' = pT > p0 ? 'YES' : 'NO';
  // Based on Manifold's calculateCpmmAmountToProb
  let prob = pT;
  if (outcome === 'NO') prob = 1 - prob;
  if (prob <= 0 || prob >= 1 || Number.isNaN(prob)) return 0;
  const y = yesStart; const n = noStart;
  const k = Math.pow(y, p) * Math.pow(n, 1 - p);
  let amount: number;
  if (outcome === 'YES') {
    const numerator = p * (prob - 1);
    const denominator = (p - 1) * prob;
    const t = numerator / denominator;
    const tPowP = Math.pow(t, p);
    const tPowNegP = Math.pow(t, -p);
    amount = tPowNegP * (k - (n * tPowP));
  } else {
    const numerator = (1 - p) * (prob - 1);
    const denominator = (-p) * prob;
    const t = numerator / denominator;
    const tPowPminus1 = Math.pow(t, p - 1);
    const tPow1minusP = Math.pow(t, 1 - p);
    amount = tPowPminus1 * (k - (y * tPow1minusP));
  }
  if (!isFinite(amount) || amount < 0) return 0;
  return amount;
}

export const reviewPredictionGraphQLQueries = {
  async reviewPredictionPosts(_: void, { year, limit }: { year: number, limit?: number }, context: ResolverContext) {
    const start = moment.utc(`${year}-01-01`).toDate();
    const end = moment.utc(`${year + 1}-01-01`).toDate();
    const candidates = await context.Posts.find({
      postedAt: { $gte: start, $lt: end },
      status: 2,
      draft: false,
      shortform: false,
      unlisted: false,
      isEvent: false,
      manifoldReviewMarketId: { $exists: true },
    }, { limit: 2000 }).fetch();

    // Load probabilities; this triggers cache refresh for missing markets
    const withProbs = await Promise.all(candidates.map(async (p) => {
      const info = await getPostMarketInfo(p as DbPost, context);
      return { post: p, info } as const;
    }));

    let unresolvedWithProb = withProbs.filter(x => x.info && x.info.probability != null && !x.info.isResolved);

    // If we don't have enough items with cached probabilities, fetch live from Manifold
    const desired = limit ?? 50;
    if (unresolvedWithProb.length < desired) {
      const remaining = candidates.filter(c => !unresolvedWithProb.some(x => x.post._id === c._id));
      for (const p of remaining) {
        if (!p.manifoldReviewMarketId) continue;
        const live = await postGetMarketInfoFromManifold(p.manifoldReviewMarketId, year);
        if (live && !live.isResolved && typeof live.probability === 'number') {
          // Write to cache for future requests
          try {
            await context.repos.manifoldProbabilitiesCachesRepo.upsertMarketInfoInCache(p.manifoldReviewMarketId, live);
          } catch (_e) { /* ignore cache errors */ }
          unresolvedWithProb.push({ post: p, info: live });
          if (unresolvedWithProb.length >= desired) break;
        }
      }
    }

    const sorted = unresolvedWithProb.sort((a, b) => (b.info!.probability - a.info!.probability) || a.post._id.localeCompare(b.post._id));
    const selected = sorted.slice(0, desired).map(x => x.post);
    return accessFilterMultiple(context.currentUser, 'Posts', selected, context);
  },

  async manifoldPredictionInefficiency(_: void, { year }: { year: number }, context: ResolverContext): Promise<{ inefficiency: number, totalPredicted: number }> {
    // Fetch candidate posts with markets for the year
    const start = moment.utc(`${year}-01-01`).toDate();
    const end = moment.utc(`${year + 1}-01-01`).toDate();
    const posts = await context.Posts.find({
      postedAt: { $gte: start, $lt: end },
      manifoldReviewMarketId: { $exists: true },
      status: 2,
      draft: false,
      shortform: false,
      unlisted: false,
      isEvent: false,
    }, { limit: 2000 }).fetch();
    const marketIds = posts.map(p => p.manifoldReviewMarketId).filter(Boolean) as string[];
    if (!marketIds.length) return { inefficiency: 0, totalPredicted: 0 };

    // Get current probabilities to compute aggregate
    const markets = await Promise.all(marketIds.map(fetchMarketFull));
    const valid = markets.filter(Boolean) as any[];
    if (!valid.length) return { inefficiency: 0, totalPredicted: 0 };

    const probs = valid.map(m => (typeof m.probability === 'number' ? m.probability : 0.5));
    const eps = 1e-6;
    const clamp = (x: number) => Math.min(1 - eps, Math.max(eps, x));
    const targetSum = 50; // expected winners count

    // Uniform multiplicative scaling: p'_i = clamp(p_i * c), same c for all
    // Handle boundary clamping iteratively until all actives are within (0,1)
    const n = probs.length;
    let targets = new Array<number>(n);
    let active = new Array<boolean>(n).fill(true);
    let fixedSum = 0;
    const saturated = new Set<number>();
    for (let iter = 0; iter < 10; iter++) {
      const sumActive = probs.reduce((acc, p, i) => acc + (active[i] ? p : 0), 0);
      const rem = targetSum - fixedSum;
      if (sumActive <= 0 || !isFinite(rem)) break;
      const c = rem / sumActive;
      let changed = false;
      for (let i = 0; i < n; i++) {
        if (!active[i]) continue;
        const t = clamp(probs[i] * c);
        targets[i] = t;
        if (t === eps || t === 1 - eps) {
          active[i] = false;
          fixedSum += t;
          saturated.add(i);
          changed = true;
        }
      }
      if (!changed) {
        // Fill in any non-active targets with their fixed values (already added to fixedSum)
        for (let i = 0; i < n; i++) if (!active[i]) targets[i] = targets[i] ?? (saturated.has(i) ? targets[i]! : clamp(probs[i] * c));
        break;
      }
    }
    // Any indices never visited above should be set now
    for (let i = 0; i < n; i++) {
      if (targets[i] == null) targets[i] = clamp(probs[i]);
    }

    // Sum CPMM costs to move each market from current prob to target prob
    let totalCost = 0;
    for (let i = 0; i < valid.length; i++) {
      const m = valid[i];
      if (m.mechanism !== 'cpmm-1') continue;
      const current = probs[i];
      const target = targets[i];
      if (typeof current !== 'number' || typeof target !== 'number') continue;
      const c = estimateCpmmCostToMove(current, target, m.pool, m.p);
      if (isFinite(c)) totalCost += c;
    }
    return { inefficiency: isFinite(totalCost) ? totalCost : 0, totalPredicted: probs.reduce((acc, p) => acc + p, 0) };
  },
};



// Minimal cpmm-1 math utilities used by reviewPredictionResolvers
// These mirror Manifold's cpmm-1 semantics at a high level while remaining self-contained.

export type CpmmPool = { yes?: number; no?: number; YES?: number; NO?: number };

type NormalizedPool = { yes: number; no: number };

export function getYesNoFromPool(pool: CpmmPool | undefined | null): NormalizedPool | null {
  if (!pool) return null;
  const yes = (pool.yes ?? (pool as any).YES) as number | undefined;
  const no = (pool.no ?? (pool as any).NO) as number | undefined;
  if (typeof yes !== 'number' || typeof no !== 'number') return null;
  if (!(yes > 0) || !(no > 0)) return null;
  return { yes, no };
}

// Calculate mana required to move probability from prob0 to probTarget for cpmm-1.
// outcome: which side to buy to achieve the move (default chooses based on direction).
// fee: platform fee fraction (e.g., 0.02). Set to 0 for fee-less analysis.
export function calculateCpmmAmountToProb(
  prob0: number,
  probTarget: number,
  pool: CpmmPool | undefined | null,
  pParam?: number,
  outcome: 'YES' | 'NO' = 'NO',
  fee: number = 0
): number {
  if (typeof prob0 !== 'number' || typeof probTarget !== 'number') return 0;
  if (!isFinite(prob0) || !isFinite(probTarget)) return 0;
  const norm = getYesNoFromPool(pool);
  if (!norm) return 0;
  const eps = 1e-6;
  const p0 = Math.min(1 - eps, Math.max(eps, prob0));
  const pT = Math.min(1 - eps, Math.max(eps, probTarget));
  if (Math.abs(p0 - pT) < eps) return 0;

  // Clamp p to (0,1); Manifold uses p in (0,1), default 0.5.
  const p = (typeof pParam === 'number' && isFinite(pParam) && pParam > 0 && pParam < 1) ? pParam : 0.5;
  const { yes: y, no: n } = norm;
  if (!(y > 0) || !(n > 0)) return 0;

  // Apply outcome normalization: work in terms of the outcome we are buying.
  // For NO, flip probabilities so that formulas are symmetric.
  const chosen: 'YES' | 'NO' = outcome ?? (pT > p0 ? 'YES' : 'NO');
  let prob = pT;
  if (chosen === 'NO') prob = 1 - prob;
  if (prob <= 0 || prob >= 1 || Number.isNaN(prob)) return 0;

  // cpmm-1 invariant k = y^p * n^(1-p)
  const k = Math.pow(y, p) * Math.pow(n, 1 - p);

  // Closed-form from Manifold-style cpmm-1 derivation.
  // These expressions match the structure used in Manifold's calculateCpmmAmountToProb.
  let grossAmount: number;
  if (chosen === 'YES') {
    const numerator = p * (prob - 1);
    const denominator = (p - 1) * prob;
    const t = numerator / denominator;
    const tPowP = Math.pow(t, p);
    const tPowNegP = Math.pow(t, -p);
    grossAmount = tPowNegP * (k - (n * tPowP));
  } else {
    const numerator = (1 - p) * (prob - 1);
    const denominator = (-p) * prob;
    const t = numerator / denominator;
    const tPowPminus1 = Math.pow(t, p - 1);
    const tPow1minusP = Math.pow(t, 1 - p);
    grossAmount = tPowPminus1 * (k - (y * tPow1minusP));
  }

  if (!isFinite(grossAmount) || grossAmount < 0) return 0;

  // Incorporate fee: trader pays amount / (1 - fee) to deposit grossAmount into the pool.
  const netAmount = fee > 0 && fee < 1 ? grossAmount / (1 - fee) : grossAmount;
  return isFinite(netAmount) && netAmount >= 0 ? netAmount : 0;
}

// Estimate NO shares minted when moving probability down from prob0 to probTarget.
export function estimateNoSharesMinted(
  prob0: number,
  probTarget: number,
  poolInit: CpmmPool | undefined | null,
  pParam?: number
): number {
  const norm = getYesNoFromPool(poolInit);
  if (!norm) return 0;
  const eps = 1e-6;
  const q0 = Math.min(1 - eps, Math.max(eps, prob0));
  const q1 = Math.min(1 - eps, Math.max(eps, probTarget));
  if (q1 >= q0) return 0; // only handle buying NO (lowering probability)
  const p = (typeof pParam === 'number' && isFinite(pParam) && pParam > 0) ? pParam : 0.5;
  const y0 = norm.yes;
  const n0 = norm.no;
  const k = Math.pow(y0, p) * Math.pow(n0, 1 - p);
  const r = (q: number) => q / (1 - q);
  const r0 = r(q0);
  const r1 = r(q1);
  const n1 = k / Math.pow(r1, p);
  const deltaN = n1 - n0; // mana added to NO pool

  // NO shares minted in closed form
  if (Math.abs(p - 1) < 1e-9) {
    const ln = Math.log(Math.max(eps, n1 / n0));
    const shares = deltaN + (y0 * ln);
    return isFinite(shares) ? Math.max(0, shares) : 0;
  } else {
    const kPow = Math.pow(k, 1 / p);
    const a = p / (p - 1);
    const n1Term = Math.pow(n1, (p - 1) / p);
    const n0Term = Math.pow(n0, (p - 1) / p);
    const shares = deltaN + (kPow * a * (n1Term - n0Term));
    return isFinite(shares) ? Math.max(0, shares) : 0;
  }
}

// Invert NO-shares -> probability via monotone bisection.
export function findProbForNoShares(
  prob0: number,
  sWanted: number,
  poolInit: CpmmPool | undefined | null,
  pParam?: number
): number {
  const norm = getYesNoFromPool(poolInit);
  if (!norm) return Math.max(1e-2, Math.min(0.999, prob0));
  const eps = 1e-2;
  const start = Math.min(1 - eps, Math.max(eps, prob0));
  let lo = eps;
  let hi = start;
  const sMax = estimateNoSharesMinted(start, lo, norm, pParam);
  if (sWanted >= sMax) return lo;

  for (let it = 0; it < 28; it++) {
    const mid = (lo + hi) / 2;
    const sMid = estimateNoSharesMinted(start, mid, norm, pParam);
    if (!isFinite(sMid)) return mid;
    if (Math.abs(sMid - sWanted) < eps) return mid;
    if (sMid < sWanted) {
      hi = mid;
    } else {
      lo = mid;
    }
  }
  return (lo + hi) / 2;
}

export function equalNoSharesGuaranteedProfit(
  markets: Array<{ mechanism?: string; pool?: CpmmPool; p?: number } | null | undefined>,
  probs: number[],
  targetSum: number,
  fee: number = 0
): { profit: number; s: number; qs: number[] } {
  const eps = 1e-6;
  const included: { idx: number; prob0: number; pool: CpmmPool; p?: number }[] = [];
  for (let i = 0; i < markets.length; i++) {
    const m = markets[i];
    if (m && m.mechanism === 'cpmm-1' && m.pool && typeof probs[i] === 'number') {
      included.push({ idx: i, prob0: Math.min(1 - eps, Math.max(eps, probs[i])), pool: m.pool, p: m.p });
    }
  }
  const N = included.length;
  if (N === 0) return { profit: 0, s: 0, qs: [] };

  // If already at/below target, no arbitrage by this construction
  const currentSum = included.reduce((acc, x) => acc + x.prob0, 0);
  if (currentSum <= targetSum + 1e-9) return { profit: 0, s: 0, qs: included.map(x => x.prob0) };

  // Precompute max shares to move to ~0 probability
  const sMaxPerMarket = included.map(x => estimateNoSharesMinted(x.prob0, eps, x.pool, x.p));
  const sHi = Math.max(...sMaxPerMarket.filter(s => isFinite(s) && s >= 0), 0);
  if (!(sHi > 0)) return { profit: 0, s: 0, qs: included.map(x => x.prob0) };

  const sumQForS = (s: number) => {
    let sumQ = 0;
    const qs: number[] = new Array(N);
    for (let j = 0; j < N; j++) {
      const x = included[j];
      const sCap = Math.max(0, sMaxPerMarket[j] || 0);
      const sEff = Math.min(s, sCap);
      const q = sEff > 0 ? findProbForNoShares(x.prob0, sEff, x.pool, x.p) : x.prob0;
      qs[j] = q;
      sumQ += q;
    }
    return { sumQ, qs };
  };

  // Bisection on s
  let lo = 0;
  let hi = sHi;
  let bestS = 0;
  let bestQs: number[] = included.map(x => x.prob0);
  const atHi = sumQForS(hi);
  if (atHi.sumQ > targetSum) {
    bestS = hi;
    bestQs = atHi.qs;
  } else {
    for (let it = 0; it < 28; it++) {
      const sCand = (lo + hi) / 2;
      const { sumQ, qs } = sumQForS(sCand);
      if (Math.abs(sumQ - targetSum) < 1e-1) { bestS = sCand; bestQs = qs; break; }
      if (sumQ > targetSum) {
        lo = sCand;
      } else {
        hi = sCand;
        bestS = sCand;
        bestQs = qs;
      }
    }
  }

  // Compute total cost with chosen bestS and fee consideration
  let totalCost = 0;
  for (let j = 0; j < N; j++) {
    const x = included[j];
    const q = bestQs[j];
    const c = calculateCpmmAmountToProb(x.prob0, q, x.pool, x.p, 'YES', fee);
    if (isFinite(c)) totalCost += c;
  }

  const profit = ((N - targetSum) * bestS) - totalCost;
  return { profit: isFinite(profit) ? profit : 0, s: bestS, qs: bestQs };
}



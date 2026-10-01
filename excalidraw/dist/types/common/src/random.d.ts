export declare const randomInteger: () => number;
export declare const reseed: (seed: number) => void;
export declare const randomId: () => string;
/**
 * Deterministic PRNG (mulberry32) for a given seed: same seed, same
 * sequence — used where a render must be stable across frames and clients
 * (e.g. the sticky note's corner jitter) and roughjs's `Random` is
 * unsuitable (it degenerates for seed 0). Returns numbers in [0, 1).
 */
export declare const seededRandom: (seed: number) => () => number;

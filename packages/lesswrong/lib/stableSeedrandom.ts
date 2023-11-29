// This was written as a quick replacement for ./seedrandom.ts, which was giving different results
// on Safari than on the server. This version is just the quickest old fashioned rng I could write,
// if you need really good randomness or cryptographic security you should probably use something else.

class StableSeedRandom {
  private seed: number;
  private readonly m: number = 2 ** 31;
  private readonly a: number = 1103515245;
  private readonly c: number = 12345;

  constructor(seed: string) {
    this.seed = this.stringToSeed(seed);
  }

  private stringToSeed(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  }

  next(): number {
    this.seed = ((this.a * this.seed) + this.c) % this.m;
    return this.seed / (this.m - 1);
  }
}

export function stableSeedrandom(seed: string): StableSeedRandom {
  return new StableSeedRandom(seed);
}
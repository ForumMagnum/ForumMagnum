import seedrandom from "./seedrandom";

const crypto = bundleIsServer ? require('crypto') : null;

// Excludes 0O1lIUV
const unmistakableChars = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTWXYZ23456789";

export type RandIntCallback = (max: number) => number;

/**
 * A random integer in [0,max). Not cryptographically secure.
 */
export const randInt: RandIntCallback = (max: number) => {
  return Math.floor(Math.random() * max);
}

/**
 * A seeded random integer in [0,max). Not cryptographically secure.
 */
export const seededRandInt = (seed: string): RandIntCallback => {
  const rng = seedrandom(seed);
  return (max: number) => Math.floor(rng() * max);
}

export const ID_LENGTH = 17;

/**
 * A random 17-digit string, using characters that are hard to confuse with each
 * other. If run on the server and not supplying a custom RNG then it's
 * cryptographically secure, otherwise it's not.
 */
export const randomId = (length=ID_LENGTH, randIntCallback?: RandIntCallback) => {
  if (bundleIsServer && !randIntCallback) {
    const bytes = crypto.randomBytes(length);
    const result: Array<string> = [];
    for (let byte of bytes) {
      // Discards part of each byte and has modulo bias. Doesn't matter in
      // this context.
      result.push(unmistakableChars[byte % unmistakableChars.length]);
    }
    return result.join('');
  } else {
    const rand = randIntCallback ?? randInt;
    const result: Array<string> = [];
    for (let i=0; i<length; i++)
      result.push(unmistakableChars[rand(unmistakableChars.length)]);
    return result.join('');
  }
}

/**
 * A 30 digit (15 byte) random hexadecimal string, generated from a CSPRNG.
 * Not available on the client (throws an exception).
 */
export const randomSecret = () => {
  if (bundleIsServer) {
    return crypto.randomBytes(15).toString('hex');
  } else {
    throw new Error("No CSPRNG available on the client");
  }
}

const fiftyThreeBits = Math.pow(2, 53);

/**
 * Modified form of https://github.com/bryc/code/blob/master/jshash/experimental/cyrb53.js
 * Returns a pseudorandom number between 0 and 1 by hashing the input
 */
export function cyrb53Rand(str: string, seed = 0) {
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  for(let i = 0, ch; i < str.length; i++) {
      ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1  = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2  = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  return ((4294967296 * (2097151 & h2)) + (h1 >>> 0)) / fiftyThreeBits;
};

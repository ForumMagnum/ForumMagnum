import { isServer } from "./executionEnvironment";
import seedrandom from "./seedrandom";
import orderBy from "lodash/orderBy";

// Excludes 0O1lIUV
const unmistakableChars = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTWXYZ23456789";
const lowercaseUnmistakableChars = "abcdefghijkmnopqrstuvwxyz23456789";

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
export const randomId = (length=ID_LENGTH, randIntCallback?: RandIntCallback, allowedChars?: string) => {
  const chars = allowedChars ?? unmistakableChars;
  if (isServer && !randIntCallback) {
    const typedArray = new Uint8Array(length);
    const bytes = crypto.getRandomValues(typedArray);
    const result: Array<string> = [];
    for (let byte of bytes) {
      // Discards part of each byte and has modulo bias. Doesn't matter in
      // this context.
      result.push(chars[byte % chars.length]);
    }
    return result.join('');
  } else {
    const rand = randIntCallback ?? randInt;
    const result: Array<string> = [];
    for (let i=0; i<length; i++)
      result.push(chars[rand(chars.length)]);
    return result.join('');
  }
}

/**
 * Like randomId, but doesn't use uppercase letters (which makes it suitable
 * for using in slugs).
 */
export const randomLowercaseId = (length=ID_LENGTH, randIntCallback?: RandIntCallback) => {
  return randomId(length, randIntCallback, lowercaseUnmistakableChars);
}

/**
 * A 30 digit (15 byte) random hexadecimal string, generated from a CSPRNG.
 * Not available on the client (throws an exception).
 */
export const randomSecret = () => {
  if (isServer) {
    const typedArray = new Uint8Array(15);
    crypto.getRandomValues(typedArray);
    return Buffer.from(typedArray).toString("hex");
  } else {
    throw new Error("No CSPRNG available on the client");
  }
}

export const seededShuffle = <T>(array: T[], seed: string): T[] => {
  const rng = seedrandom(seed);
  // Assign a random key to each element for reproducible shuffling
  return orderBy(array, () => rng());
};

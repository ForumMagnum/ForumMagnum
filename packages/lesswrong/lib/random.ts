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

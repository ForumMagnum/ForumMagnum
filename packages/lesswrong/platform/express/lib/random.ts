import * as _ from 'underscore';

const crypto = bundleIsServer ? require('crypto') : null;

// Excludes 0O1lIUV
const unmistakableChars = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTWXYZ23456789";

export const randomId = () => {
  if (bundleIsServer) {
    const bytes = crypto.randomBytes(17);
    const result: Array<string> = [];
    for (let byte of bytes) {
      // Discards part of each byte and has modulo bias. Doesn't matter in
      // this context.
      result.push(unmistakableChars[byte % unmistakableChars.length]);
    }
    return result.join('');
  } else {
    const result: Array<string> = [];
    const randInt = (max: number) => {
      return Math.floor(Math.random() * max);
    }
    for (let i=0; i<17; i++)
      result.push(unmistakableChars[randInt(unmistakableChars.length)]);
    return result.join('');
  }
}

export const randomSecret = () => {
  if (bundleIsServer) {
    return crypto.randomBytes(15).toString('base64');
  } else {
    throw new Error("No CSPRNG available on the client");
  }
}

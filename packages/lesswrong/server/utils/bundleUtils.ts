import fs from 'fs';
import crypto from 'crypto';
import path from 'path'

const loadClientBundle = () => {
  // This path join is relative to "build/server/serverBundle.js", NOT to this file
  const bundlePath = path.join(__dirname, "../../client/js/bundle.js");
  const bundleBrotliPath = `${bundlePath}.br`;

  const lastModified = fs.statSync(bundlePath).mtimeMs;
  // there is a brief window on rebuild where a stale brotli file is present, fall back to the uncompressed file in this case
  const brotliFileIsValid = fs.existsSync(bundleBrotliPath) && fs.statSync(bundleBrotliPath).mtimeMs >= lastModified

  const bundleText = fs.readFileSync(bundlePath, 'utf8');
  const bundleBrotliBuffer = brotliFileIsValid ? fs.readFileSync(bundleBrotliPath) : null;

  // Store the bundle in memory as UTF-8 (the format it will be sent in), to
  // save a conversion and a little memory
  const bundleBuffer = Buffer.from(bundleText, 'utf8');
  return {
    bundlePath,
    bundleHash: crypto.createHash('sha256').update(bundleBuffer).digest('hex'),
    lastModified,
    bundleBuffer,
    bundleBrotliBuffer,
  };
}

let clientBundle: {bundlePath: string, bundleHash: string, lastModified: number, bundleBuffer: Buffer, bundleBrotliBuffer: Buffer|null}|null = null;
export const getClientBundle = () => {
  if (!clientBundle) {
    clientBundle = loadClientBundle();
    return clientBundle;
  }
  
  // Reload if bundle.js has changed or there is a valid brotli version when there wasn't before
  const lastModified = fs.statSync(clientBundle.bundlePath).mtimeMs;
  const bundleBrotliPath = `${clientBundle.bundlePath}.br`
  const brotliFileIsValid = fs.existsSync(bundleBrotliPath) && fs.statSync(bundleBrotliPath).mtimeMs >= lastModified
  if (clientBundle.lastModified !== lastModified || (clientBundle.bundleBrotliBuffer === null && brotliFileIsValid)) {
    clientBundle = loadClientBundle();
    return clientBundle;
  }
  
  return clientBundle;
}

let serverBundleHash: string|null = null;
export const getServerBundleHash = (): string => {
  if (!serverBundleHash) {
    const serverBundlePath = path.join(__dirname, "../../server/js/serverBundle.js");
    const serverBundleText = fs.readFileSync(serverBundlePath, 'utf8');
    const serverBundleBuffer = Buffer.from(serverBundleText, 'utf8');
    serverBundleHash = crypto.createHash('sha256').update(serverBundleBuffer).digest('hex');
  }
  return serverBundleHash;
}

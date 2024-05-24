import fs from 'fs';
import crypto from 'crypto';
import path from 'path'
import { zlib } from 'mz';
import { isProduction } from '../../lib/executionEnvironment';

export type CompressedCacheResource = {
  content: Buffer
  brotli: Buffer|null
  brotliPromise: Promise<Buffer>|null
  hash: string
}

type CachedClientBundle = {
  resource: CompressedCacheResource
  bundlePath: string
  lastModified: number
};

/**
 * Given a resource (a buffer), start a job to brotli-compress it. The
 * resulting CompressedCacheResource object contains the original
 * (uncompressed) buffer, a reference to the brotli-compressed version which
 * will be filled in later, and a promise (if the compression is in progress).
 * Compression is slow, but takes place on a node worker thread, not the main
 * thread.
 *
 * Note that the brotli field will be filled in later, when compression is
 * done, so you shouldn't copy this object (the copy won't get filled in).
 *
 * This will be skipped if not in production mode (since it would slow down
 * the development-refresh cycle).
 * ). 
 */
export const brotliCompressResource = (content: Buffer): CompressedCacheResource => {
  const resource: CompressedCacheResource = {
    content,
    hash: crypto.createHash('sha256').update(content).digest('hex'),
    brotli: null,
    brotliPromise: null,
  };

  if (isProduction) {
    resource.brotliPromise = new Promise((resolve: (result: Buffer) => void) => {
      zlib.brotliCompress(content, {
        params: {
          [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT,
        }
      }, (_err, result) => {
        resource.brotli = result;
        resource.brotliPromise = null;
        resolve(result);
      });
    });
  } else {
    resource.brotliPromise = null;
  }
  
  return resource;
}

const loadClientBundle = (): CachedClientBundle => {
  const bundlePath = path.join(__dirname, "../../client/js/bundle.js");
  const lastModified = fs.statSync(bundlePath).mtimeMs;

  // The bundle is already in UTF-8, so if we read it with no character set specifier,
  // we get it in ready-to-serve form.
  const bundleBuffer = fs.readFileSync(bundlePath);

  return {
    resource: brotliCompressResource(bundleBuffer),
    bundlePath, lastModified
  };
}

let clientBundle: CachedClientBundle|null;

export const getClientBundle = () => {
  if (!clientBundle) {
    clientBundle = loadClientBundle();
  }
  return clientBundle;
}

let serverBundleHash: string|null = null;
export const getServerBundleHash = (): string => {
  if (!serverBundleHash) {
    const serverBundlePath = path.join(__dirname, "../../server/js/serverBundle.js");
    const serverBundleBuffer = fs.readFileSync(serverBundlePath);
    serverBundleHash = crypto.createHash('sha256').update(serverBundleBuffer).digest('hex');
  }
  return serverBundleHash;
}

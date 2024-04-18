import fs from 'fs';
import crypto from 'crypto';
import path from 'path'
import type { Express } from 'express';
import { addStaticRoute } from '../vulcan-lib/staticRoutes';
import toDictionary from '../../lib/utils/toDictionary';

export const splitFiles: string[] = [
  "react-map-gl", "recharts"
];

const loadClientBundle = (bundleName: string) => {
  // This path join is relative to "build/server/serverBundle.js", NOT to this file
  const bundlePath = path.join(__dirname, `../../client/js/${bundleName}.js`);
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

interface LoadedClientBundle {
  bundlePath: string
  bundleHash: string
  lastModified: number
  bundleBuffer: Buffer
  bundleBrotliBuffer: Buffer|null
}
let clientBundlesByName: Record<string, LoadedClientBundle> = {};

export const getMainClientBundle = () => {
  return getClientBundle("bundle");
}

const getClientBundle = (bundleName: string): LoadedClientBundle => {
  if (!clientBundlesByName[bundleName]) {
    clientBundlesByName[bundleName] = loadClientBundle(bundleName);
    return clientBundlesByName[bundleName];
  }
  
  // Reload if bundle.js has changed or there is a valid brotli version when there wasn't before
  const bundle = clientBundlesByName[bundleName]
  const lastModified = fs.statSync(bundle.bundlePath).mtimeMs;
  const bundleBrotliPath = `${bundle.bundlePath}.br`
  const brotliFileIsValid = fs.existsSync(bundleBrotliPath) && fs.statSync(bundleBrotliPath).mtimeMs >= lastModified
  if (bundle.lastModified !== lastModified || (bundle.bundleBrotliBuffer === null && brotliFileIsValid)) {
    clientBundlesByName[bundleName] = loadClientBundle(bundleName);
    return clientBundlesByName[bundleName];
  }
  
  return bundle;
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

export function addJavascriptEndpoints(app: Express) {

  for (const file of ["bundle", ...splitFiles]) {
    addStaticRoute(`/js/${file}.js`, ({query}, req, res, _context) => {
      const {bundleHash, bundleBuffer, bundleBrotliBuffer} = getClientBundle(file);
      let headers: Record<string,string> = {}
      const acceptBrotli = req.headers['accept-encoding'] && req.headers['accept-encoding'].includes('br')
  
      if ((query.hash && query.hash !== bundleHash) || (acceptBrotli && bundleBrotliBuffer === null)) {
        // If the query specifies a hash, but it's wrong, this probably means there's a
        // version upgrade in progress, and the SSR and the bundle were handled by servers
        // on different versions. Serve whatever bundle we have (there's really not much
        // else to do), but set the Cache-Control header differently so that it will be
        // fixed on the next refresh.
        //
        // If the client accepts brotli compression but we don't have a valid brotli compressed bundle,
        // that either means we are running locally (in which case chache control isn't important), or that
        // the brotli bundle is currently being built (in which case set a short cache TTL to prevent the CDN
        // from serving the uncompressed bundle for too long).
        headers = {
          "Cache-Control": "public, max-age=60",
          "Content-Type": "text/javascript; charset=utf-8"
        }
      } else {
        headers = {
          "Cache-Control": "public, max-age=604800, immutable",
          "Content-Type": "text/javascript; charset=utf-8"
        }
      }
  
      if (bundleBrotliBuffer !== null && acceptBrotli) {
        headers["Content-Encoding"] = "br";
        res.writeHead(200, headers);
        res.end(bundleBrotliBuffer);
      } else {
        res.writeHead(200, headers);
        res.end(bundleBuffer);
      }
    });
  }
}

export function getSplitFileHashes(): Partial<Record<string,string>> {
  return toDictionary(splitFiles,
    f=>`/js/${f}.js`,
    f=>getClientBundle(f).bundleHash
  );
}

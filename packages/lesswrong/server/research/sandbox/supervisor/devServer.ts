import { Socket } from "node:net";

export interface DevServerHandle {
  /** True when something is accepting TCP connections on the dev port. */
  isListening(): Promise<boolean>;
}

/** How long to wait for a single connection probe. */
const PROBE_TIMEOUT_MS = 1000;
/** How long a probe result is reused — the auth-proxy probes per request. */
const PROBE_CACHE_MS = 1500;

function probePort(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new Socket();
    const done = (ok: boolean) => {
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(PROBE_TIMEOUT_MS);
    socket.once("connect", () => done(true));
    socket.once("timeout", () => done(false));
    socket.once("error", () => done(false));
    socket.connect(port, "127.0.0.1");
  });
}

export function startDevPortProbe(devPort: number): DevServerHandle {
  let probeInFlight: { promise: Promise<boolean>; at: number } | null = null;
  const isListening = (): Promise<boolean> => {
    const now = Date.now();
    if (probeInFlight && now - probeInFlight.at < PROBE_CACHE_MS) {
      return probeInFlight.promise;
    }
    const promise = probePort(devPort);
    probeInFlight = { promise, at: now };
    return promise;
  };
  return { isListening };
}

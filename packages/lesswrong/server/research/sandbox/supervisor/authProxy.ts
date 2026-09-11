/**
 * Auth-proxy. Runs inside the sandbox as a second HTTP listener in the
 * supervisor process, on its own public port (`AUTH_PROXY_PORT`).
 *
 * It gates the localhost-only dev server (`./devServer.ts`):
 *
 *   GET /_devauth/:token  — validates the HMAC-signed token, sets a
 *                           subdomain-scoped cookie, 302-redirects to `/`.
 *   any other request     — with a valid cookie: proxies to the dev port
 *                           (HTTP and WebSocket upgrades), or serves an
 *                           auto-refreshing "no dev server detected" page when
 *                           nothing is bound on the dev port. Without one: 401.
 *
 * The token is minted by the backend's `mintDevPreviewUrl` over the shared
 * `DEV_PROXY_SECRET`, the same HMAC scheme as the supervisor's own tokens.
 */
import {
  createServer,
  IncomingMessage,
  ServerResponse,
  request as httpRequest,
  Server,
} from "node:http";
import { Socket } from "node:net";
import { Duplex } from "node:stream";
import { DEVAUTH_SCOPE, validateSupervisorToken } from "./auth";
import { DevServerHandle, DEV_PORT } from "./devServer";

/** Cookie the auth-proxy sets and checks; host-only, so scoped to the subdomain. */
const COOKIE_NAME = "research_devauth";

export interface AuthProxyConfig {
  /** Public port to listen on (`AUTH_PROXY_PORT`). */
  port: number;
  /** Shared HMAC secret (`DEV_PROXY_SECRET`). */
  proxySecret: string;
  /** Sandbox name — the token's `sandboxId` claim must match it. */
  sandboxId: string;
  devServer: DevServerHandle;
  /** Called on every authenticated request — feeds the idle policy. */
  onActivity: () => void;
}

const NOT_DETECTED_PAGE = `<!doctype html><html><head><meta charset="utf-8">
<meta http-equiv="refresh" content="2"><title>No dev server detected</title></head>
<body style="font-family:sans-serif;padding:2rem">
<h2>No dev server detected yet</h2>
<p>Nothing is listening on the dev port. Start your dev server (it should bind
<code>$PORT</code>). This page refreshes automatically.</p>
</body></html>`;

/** Read one cookie value out of a `Cookie` request header. */
function readCookie(header: string | undefined, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    if (part.slice(0, eq).trim() === name) return part.slice(eq + 1).trim();
  }
  return null;
}

/** Validate a dev-preview token against the proxy secret + this sandbox. */
function tokenIsValid(token: string | null, config: AuthProxyConfig): boolean {
  if (!token) return false;
  const result = validateSupervisorToken(token, config.proxySecret);
  return (
    result.ok &&
    result.payload.sandboxId === config.sandboxId &&
    result.payload.scope === DEVAUTH_SCOPE
  );
}

function send(res: ServerResponse, status: number, body: string, contentType: string): void {
  res.statusCode = status;
  res.setHeader("Content-Type", contentType);
  res.end(body);
}

/** Proxy an HTTP request through to the localhost dev server. */
function proxyHttp(req: IncomingMessage, res: ServerResponse, devPort: number): void {
  const upstream = httpRequest(
    { host: "127.0.0.1", port: devPort, method: req.method, path: req.url, headers: req.headers },
    (upstreamRes) => {
      res.writeHead(upstreamRes.statusCode ?? 502, upstreamRes.headers);
      upstreamRes.pipe(res);
    },
  );
  upstream.on("error", () => {
    if (!res.headersSent) send(res, 502, "dev server unreachable", "text/plain");
    else res.end();
  });
  req.pipe(upstream);
}

/** Bridge a WebSocket upgrade through to the localhost dev server. */
function proxyUpgrade(req: IncomingMessage, clientSocket: Duplex, head: Buffer, devPort: number): void {
  const upstream = new Socket();
  // Tear down both halves when either side ends — by error or by a clean
  // close — so an abandoned WebSocket never leaks a socket pair.
  upstream.on("error", () => clientSocket.destroy());
  clientSocket.on("error", () => upstream.destroy());
  upstream.on("close", () => clientSocket.destroy());
  clientSocket.on("close", () => upstream.destroy());
  upstream.connect(devPort, "127.0.0.1", () => {
    const headerLines = Object.entries(req.headers).map(([k, v]) =>
      `${k}: ${Array.isArray(v) ? v.join(", ") : v}`,
    );
    upstream.write(`${req.method} ${req.url} HTTP/1.1\r\n${headerLines.join("\r\n")}\r\n\r\n`);
    if (head.length) upstream.write(head);
    upstream.pipe(clientSocket);
    clientSocket.pipe(upstream);
  });
}

async function handleRequest(
  req: IncomingMessage,
  res: ServerResponse,
  config: AuthProxyConfig,
): Promise<void> {
  const url = new URL(req.url ?? "/", "http://internal");

  // `GET /_devauth/:token` — exchange a freshly-minted token for a cookie.
  const devauthMatch = url.pathname.match(/^\/_devauth\/(.+)$/);
  if (devauthMatch) {
    const token = decodeURIComponent(devauthMatch[1]);
    if (!tokenIsValid(token, config)) {
      send(res, 401, "invalid or expired dev-preview link", "text/plain");
      return;
    }
    // Host-only cookie (no Domain attribute) — scoped to this `sb-…` subdomain.
    res.statusCode = 302;
    res.setHeader(
      "Set-Cookie",
      `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax`,
    );
    res.setHeader("Location", "/");
    res.end();
    return;
  }

  // Every other request needs a valid cookie.
  const cookieToken = readCookie(req.headers.cookie, COOKIE_NAME);
  if (!tokenIsValid(cookieToken ? decodeURIComponent(cookieToken) : null, config)) {
    send(res, 401, "no valid dev-preview session", "text/plain");
    return;
  }
  config.onActivity();

  if (await config.devServer.isListening()) {
    proxyHttp(req, res, DEV_PORT);
  } else {
    send(res, 503, NOT_DETECTED_PAGE, "text/html");
  }
}

/**
 * Start the auth-proxy HTTP server. Returns the underlying server so the
 * supervisor can close it on shutdown.
 */
export function startAuthProxy(config: AuthProxyConfig): Server {
  const server = createServer((req, res) => {
    void handleRequest(req, res, config).catch((err) => {
      // eslint-disable-next-line no-console
      console.error("[authproxy] handler threw", err);
      if (!res.headersSent) send(res, 500, "internal error", "text/plain");
      else res.end();
    });
  });

  server.on("upgrade", (req, socket, head) => {
    const cookieToken = readCookie(req.headers.cookie, COOKIE_NAME);
    if (!tokenIsValid(cookieToken ? decodeURIComponent(cookieToken) : null, config)) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }
    config.onActivity();
    proxyUpgrade(req, socket, head, DEV_PORT);
  });

  server.listen(config.port, "0.0.0.0", () => {
    // eslint-disable-next-line no-console
    console.log(`[authproxy] listening on :${config.port}`);
  });
  return server;
}

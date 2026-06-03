import { siteUrlSetting } from "@/lib/instanceSettings";
import { NextRequest } from "next/server";

export function getSiteUrlFromReq(req: NextRequest): string {
  return getSiteUrlFromHeaders(req.headers);
}

export function getSiteUrlFromHeaders(headers: Headers | undefined): string {
  const forwardedFor = headers?.get('x-forwarded-for') ?? null;
  const forwardedHost = headers?.get('x-forwarded-host') ?? null;
  const forwardedPort = headers?.get('x-forwarded-port') ?? null;
  const forwardedProto = headers?.get("x-forwarded-proto") ?? null;

  let url: string;
  if (forwardedFor && forwardedHost) {
    const forwardedHostWithoutPort = forwardedHost.split(":")[0].trim();
    const proto = forwardedProto ?? "http";
    const port = getPortFromForwardedHeaders(forwardedFor, forwardedPort);
    url = `${proto}://${forwardedHostWithoutPort}${port ? `:${port}` : ""}`;
  } else {
    url = siteUrlSetting.get();
  }

  return url.replace(/\/+$/, "");
}

function getPortFromForwardedHeaders(forwardedFor: string | null, forwardedPort: string | null): string {
  if (forwardedFor && isLocalhost(forwardedFor)) {
    return forwardedPort ?? "";
  } else {
    return "";
  }
}

export function isLocalhost(host: string): boolean {
  switch (host) {
    case "localhost":
    case "127.0.0.1":
    case "::ffff:127.0.0.1":
    case "::1":
      return true;
    default:
      return false;
  }
}

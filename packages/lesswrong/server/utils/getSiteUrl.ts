import { siteUrlSetting } from "@/lib/instanceSettings";
import { NextRequest } from "next/server";

export function getSiteUrlFromReq(req: NextRequest): string {
  const headers = req.headers;
  const forwardedFor = headers.get('x-forwarded-for');
  const forwardedHost = headers.get('x-forwarded-host');
  const forwardedPort = headers.get('x-forwarded-port');
  const forwardedProto = headers.get("x-forwarded-proto");

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
    case "::1":
    case "::ffff:127.0.0.1":
      return true;
    default:
      return false;
  }
}

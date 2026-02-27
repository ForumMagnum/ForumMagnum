import { siteUrlSetting } from "@/lib/instanceSettings";
import { NextRequest } from "next/server";

export function getSiteUrlFromReq(req: NextRequest): string {
  const headers = req.headers;
  const forwardedFor = headers.get('x-forwarded-for');
  const forwardedHost = headers.get('x-forwarded-host');
  const forwardedPort = headers.get('x-forwarded-port');
  const forwardedProto = headers.get("x-forwarded-proto");

  if (forwardedFor) {
  const forwardedHostWithoutPort = forwardedHost?.split(":")?.[0]?.trim();
    const proto = forwardedProto ?? "http";
    const port = getPortFromForwardedHeaders(forwardedFor, forwardedPort);
    return `${proto}://${forwardedHostWithoutPort}${port ? `:${port}` : ""}`;
  } else {
    return siteUrlSetting.get();
  }
}

function getPortFromForwardedHeaders(forwardedFor: string | null, forwardedPort: string | null): string {
  if (forwardedPort && forwardedPort.length > 0 && forwardedPort !== "80" && forwardedPort !== "443") {
    return forwardedPort;
  } else if (forwardedFor) {
    const ip = forwardedFor.split(",")?.[0]?.trim();
    return ip.split(":")[1] ?? "";
  } else {
    return forwardedPort ?? "";
  }
}

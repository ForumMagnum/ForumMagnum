import dns from "node:dns";
import { BlockList, isIP, type LookupFunction } from "node:net";
import { Agent, fetch as undiciFetch, type RequestInit, type Response } from "undici";

const MAX_REDIRECTS = 5;
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

// TLDs that are reserved, or that are conventionally used for internal
// networks (eg ".internal" on AWS and GCP, ".local" for mDNS and Kubernetes),
// and so never refer to public web pages.
const NON_PUBLIC_TLDS = new Set([
  "arpa",
  "corp",
  "example",
  "home",
  "internal",
  "intranet",
  "invalid",
  "lan",
  "local",
  "localdomain",
  "localhost",
  "onion",
  "test",
]);

// IPv4 ranges that aren't publicly routable, from the IANA IPv4 Special-Purpose
// Address Registry.
const NON_PUBLIC_IPV4_SUBNETS: [string, number][] = [
  ["0.0.0.0", 8], // "This network"
  ["10.0.0.0", 8], // Private
  ["100.64.0.0", 10], // Carrier-grade NAT
  ["127.0.0.0", 8], // Loopback
  ["169.254.0.0", 16], // Link-local, including cloud metadata endpoints
  ["172.16.0.0", 12], // Private
  ["192.0.0.0", 24], // IETF protocol assignments
  ["192.0.2.0", 24], // Documentation
  ["192.88.99.0", 24], // 6to4 relay anycast
  ["192.168.0.0", 16], // Private
  ["198.18.0.0", 15], // Benchmarking
  ["198.51.100.0", 24], // Documentation
  ["203.0.113.0", 24], // Documentation
  ["224.0.0.0", 4], // Multicast
  ["240.0.0.0", 4], // Reserved, including broadcast
];

// Public IPv6 addresses are all in 2000::/3 (so this excludes loopback,
// link-local, unique-local, multicast, NAT64, etc). These are the
// non-public ranges inside of it.
const GLOBAL_UNICAST_IPV6_SUBNETS: [string, number][] = [
  ["2000::", 3],
];
const NON_PUBLIC_IPV6_SUBNETS: [string, number][] = [
  ["2001::", 23], // IETF protocol assignments, including Teredo
  ["2001:db8::", 32], // Documentation
  ["2002::", 16], // 6to4
  ["3fff::", 20], // Documentation
];
const IPV4_MAPPED_IPV6_SUBNETS: [string, number][] = [
  ["::ffff:0:0", 96],
];

function makeBlockList(subnets: [string, number][], family: "ipv4" | "ipv6"): BlockList {
  const blockList = new BlockList();
  for (const [network, prefix] of subnets) {
    blockList.addSubnet(network, prefix, family);
  }
  return blockList;
}

const nonPublicIpv4 = makeBlockList(NON_PUBLIC_IPV4_SUBNETS, "ipv4");
const globalUnicastIpv6 = makeBlockList(GLOBAL_UNICAST_IPV6_SUBNETS, "ipv6");
const nonPublicIpv6 = makeBlockList(NON_PUBLIC_IPV6_SUBNETS, "ipv6");
const ipv4MappedIpv6 = makeBlockList(IPV4_MAPPED_IPV6_SUBNETS, "ipv6");

export function isPublicIpAddress(address: string): boolean {
  switch (isIP(address)) {
    case 4:
      return !nonPublicIpv4.check(address, "ipv4");
    case 6:
      if (ipv4MappedIpv6.check(address, "ipv6")) {
        // BlockList matches IPv4-mapped IPv6 addresses against IPv4 rules
        return !nonPublicIpv4.check(address, "ipv6");
      }
      return globalUnicastIpv6.check(address, "ipv6") && !nonPublicIpv6.check(address, "ipv6");
    default:
      return false;
  }
}

/**
 * Parse a URL and check that it plausibly refers to a public web page: http(s)
 * on the default port, with no credentials, and a hostname that is either a
 * public IP address or a multi-label domain name outside of the reserved and
 * internal-use TLDs. Throws an error describing the problem if not.
 *
 * This only looks at the URL itself; a public-looking domain name can still
 * resolve to a private address. Server-side fetches of user-provided URLs
 * should use fetchPublicUrl, which also checks the resolved addresses.
 */
export function parsePublicHttpUrl(url: string): URL {
  const parsed = new URL(url);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only http(s) URLs are supported");
  }
  if (parsed.username || parsed.password) {
    throw new Error("URLs containing credentials are not supported");
  }
  if (parsed.port) {
    throw new Error("URLs with non-default ports are not supported");
  }

  // The URL parser normalizes IPv4 addresses written in other forms (eg
  // "2130706433" or "0x7f.1") to dotted-decimal, and puts IPv6 addresses in
  // brackets
  const hostname = parsed.hostname.replace(/^\[(.*)\]$/, "$1").replace(/\.$/, "");
  if (isIP(hostname)) {
    if (!isPublicIpAddress(hostname)) {
      throw new Error("URL hostname is not a public IP address");
    }
    return parsed;
  }

  const labels = hostname.split(".");
  if (labels.length < 2 || labels.some((label) => !label)) {
    throw new Error("URL hostname is not a fully qualified domain name");
  }
  if (NON_PUBLIC_TLDS.has(labels[labels.length - 1])) {
    throw new Error("URL hostname is not a public domain name");
  }
  return parsed;
}

export function isPublicHttpUrl(url: string): boolean {
  try {
    parsePublicHttpUrl(url);
    return true;
  } catch {
    return false;
  }
}

// Resolves hostnames for fetchPublicUrl's connections, failing if any of the
// addresses aren't public. Checking at connection time, rather than resolving
// the hostname separately before fetching, means a DNS server that changes its
// answer between the check and the fetch can't get us to connect somewhere
// else. (Hostnames that are IP addresses skip the lookup, and are instead
// checked by parsePublicHttpUrl.)
const publicOnlyLookup: LookupFunction = (hostname, options, callback) => {
  dns.lookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) {
      callback(err, "");
      return;
    }
    if (addresses.length === 0 || !addresses.every(({ address }) => isPublicIpAddress(address))) {
      callback(new Error(`${hostname} does not resolve to a public IP address`), "");
      return;
    }
    if (options.all) {
      callback(null, addresses);
    } else {
      callback(null, addresses[0].address, addresses[0].family);
    }
  });
};

const publicOnlyAgent = new Agent({
  connect: { lookup: publicOnlyLookup },
});

async function fetchWithoutRedirects(url: URL, options: Pick<RequestInit, "headers" | "signal">): Promise<Response> {
  try {
    return await undiciFetch(url, {
      ...options,
      redirect: "manual",
      dispatcher: publicOnlyAgent,
    });
  } catch (err) {
    // undici reports connection failures (including publicOnlyLookup rejecting
    // a hostname) as a generic "fetch failed" TypeError, with the actual error
    // as its cause
    if (err instanceof TypeError && err.cause instanceof Error) {
      throw err.cause;
    }
    throw err;
  }
}

/**
 * Make a GET request to a user-provided URL, refusing to connect to anything
 * that isn't a public web server. Every URL in the redirect chain must pass
 * parsePublicHttpUrl, and every hostname must resolve only to public IP
 * addresses.
 */
export async function fetchPublicUrl(
  url: string,
  options: Pick<RequestInit, "headers" | "signal"> = {},
): Promise<Response> {
  let currentUrl = parsePublicHttpUrl(url);
  for (let redirectCount = 0; ; redirectCount++) {
    const response = await fetchWithoutRedirects(currentUrl, options);
    const location = response.headers.get("location");
    if (!REDIRECT_STATUSES.has(response.status) || !location) {
      return response;
    }
    await response.body?.cancel();
    if (redirectCount >= MAX_REDIRECTS) {
      throw new Error("Too many redirects");
    }
    currentUrl = parsePublicHttpUrl(new URL(location, currentUrl).toString());
  }
}

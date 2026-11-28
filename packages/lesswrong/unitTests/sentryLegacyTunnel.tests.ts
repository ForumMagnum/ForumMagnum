import { legacySentryTunnelResponse } from "@/server/sentryLegacyTunnel";

describe("legacySentryTunnelResponse", () => {
  it.each(["/api/sentry", "/api/sentry/"])("rate-limits reports posted to %s for a day", (path) => {
    const response = legacySentryTunnelResponse(path);
    expect(response?.status).toBe(429);
    expect(response?.headers.get("retry-after")).toBe("86400");
    expect(response?.headers.get("x-sentry-rate-limits")).toBe("86400::organization");
  });

  it.each(["/api/sentryx", "/api/sentry/other", "/api/other"])("leaves %s alone", (path) => {
    expect(legacySentryTunnelResponse(path)).toBeNull();
  });
});

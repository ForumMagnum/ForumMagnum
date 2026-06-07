import { buildDevServerProxyHeaders } from "../server/research/sandbox/supervisor/authProxy";

describe("authProxy", () => {
  it("normalizes Next dev internal request origins to localhost", () => {
    const headers = buildDevServerProxyHeaders(
      {
        host: "sb-123.vercel.run",
        origin: "https://sb-123.vercel.run",
        referer: "https://sb-123.vercel.run/posts/example?x=1",
        "sec-fetch-mode": "cors",
      },
      "/_next/webpack-hmr",
      9282,
    );

    expect(headers.host).toBe("sb-123.vercel.run");
    expect(headers.origin).toBe("http://localhost:9282");
    expect(headers.referer).toBe("http://localhost:9282/posts/example?x=1");
  });

  it("adds a local referer for no-cors Next asset requests without one", () => {
    const headers = buildDevServerProxyHeaders(
      {
        host: "sb-123.vercel.run",
        "sec-fetch-mode": "no-cors",
        "sec-fetch-site": "cross-site",
      },
      "/_next/static/chunks/app/page.js",
      9282,
    );

    expect(headers.origin).toBe("http://localhost:9282");
    expect(headers.referer).toBe("http://localhost:9282");
  });

  it("preserves ordinary app-route headers", () => {
    const headers = {
      host: "sb-123.vercel.run",
      origin: "https://sb-123.vercel.run",
      referer: "https://sb-123.vercel.run/",
    };

    expect(buildDevServerProxyHeaders(headers, "/dashboard", 9282)).toBe(headers);
  });
});

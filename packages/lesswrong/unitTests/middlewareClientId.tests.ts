import { addClientIdToRequestHeaders, CLIENT_ID_COOKIE, CLIENT_ID_NEW_COOKIE } from "../../../middleware";

function parseCookieHeader(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {};
  for (const cookie of headers.get("Cookie")?.split("; ") ?? []) {
    const separatorIndex = cookie.indexOf("=");
    result[cookie.slice(0, separatorIndex)] = cookie.slice(separatorIndex + 1);
  }
  return result;
}

describe("addClientIdToRequestHeaders", () => {
  it("preserves existing cookies while adding the clientId cookies", () => {
    const headers = new Headers({
      Cookie: "loginToken=abc123; theme=dark",
    });
    const result = parseCookieHeader(addClientIdToRequestHeaders(headers, "newClientId"));
    expect(result).toEqual({
      loginToken: "abc123",
      theme: "dark",
      [CLIENT_ID_COOKIE]: "newClientId",
      [CLIENT_ID_NEW_COOKIE]: "true",
    });
  });

  it("works when the request has no Cookie header", () => {
    const result = parseCookieHeader(addClientIdToRequestHeaders(new Headers(), "newClientId"));
    expect(result).toEqual({
      [CLIENT_ID_COOKIE]: "newClientId",
      [CLIENT_ID_NEW_COOKIE]: "true",
    });
  });

  it("overwrites an existing clientId cookie", () => {
    const headers = new Headers({
      Cookie: `loginToken=abc123; ${CLIENT_ID_COOKIE}=oldClientId`,
    });
    const result = parseCookieHeader(addClientIdToRequestHeaders(headers, "newClientId"));
    expect(result).toEqual({
      loginToken: "abc123",
      [CLIENT_ID_COOKIE]: "newClientId",
      [CLIENT_ID_NEW_COOKIE]: "true",
    });
  });

  it("preserves cookie values containing '='", () => {
    const headers = new Headers({
      Cookie: "session=a=b=c; loginToken=abc123",
    });
    const result = parseCookieHeader(addClientIdToRequestHeaders(headers, "newClientId"));
    expect(result.session).toBe("a=b=c");
    expect(result.loginToken).toBe("abc123");
  });

  it("does not modify the original headers object", () => {
    const headers = new Headers({
      Cookie: "loginToken=abc123",
    });
    addClientIdToRequestHeaders(headers, "newClientId");
    expect(headers.get("Cookie")).toBe("loginToken=abc123");
  });
});

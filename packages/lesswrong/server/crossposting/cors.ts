import { fmCrosspostBaseUrlSetting } from "@/lib/instanceSettings";
import { NextRequest, NextResponse } from "next/server";


export const setCorsHeaders = (res: Response) => {
  const foreignBaseUrl = fmCrosspostBaseUrlSetting.get()?.replace(/\/$/, "");
  if (foreignBaseUrl) {
    res.headers.set("Access-Control-Allow-Origin", foreignBaseUrl);
    res.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, request-origin-path");
    res.headers.set("Access-Control-Max-Age", "86400");
  }
};

// Allow requests from sandboxed iframes (origin "null"), used by the
// customizable home page feature where user-generated code runs in a
// srcdoc iframe without allow-same-origin.
//
// TODO: Remove this when the customizable home page feature is removed.
// WARNING: Never add Access-Control-Allow-Credentials to these headers.
// Origin "null" is sent by ALL sandboxed iframes, not just ours, so adding
// credentials would allow any website to make authenticated GraphQL requests
// on behalf of our users.
export const setSandboxedIframeCorsHeaders = (res: Response) => {
  res.headers.set("Access-Control-Allow-Origin", "null");
  res.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type");
  res.headers.set("Access-Control-Max-Age", "86400");
};

export const crosspostOptionsHandler = (req: NextRequest) => {
  const res = new NextResponse(null, { status: 204 });
  setCorsHeaders(res);
  res.headers.set("Connection", "Keep-Alive");
  res.headers.set("Keep-Alive", "timeout=2, max=100");
  return res;
};

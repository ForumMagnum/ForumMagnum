import { fmCrosspostBaseUrlSetting } from "@/lib/instanceSettings";
import { NextRequest, NextResponse } from "next/server";


export const setCorsHeaders = (res: NextResponse) => {
  const foreignBaseUrl = fmCrosspostBaseUrlSetting.get()?.replace(/\/$/, "");
  if (foreignBaseUrl) {
    res.headers.set("Access-Control-Allow-Origin", foreignBaseUrl);
    res.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, request-origin-path");
    res.headers.set("Access-Control-Max-Age", "86400");
  }
};

export const crosspostOptionsHandler = (req: NextRequest) => {
  const res = new NextResponse(null, { status: 204 });
  setCorsHeaders(res);
  res.headers.set("Connection", "Keep-Alive");
  res.headers.set("Keep-Alive", "timeout=2, max=100");
  return res;
};

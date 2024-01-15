import type { Request } from 'express';

export const getIpFromRequest = (req: Request): string => {
  let ipOrIpArray = req.headers['x-forwarded-for'] || req.headers["x-real-ip"] || req.connection.remoteAddress || "unknown";
  let ip = typeof ipOrIpArray === "object" ? ipOrIpArray[0] : ipOrIpArray as string;
  if (ip.indexOf(",") >= 0) {
    ip = ip.split(",")[0];
  }
  return ip;
}

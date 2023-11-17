import type { Request, Response, NextFunction } from "express";

export const hstsMiddleware = (_req: Request, res: Response, next: NextFunction) => {
  res.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload",
  );
  next();
}

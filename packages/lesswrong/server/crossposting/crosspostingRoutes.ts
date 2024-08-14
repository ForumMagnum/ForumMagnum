import type { Application } from "express";
import { crosspostTokenHandler } from "./handlers/crosspostTokenHandler";

export const addCrosspostingRoutes = (app: Application) => {
  const crosspostHandlers = [
    crosspostTokenHandler,
  ];

  for (const handler of crosspostHandlers) {
    handler.addRoute(app);
  }
}

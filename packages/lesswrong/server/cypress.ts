import { Vulcan } from "./vulcan-lib";
import { isDevelopment } from "../lib/executionEnvironment";
import type { Application, Request, Response } from "express";

const dropAndSeedCypress = async (_req: Request, res: Response) => {
  try {
    await Vulcan.dropAndSeedCypressPg();
    res.status(200).send({status: "ok"});
  } catch (e) {
    res.status(500).send({status: "error", message: e.message});
  }
}

export const addCypressRoutes = (app: Application) => {
  if (isDevelopment) {
    app.post("/api/dropAndSeedCypress", dropAndSeedCypress);
  }
}

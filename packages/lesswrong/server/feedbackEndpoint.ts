import express from "express";
import { getContextFromReqAndRes } from "./vulcan-lib";

import type { Express } from "express";

export function addFeedbackEndpoint(app: Express) {
  app.use("/api/getLlmFeedback", express.json());
  app.post("/api/getLlmFeedback", async (req, res) => {
    const context = await getContextFromReqAndRes({ req, res, isSSR: false });
    const currentUser = context.currentUser;

    if (!currentUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const testReply = [{ comment: "This is a test comment", range: { start: 0, end: 10 } }];

    return res.status(200).json(testReply);
  });
}

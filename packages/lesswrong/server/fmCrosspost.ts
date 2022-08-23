import { DatabaseServerSetting } from "./databaseSettings";
import { addGraphQLMutation, addGraphQLSchema, addGraphQLResolvers, } from "../lib/vulcan-lib";
import { fmCrosspostBaseUrlSetting } from "../lib/instanceSettings";
import fetch from "node-fetch";
import jwt from "jsonwebtoken";
import type {Request, Response} from "express";

export const crosspostTokenApiRoute = "/api/crosspostToken";
export const connectCrossposterApiRoute = "/api/connectCrossposter";

const crosspostSigningKeySetting = new DatabaseServerSetting<string|null>("fmCrosspostSigningKey", null);

type ConnectCrossposterArgs = {
  userId: string,
}

const crosspostResolvers = {
  Mutation: {
    connectCrossposter: async (
      root: void,
      {userId}: ConnectCrossposterArgs,
      {req, res}: ResolverContext,
    ) => {
      const apiUrl = fmCrosspostBaseUrlSetting.get() + connectCrossposterApiRoute.slice(1);
      const result = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({userId}),
      });
      const json = await result.json();
      console.log("JSON RESULT", json);
      return "Successfully connected crosspost account";
    },
  },
};

addGraphQLResolvers(crosspostResolvers);
addGraphQLMutation("connectCrossposter(userId: String): String");

const algorithm = "HS256";
const expiresIn = "15m";

export const onCrosspostTokenRequest = async (req: Request, res: Response) => {
  const {user} = req;
  if (!user) {
    res.status(403).send("Unauthorized");
    return;
  }
  const payload = {userId: user._id};
  const secret = crosspostSigningKeySetting.get();
  if (!secret?.length) {
    res.status(500).send("Missing crosspost signing secret env var");
    return;
  }
  const token = jwt.sign(payload, secret, {algorithm, expiresIn});
  res.send({token});
}

export const onConnectCrossposterRequest = async (req: Request, res: Response) => {
  console.log("Connecting crossposter");
  res.send({ status: "connected" });
}

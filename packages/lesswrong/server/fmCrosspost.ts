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
  token: string,
}

type ConnectCrossposterPayload = {
  userId: string,
}

const crosspostResolvers = {
  Mutation: {
    connectCrossposter: async (
      root: void,
      {token}: ConnectCrossposterArgs,
      {req, res}: ResolverContext,
    ) => {
      const apiUrl = fmCrosspostBaseUrlSetting.get() + connectCrossposterApiRoute.slice(1);
      const result = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({token}),
      });
      const json = await result.json();
      console.log("JSON RESULT", json);
      return "Successfully connected crosspost account";
    },
  },
};

addGraphQLResolvers(crosspostResolvers);
addGraphQLMutation("connectCrossposter(token: String): String");

export const onCrosspostTokenRequest = async (req: Request, res: Response) => {
  const {user} = req;
  if (!user) {
    res.status(403).send("Unauthorized");
    return;
  }
  const secret = crosspostSigningKeySetting.get();
  if (!secret?.length) {
    res.status(500).send("Missing crosspost signing secret env var");
    return;
  }
  const payload: ConnectCrossposterPayload = {userId: user._id};
  const token = jwt.sign(payload, secret, {algorithm: "HS256", expiresIn: "15m"});
  res.send({token});
}

export const onConnectCrossposterRequest = async (req: Request, res: Response) => {
  const {token} = req.body;
  if (!token?.length) {
    res.status(400).send("Missing token");
    return;
  }
  const secret = crosspostSigningKeySetting.get();
  if (!secret?.length) {
    res.status(500).send("Missing crosspost signing secret env var");
    return;
  }
  const payload = jwt.verify(token, secret) as ConnectCrossposterPayload;
  if (!payload?.userId?.length) {
    res.status(403).send("Unauthorized");
    return;
  }
  const {userId} = payload;
  res.send({status: "connected", userId});
}

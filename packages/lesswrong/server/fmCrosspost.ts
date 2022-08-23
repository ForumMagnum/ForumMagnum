import { DatabaseServerSetting } from "./databaseSettings";
import { addGraphQLMutation, addGraphQLSchema, addGraphQLResolvers, } from "../lib/vulcan-lib";
import { fmCrosspostBaseUrlSetting } from "../lib/instanceSettings";
import Users from "../lib/collections/users/collection";
import fetch from "node-fetch";
import jwt from "jsonwebtoken";
import type { Request, Response } from "express";

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
      const localUserId = req?.user?._id;
      if (!localUserId) {
        throw new Error("You must login to do this");
      }
      const apiUrl = fmCrosspostBaseUrlSetting.get() + connectCrossposterApiRoute.slice(1);
      const result = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          localUserId,
        }),
      });
      const json = await result.json();
      if (json.status !== "connected") {
        throw new Error("Couldn't connect accounts");
      }
      const {foreignUserId} = json;
      await Users.rawUpdateOne({_id: localUserId}, {
        $set: {
          fmCrosspostUserId: foreignUserId,
        },
      });
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
  const token = jwt.sign(payload, secret, {algorithm: "HS256", expiresIn: "30m"});
  res.send({token});
}

export const onConnectCrossposterRequest = async (req: Request, res: Response) => {
  const {token, localUserId} = req.body;
  if (!token?.length) {
    res.status(400).send("Missing token");
    return;
  }
  if (!localUserId?.length) {
    res.status(400).send("Missing local user id");
    return;
  }
  const secret = crosspostSigningKeySetting.get();
  if (!secret?.length) {
    res.status(500).send("Missing crosspost signing secret env var");
    return;
  }
  try {
    const payload = jwt.verify(token, secret) as ConnectCrossposterPayload;
    if (!payload?.userId?.length) {
      throw new Error("Missing user id");
    }
    const {userId: foreignUserId} = payload;
    await Users.rawUpdateOne({_id: foreignUserId}, {
      $set: {
        fmCrosspostUserId: localUserId,
      },
    });
    res.send({
      status: "connected",
      foreignUserId,
      localUserId,
    });
  } catch {
    res.status(403).send("Unauthorized");
  }
}

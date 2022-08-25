import { DatabaseServerSetting } from "./databaseSettings";
import { Utils, addGraphQLMutation, addGraphQLSchema, addGraphQLResolvers } from "../lib/vulcan-lib";
import { fmCrosspostBaseUrlSetting } from "../lib/instanceSettings";
import Users from "../lib/collections/users/collection";
import Posts from "../lib/collections/posts/collection";
import fetch from "node-fetch";
import jwt from "jsonwebtoken";
import bodyParser from "body-parser";
import type { Application, Request, Response } from "express";

const crosspostTokenApiRoute = "/api/crosspostToken";
const connectCrossposterApiRoute = "/api/connectCrossposter";
const unlinkCrossposterApiRoute = "/api/unlinkCrossposter";
const crosspostApiRoute = "/api/crosspost";

const crosspostSigningKeySetting = new DatabaseServerSetting<string|null>("fmCrosspostSigningKey", null);

const algorithm = "HS256";
const expiresIn = "30m";

type ConnectCrossposterArgs = {
  token: string,
}

type ConnectCrossposterPayload = {
  userId: string,
}

type UnlinkCrossposterPayload = {
  userId: string,
}

type CrosspostPayload = {
  localUserId: string,
  foreignUserId: string,
}

const getUserId = (req?: Request) => {
  const userId = req?.user?._id;
  if (!userId) {
    throw new Error("You must login to do this");
  }
  return userId;
}

const makeApiUrl = (route: string) => fmCrosspostBaseUrlSetting.get() + route.slice(1)

const makeInternalRequest = async <T extends {}>(
  route: string,
  body: T,
  expectedStatus: string,
  onErrorMessage: string,
) => {
  const result = await fetch(makeApiUrl(route), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const json = await result.json();
  if (json.status !== expectedStatus) {
    throw new Error(onErrorMessage);
  }
  return json;
}

const crosspostResolvers = {
  Mutation: {
    connectCrossposter: async (
      root: void,
      {token}: ConnectCrossposterArgs,
      {req, res}: ResolverContext,
    ) => {
      const localUserId = getUserId(req);
      const {foreignUserId} = await makeInternalRequest(
        connectCrossposterApiRoute,
        {token, localUserId},
        "connected",
        "Failed to connect accounts for crossposting",
      );
      await Users.rawUpdateOne({_id: localUserId}, {
        $set: {fmCrosspostUserId: foreignUserId},
      });
      return "success";
    },
    unlinkCrossposter: async (root: void, {}: {}, {req, res}: ResolverContext) => {
      const localUserId = getUserId(req);
      const foreignUserId = req?.user?.fmCrosspostUserId;
      if (foreignUserId) {
        const secret = crosspostSigningKeySetting.get();
        if (!secret) {
          throw new Error("Missing crosspost signing secret env var");
        }
        const token = jwt.sign({userId: foreignUserId}, secret, {algorithm, expiresIn});
        await makeInternalRequest(
          unlinkCrossposterApiRoute,
          {token},
          "unlinked",
          "Failed to unlink crossposting accounts",
        );
        await Users.rawUpdateOne({_id: localUserId}, {
          $unset: {fmCrosspostUserId: ""},
        });
      }
      return "success";
    },
  },
};

addGraphQLResolvers(crosspostResolvers);
addGraphQLMutation("connectCrossposter(token: String): String");
addGraphQLMutation("unlinkCrossposter: String");

const onCrosspostTokenRequest = async (req: Request, res: Response) => {
  const {user} = req;
  if (!user) {
    res.status(403).send({error: "Unauthorized"});
    return;
  }

  const secret = crosspostSigningKeySetting.get();
  if (!secret) {
    res.status(500).send({error: "Missing crosspost signing secret env var"});
    return;
  }

  const payload: ConnectCrossposterPayload = {userId: user._id};
  const token = jwt.sign(payload, secret, {algorithm, expiresIn});
  res.send({token});
}

const onConnectCrossposterRequest = async (req: Request, res: Response) => {
  const {token, localUserId} = req.body;
  if (!token || !localUserId) {
    res.status(400).send({error: "Missing parameters", body: req.body});
    return;
  }

  const secret = crosspostSigningKeySetting.get();
  if (!secret) {
    res.status(500).send({error: "Missing crosspost signing secret env var"});
    return;
  }

  try {
    const payload = jwt.verify(token, secret) as ConnectCrossposterPayload;
    if (!payload?.userId) {
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
  } catch (e) {
    res.status(403).send({error: `Unauthorized: ${e.message}`});
  }
}

const onUnlinkCrossposterRequest = async (req: Request, res: Response) => {
  const {token} = req.body;
  if (!token) {
    res.status(400).send({error: "Missing parameters", body: req.body});
    return;
  }

  const secret = crosspostSigningKeySetting.get();
  if (!secret) {
    res.status(500).send({error: "Missing crosspost signing secret env var"});
    return;
  }

  try {
    const payload = jwt.verify(token, secret) as UnlinkCrossposterPayload;
    if (!payload?.userId) {
      throw new Error("Missing user id");
    }
    const {userId} = payload;
    await Users.rawUpdateOne({_id: userId}, {
      $unset: {fmCrosspostUserId: ""},
    });
    res.send({status: "unlinked"});
  } catch (e) {
    res.status(403).send({error: `Unauthorized: ${e.message}`});
  }
}

const onCrosspostRequest = async (req: Request, res: Response) => {
  const {token, postId, postTitle} = req.body;
  if (!token || !postId || !postTitle) {
    res.status(400).send({error: "Missing parameters", body: req.body});
    return;
  }

  const secret = crosspostSigningKeySetting.get();
  if (!secret) {
    res.status(500).send({error: "Missing crosspost signing secret env var"});
    return;
  }

  try {
    const payload = jwt.verify(token, secret) as CrosspostPayload;
    const {localUserId, foreignUserId} = payload;
    if (!localUserId || !foreignUserId) {
      throw new Error("Invalid token");
    }

    const user = await Users.findOne({_id: foreignUserId});
    if (!user) {
      throw new Error("Invalid user");
    }

    const document: Partial<DbPost> = {
      title: postTitle,
      userId: user._id,
      fmCrosspost: {
        isCrosspost: true,
        hostedHere: false,
        foreignPostId: postId,
      },
    };

    const {data: post} = await Utils.createMutator({
      document,
      collection: Posts,
      validate: true,
      currentUser: user,
      context: {
        currentUser: user,
        Users,
      },
    });

    res.send({
      status: "posted",
      postId: post._id,
    });
  } catch (e) {
    res.status(403).send({error: `Unauthorized: ${e.message}`});
  }
}

export const addCrosspostRoutes = (app: Application) => {
  app.get(crosspostTokenApiRoute, onCrosspostTokenRequest);
  app.use(connectCrossposterApiRoute, bodyParser.json({ limit: "1mb" }));
  app.post(connectCrossposterApiRoute, onConnectCrossposterRequest);
  app.use(unlinkCrossposterApiRoute, bodyParser.json({ limit: "1mb" }));
  app.post(unlinkCrossposterApiRoute, onUnlinkCrossposterRequest);
  app.use(crosspostApiRoute, bodyParser.json({ limit: "1mb" }));
  app.post(crosspostApiRoute, onCrosspostRequest);
}

export type Crosspost = Pick<DbPost, "_id" | "title" | "userId" | "fmCrosspost" | "draft">;

export const performCrosspost = async <T extends Crosspost>(post: T): Promise<T> => {
  if (!post.fmCrosspost || !post.userId || post.draft) {
    return post;
  }

  const {isCrosspost, hostedHere, foreignPostId} = post.fmCrosspost;
  if (!isCrosspost || !hostedHere || foreignPostId) {
    return post;
  }

  const user = await Users.findOne({_id: post.userId});
  if (!user || !user.fmCrosspostUserId) {
    throw new Error("You have not connected a crossposting account yet");
  }

  const secret = crosspostSigningKeySetting.get();
  if (!secret) {
    throw new Error("Missing crosspost signing secret env var");
  }
  const payload: CrosspostPayload = {
    localUserId: post.userId,
    foreignUserId: user.fmCrosspostUserId,
  };
  const token = jwt.sign(payload, secret, {algorithm, expiresIn});

  const apiUrl = makeApiUrl(crosspostApiRoute);
  const result = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      token,
      postId: post._id,
      postTitle: post.title,
    }),
  });
  const json = await result.json();
  if (json.status !== "posted" || !json.postId) {
    throw new Error(`Failed to create crosspost: ${JSON.stringify(json)}`);
  }

  post.fmCrosspost.foreignPostId = json.postId;
  return post;
}

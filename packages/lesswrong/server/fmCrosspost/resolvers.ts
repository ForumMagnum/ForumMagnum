import { addGraphQLMutation, addGraphQLResolvers } from "../../lib/vulcan-lib";
import Users from "../../lib/collections/users/collection";
import { UnauthorizedError, ApiError } from "./errors";
import type { ConnectCrossposterArgs, UnlinkCrossposterPayload } from "./types";
import { ApiRoute, apiRoutes, makeApiUrl } from "./routes";
import { signToken } from "./tokens";
import type { Request } from "express";
import { crosspostUserAgent } from "../../lib/apollo/links";

const getUserId = (req?: Request) => {
  const userId = req?.user?._id;
  if (!userId) {
    throw new UnauthorizedError();
  }
  return userId;
}

export const makeCrossSiteRequest = async <T extends {}>(
  route: ApiRoute,
  body: T,
  expectedStatus: string,
  onErrorMessage: string,
) => {
  const result = await fetch(makeApiUrl(route), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": crosspostUserAgent,
    },
    body: JSON.stringify(body),
  });
  const json = await result.json();
  if (json.status !== expectedStatus) {
    throw new ApiError(500, onErrorMessage);
  }
  return json;
}

const crosspostResolvers = {
  Mutation: {
    connectCrossposter: async (
      _root: void,
      {token}: ConnectCrossposterArgs,
      {req}: ResolverContext,
    ) => {
      const localUserId = getUserId(req);
      const {foreignUserId} = await makeCrossSiteRequest(
        apiRoutes.connectCrossposter,
        {token, localUserId},
        "connected",
        "Failed to connect accounts for crossposting",
      );
      await Users.rawUpdateOne({_id: localUserId}, {
        $set: {fmCrosspostUserId: foreignUserId},
      });
      return "success";
    },
    unlinkCrossposter: async (_root: void, _args: {}, {req}: ResolverContext) => {
      const localUserId = getUserId(req);
      const foreignUserId = req?.user?.fmCrosspostUserId;
      if (foreignUserId) {
        const token = await signToken<UnlinkCrossposterPayload>({userId: foreignUserId});
        await makeCrossSiteRequest(
          apiRoutes.unlinkCrossposter,
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

import type { Request } from "express";
import { isLeft } from 'fp-ts/Either';
import { crosspostUserAgent } from "../../lib/apollo/links";
import Users from "../../lib/collections/users/collection";
import { addGraphQLMutation, addGraphQLQuery, addGraphQLResolvers } from "../../lib/vulcan-lib";
import { ApiError, UnauthorizedError } from "./errors";
import { makeApiUrl, PostRequestTypes, PostResponseTypes, ValidatedPostRouteName, validatedPostRoutes, ValidatedPostRoutes } from "./routes";
import { signToken } from "./tokens";
import { ConnectCrossposterArgs, GetCrosspostRequest, UnlinkCrossposterPayload } from "./types";

const getUserId = (req?: Request) => {
  const userId = req?.user?._id;
  if (!userId) {
    throw new UnauthorizedError();
  }
  return userId;
}

export const makeCrossSiteRequest = async <RouteName extends ValidatedPostRouteName>(
  routeName: RouteName,
  body: PostRequestTypes<RouteName>,
  onErrorMessage: string,
): Promise<PostResponseTypes<RouteName>> => {
  const route: ValidatedPostRoutes[RouteName] = validatedPostRoutes[routeName];
  const apiUrl = makeApiUrl(route.path);
  const result = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": crosspostUserAgent,
    },
    body: JSON.stringify(body),
  });
  const json = await result.json();
  const validatedResponse = route.responseValidator.decode(json);
  if (isLeft(validatedResponse)) {
    // eslint-disable-next-line no-console
    console.error("Cross-site request failed:", json);
    throw new ApiError(500, onErrorMessage);    
  }
  
  return validatedResponse.right;
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
        'connectCrossposter',
        {token, localUserId},
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
          'unlinkCrossposter',
          {token},
          "Failed to unlink crossposting accounts",
        );
        await Users.rawUpdateOne({_id: localUserId}, {
          $unset: {fmCrosspostUserId: ""},
        });
      }
      return "success";
    },
  },
  Query: {
    getCrosspost: async (_root: void, { args }: { args: GetCrosspostRequest }) => {
      const crosspostData = await makeCrossSiteRequest(
        'getCrosspost',
        args,
        'Failed to get crosspost'
      );

      return crosspostData.document;
    }
  }
};

addGraphQLResolvers(crosspostResolvers);
addGraphQLMutation("connectCrossposter(token: String): String");
addGraphQLMutation("unlinkCrossposter: String");
addGraphQLQuery("getCrosspost(args: JSON): JSON");

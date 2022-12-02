import type { Request } from "express";
import { isLeft } from 'fp-ts/Either';
import { crosspostUserAgent } from "../../lib/apollo/links";
import Users from "../../lib/collections/users/collection";
import { addGraphQLMutation, addGraphQLQuery, addGraphQLResolvers } from "../../lib/vulcan-lib";
import { ApiError, UnauthorizedError } from "./errors";
import { validateCrosspostingKarmaThreshold } from "./helpers";
import { makeApiUrl, PostRequestTypes, PostResponseTypes, ValidatedPostRouteName, validatedPostRoutes, ValidatedPostRoutes } from "./routes";
import { signToken } from "./tokens";
import { ConnectCrossposterArgs, GetCrosspostRequest, UnlinkCrossposterPayload } from "./types";

export const TOS_NOT_ACCEPTED_ERROR = 'You must accept the terms of use before you can publish this post';
export const TOS_NOT_ACCEPTED_REMOTE_ERROR = 'You must read and accept the Terms of Use on the EA Forum in order to crosspost.  To do so, go to https://forum.effectivealtruism.org/newPost and accept the Terms of Use presented above the draft post.';

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
    let errorMessage = onErrorMessage;
    // TODO: temporary patch for surfacing 
    if ('error' in json && json.error === TOS_NOT_ACCEPTED_ERROR) {
      errorMessage = TOS_NOT_ACCEPTED_REMOTE_ERROR;
    }
    throw new ApiError(500, errorMessage);
  }
  
  return validatedResponse.right;
}

const crosspostResolvers = {
  Mutation: {
    connectCrossposter: async (
      _root: void,
      {token}: ConnectCrossposterArgs,
      {req, currentUser}: ResolverContext,
    ) => {
      const localUserId = getUserId(req);

      // Throws an error if user doesn't have enough karma on the receiving forum (which is the current execution environment)
      validateCrosspostingKarmaThreshold(currentUser);

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

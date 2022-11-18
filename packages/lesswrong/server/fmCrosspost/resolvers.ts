import type { Request } from "express";
import { isLeft } from 'fp-ts/Either';
import { crosspostUserAgent } from "../../lib/apollo/links";
import Users from "../../lib/collections/users/collection";
import { addGraphQLMutation, addGraphQLQuery, addGraphQLResolvers } from "../../lib/vulcan-lib";
import { DatabaseServerSetting } from "../databaseSettings";
import { ApiError, InsufficientKarmaError, InvalidUserError, UnauthorizedError } from "./errors";
import { makeApiUrl, PostRequestTypes, PostResponseTypes, ValidatedPostRouteName, validatedPostRoutes, ValidatedPostRoutes } from "./routes";
import { signToken } from "./tokens";
import { ConnectCrossposterArgs, GetCrosspostRequest, UnlinkCrossposterPayload } from "./types";

const targetForumCrosspostKarmaThreshold = new DatabaseServerSetting<number | null>('crosspostKarmaThreshold', 100);

const getUserId = (req?: Request) => {
  const userId = req?.user?._id;
  if (!userId) {
    throw new UnauthorizedError();
  }
  return userId;
}

/**
 * Check if the user on the *target* forum has enough karma to be allowed to crosspost from the source forum.
 * 
 * Ex: if a user has 0 karma on LW, and attempts to link accounts to crosspost from the EA Forum, they will get this error, because LW requires you to have a 100 karma account *on LW* to crosspost from the EA Forum.
 * This is true regardless of how much karma they have on the EA Forum.  (This holds in both directions.)
 */
const validateCrosspostingKarmaThreshold = (currentUser: DbUser | null) => {
  if (!currentUser) {
    throw new InvalidUserError();
  }

  // Despite the generated type, karma is in fact missing by default for new users who haven't had anything of theirs voted on
  // Numeric comparisons to `undefined` always return false!
  const userKarma = currentUser.karma ?? 0;

  const currentKarmaThreshold = targetForumCrosspostKarmaThreshold.get();
  if (currentKarmaThreshold !== null && currentKarmaThreshold > userKarma) {
    throw new InsufficientKarmaError(currentKarmaThreshold);
  }
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

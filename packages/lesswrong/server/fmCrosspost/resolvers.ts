import type { Request } from "express";
import { isLeft } from 'fp-ts/Either';
import { crosspostUserAgent } from "../../lib/apollo/links";
import {
  ApiError,
  UnauthorizedError,
  TOS_NOT_ACCEPTED_ERROR,
  TOS_NOT_ACCEPTED_REMOTE_ERROR,
} from "./errors";
import {
  assertCrosspostingKarmaThreshold,
  fmCrosspostTimeoutMsSetting,
} from "./helpers";
import { makeApiUrl, PostRequestTypes, PostResponseTypes, ValidatedPostRouteName, validatedPostRoutes, ValidatedPostRoutes } from "./routes";
import { ConnectCrossposterArgs, GetCrosspostRequest } from "./types";
import stringify from "json-stringify-deterministic";
import LRU from "lru-cache";
import { isE2E } from "@/lib/executionEnvironment";
import { connectCrossposterToken } from "../crossposting/tokens";
import { makeV2CrossSiteRequest } from "../crossposting/crossSiteRequest";
import {
  connectCrossposterRoute,
  unlinkCrossposterRoute,
} from "@/lib/fmCrosspost/routes";
import gql from "graphql-tag";

const getUserId = (req?: Request) => {
  const userId = req?.user?._id;
  if (!userId) {
    throw new UnauthorizedError();
  }
  return userId;
}

const foreignPostCache = new LRU<string, Promise<AnyBecauseHard>>({
  maxAge: 1000 * 60 * 30, // 30 minute TTL
  updateAgeOnGet: false,
  max: 100,
});

/**
 * @deprecated
 * Old version of `makeCrossSiteRequest` - use `makeV2CrossSiteRequest` instead.
 * This is still here to support the `getCrosspost` graphql query, which will be
 * removed once crosspost bodies are denormalized across sites.
 */
const makeCrossSiteRequest = async <RouteName extends ValidatedPostRouteName>(
  routeName: RouteName,
  body: PostRequestTypes<RouteName>,
  onErrorMessage: string,
): Promise<PostResponseTypes<RouteName>> => {
  const route: ValidatedPostRoutes[RouteName] = validatedPostRoutes[routeName];
  const apiUrl = makeApiUrl(route.path);
  let result: Response;

  const controller = new AbortController();
  // Timeout early to avoid this causing frontpage loads to time out
  const timeoutId = setTimeout(() => controller.abort(), fmCrosspostTimeoutMsSetting.get());

  try {
    result = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": crosspostUserAgent,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (e) {
    clearTimeout(timeoutId); // Clear the timeout when an error occurs

    if (e.name === 'AbortError') {
      throw new ApiError(500, "Crosspost request timed out");
    }

    if (e.cause?.code === 'ECONNREFUSED' && e.cause?.port === 4000) {
      // We're testing locally, and the x-post server isn't running
      return { document: {} }
    } else {
      throw e
    }
  }

  clearTimeout(timeoutId); // Clear the timeout when the request completes

  // Assertion is safe because either we got a result or we threw an error or returned
  const json = await result!.json();
  const validatedResponse = route.responseValidator.decode(json);
  if (isLeft(validatedResponse) || 'error' in json) {
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

export const fmCrosspostGraphQLTypeDefs = gql`
  extend type Mutation {
    connectCrossposter(token: String): String
    unlinkCrossposter: String
  }
  extend type Query {
    getCrosspost(args: JSON): JSON
  }
`

export const fmCrosspostGraphQLMutations = {
  connectCrossposter: async (
    _root: void,
    {token}: ConnectCrossposterArgs,
    {req, currentUser, Users}: ResolverContext,
  ) => {
    const localUserId = getUserId(req);
    assertCrosspostingKarmaThreshold(currentUser);
    const {foreignUserId} = await makeV2CrossSiteRequest(
      connectCrossposterRoute,
      {token, localUserId},
      "Failed to connect accounts for crossposting",
    );
    await Users.rawUpdateOne({_id: localUserId}, {
      $set: {fmCrosspostUserId: foreignUserId},
    });
    return "success";
  },
  unlinkCrossposter: async (_root: void, _args: {}, {req, Users}: ResolverContext) => {
    const localUserId = getUserId(req);
    const foreignUserId = req?.user?.fmCrosspostUserId;
    if (foreignUserId) {
      const token = await connectCrossposterToken.create({
        userId: foreignUserId,
      });
      await makeV2CrossSiteRequest(
        unlinkCrossposterRoute,
        {token},
        "Failed to unlink crossposting accounts",
      );
      await Users.rawUpdateOne({_id: localUserId}, {
        $unset: {fmCrosspostUserId: ""},
      });
      return "success";
    }
  },
}

export const fmCrosspostGraphQLQueries = {
  getCrosspost: async (_root: void, {args}: {args: GetCrosspostRequest}) => {
    const key = stringify(args);
    let promise = isE2E ? null : foreignPostCache.get(key);
    if (!promise) {
      promise = makeCrossSiteRequest(
        'getCrosspost',
        args,
        'Failed to get crosspost'
      );
      foreignPostCache.set(key, promise);
    }
    const {document} = await promise;
    return document;
  }
}

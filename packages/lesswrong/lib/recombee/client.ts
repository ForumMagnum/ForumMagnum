import type { ForumTypeString } from "@/lib/instanceSettings";
import { AddDetailView, AddRating, ApiClient, SetViewPortion, TimeoutError, type Request as RecombeeRequest } from 'recombee-js-api-client';
import { captureException } from '@/lib/sentryWrapper';
import { recombeeDatabaseIdSetting, recombeePublicApiTokenSetting } from '../instanceSettings';

export interface RecombeeViewPortionProps {
  timestamp: Date;
  userId: string;
  postId: string;
  portion: number;
  recommId?: string;
}

const getRecombeeClientOrThrow = (() => {
  const clients = new Map<ForumTypeString, ApiClient>();

  return (forumType: ForumTypeString) => {
    let client = clients.get(forumType);
    if (!client) {
      const databaseId = recombeeDatabaseIdSetting.get(forumType);
      const apiToken = recombeePublicApiTokenSetting.get(forumType);

      if (!databaseId || !apiToken) {
        throw new Error('Missing either databaseId or api token when initializing Recombee client!');
      }
      
      // TODO - pull out client options like region to db settings?
      client = new ApiClient(databaseId, apiToken, { region: 'us-west' });
      clients.set(forumType, client);
    }

    return client;
  };
})();

const voteTypeRatingsMap: Partial<Record<string, number>> = {
  bigDownvote: -1,
  smallDownvote: -0.5,
  neutral: 0,
  smallUpvote: 0.5,
  bigUpvote: 1,
};

const recombeeRequestHelpers = {
  createViewPortionRequest(viewPortionProps: RecombeeViewPortionProps) {
    const { userId, postId, portion, timestamp, recommId } = viewPortionProps;
    return new SetViewPortion(userId, postId, portion, {
      timestamp: timestamp.toISOString(), 
      cascadeCreate: false,
      recommId: recommId
    });
  },

  createDetailViewRequest(postId: string, userId: string, recommId?: string) {
    return new AddDetailView(userId, postId, {
      timestamp: new Date().toISOString(),
      recommId,
      cascadeCreate: false
    });
  },

  createRatingRequest(postId: string, userId: string, voteType: string, recommId?: string) {
    const rating = voteTypeRatingsMap[voteType];
    if (typeof rating !== 'number') {
      // eslint-disable-next-line no-console
      console.log(`Attempted to create a recombee rating request for a non-karma vote on post with id ${postId}, voteType: ${voteType}`);
      return;
    }

    return new AddRating(userId, postId, rating, {
      timestamp: new Date().toISOString(),
      recommId,
      cascadeCreate: false
    });
  },

  shouldLogRecombeeError(error: AnyBecauseIsInput, isLoggedIn: boolean) {
    const isTimeoutError = error instanceof TimeoutError;
    const hasStatusCode = 'statusCode' in error;
    const statusCode = hasStatusCode ? error.statusCode : undefined;
    const isNotFoundOrConflict = statusCode === 404 || statusCode === 409;
    const isLoggedOutBotRejection = !isLoggedIn
      && statusCode === 403
      && !!error.message?.includes('user is considered a bot');

    // If there isn't a statusCode, then it's not a standard recombee error and we should definitely log it to Sentry
    // 404 generally indicates a missing userId or itemId with cascadeCreate not set to true
    // This can happen if we've e.g. failed to prevent an event from getting sent for a post that shouldn't (and doesn't) exist in recombee
    // 409 generally indicates we're trying to create/set something which already exists in recombee, i.e. a detail view for a given post by a given user
    // See https://docs.recombee.com/api for more specific details
    // Timeout errors are just noisy and we should skip logging them
    // 403 "user is considered a bot" is Recombee rejecting the client as a bot. For logged-out clients it's
    // usually right and we skip logging it, but if it happens to a logged-in user we want to know
    return !(isTimeoutError || isNotFoundOrConflict || isLoggedOutBotRejection);
  },
}

async function sendRecombeeRequest(client: ApiClient, request: RecombeeRequest, isLoggedIn: boolean) {
  try {
    await client.send(request);
  } catch (error) {
    if (recombeeRequestHelpers.shouldLogRecombeeError(error, isLoggedIn)) {
      captureException(error);
    }
  }
}

const recombeeApi = {
  async createViewPortion(viewPortionProps: RecombeeViewPortionProps, isLoggedIn: boolean, forumType: ForumTypeString) {
    const client = getRecombeeClientOrThrow(forumType);
    const request = recombeeRequestHelpers.createViewPortionRequest(viewPortionProps);
    await sendRecombeeRequest(client, request, isLoggedIn);
  },

  async createDetailView(postId: string, userId: string, isLoggedIn: boolean, forumType: ForumTypeString, recommId?: string) {
    const client = getRecombeeClientOrThrow(forumType);
    const request = recombeeRequestHelpers.createDetailViewRequest(postId, userId, recommId);
    await sendRecombeeRequest(client, request, isLoggedIn);
  },

  async createRating(postId: string, userId: string, voteType: string, forumType: ForumTypeString, recommId?: string) {
    const client = getRecombeeClientOrThrow(forumType);
    const request = recombeeRequestHelpers.createRatingRequest(postId, userId, voteType, recommId);
    if (!request) {
      return;
    }
    // Ratings come from votes and feed feedback, which require being logged in
    await sendRecombeeRequest(client, request, true);
  },
}

export { recombeeRequestHelpers, recombeeApi }

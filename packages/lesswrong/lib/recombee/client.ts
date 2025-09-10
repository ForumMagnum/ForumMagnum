import { AddDetailView, AddRating, ApiClient, SetViewPortion } from 'recombee-js-api-client';
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
  let client: ApiClient;

  return () => {
    if (!client) {
      const databaseId = recombeeDatabaseIdSetting.get();
      const apiToken = recombeePublicApiTokenSetting.get();

      if (!databaseId || !apiToken) {
        throw new Error('Missing either databaseId or api token when initializing Recombee client!');
      }
      
      // TODO - pull out client options like region to db settings?
      client = new ApiClient(databaseId, apiToken, { region: 'us-west' });
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

  shouldLogRecombeeError(error: AnyBecauseIsInput) {
    // If there isn't a statusCode, then it's not a standard recombee error and we should definitely log it to Sentry
    // 404 generally indicates a missing userId or itemId with cascadeCreate not set to true
    // This can happen if we've e.g. failed to prevent an event from getting sent for a post that shouldn't (and doesn't) exist in recombee
    // 409 generally indicates we're trying to create/set something which already exists in recombee, i.e. a detail view for a given post by a given user
    // See https://docs.recombee.com/api for more specific details
    return !('statusCode' in error) || (error.statusCode !== 404 && error.statusCode !== 409);
  },
}


const recombeeApi = {
  async createViewPortion(viewPortionProps: RecombeeViewPortionProps) {
    const client = getRecombeeClientOrThrow();
    const request = recombeeRequestHelpers.createViewPortionRequest(viewPortionProps);

    try {
      await client.send(request);
    } catch (error) {
      if (recombeeRequestHelpers.shouldLogRecombeeError(error)) {
        captureException(error);
      }
    }
  },

  async createDetailView(postId: string, userId: string, recommId?: string) {
    const client = getRecombeeClientOrThrow();
    const request = recombeeRequestHelpers.createDetailViewRequest(postId, userId, recommId);

    try {
      await client.send(request);
    } catch (error) {
      if (recombeeRequestHelpers.shouldLogRecombeeError(error)) {
        captureException(error);
      }
    }
  },

  async createRating(postId: string, userId: string, voteType: string, recommId?: string) {
    const client = getRecombeeClientOrThrow();
    const request = recombeeRequestHelpers.createRatingRequest(postId, userId, voteType, recommId);
    if (!request) {
      return;
    }

    try {
      await client.send(request);
    } catch (error) {
      if (recombeeRequestHelpers.shouldLogRecombeeError(error)) {
        captureException(error);
      }
    }
  },
}

export { recombeeRequestHelpers, recombeeApi }

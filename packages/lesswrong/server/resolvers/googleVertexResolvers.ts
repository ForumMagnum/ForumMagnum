import gql from "graphql-tag";
import { googleVertexApi, helpers as googleVertexHelpers } from "../google-vertex/client";
import type { PostEvent } from "../google-vertex/types";
import { captureException } from "@sentry/nextjs";

export const googleVertexGqlTypeDefs = gql`
  extend type Mutation {
    sendVertexViewItemEvent(postId: String!, attributionId: String): Boolean!
    sendVertexMediaCompleteEvent(postId: String!, attributionId: String): Boolean!
    sendVertexViewHomePageEvent: Boolean!
  }
`

export const googleVertexGqlMutations = {
  sendVertexViewItemEvent (root: void, args: { postId: string, attributionId: string | null }, context: ResolverContext) {
    const { currentUser } = context;

    try {
      if (!currentUser) {
        throw new Error('Must be logged in to record Vertex events');
      }

      const { postId, attributionId } = args;
      const now = new Date();
      const eventInfo: PostEvent = { userId: currentUser._id, postId, timestamp: now, attributionId };
      const viewItemEvent = googleVertexHelpers.createViewItemEvent('view-item', eventInfo);
      const mediaPlayEvent = googleVertexHelpers.createViewItemEvent('media-play', eventInfo);
  
      void googleVertexApi.writeUserEvent(viewItemEvent);
      void googleVertexApi.writeUserEvent(mediaPlayEvent);
      return true;
    } catch(e) {
      captureException(e);
      return false;
    }
  },
  sendVertexViewHomePageEvent (root: void, args: void, context: ResolverContext) {
    const { currentUser } = context;

    try {
      if (!currentUser) {
        throw new Error('Must be logged in to record Vertex events');
      }
      
      const now = new Date();
      const viewHomePageEvent = googleVertexHelpers.createViewHomePageEvent({ userId: currentUser._id, timestamp: now });
  
      void googleVertexApi.writeUserEvent(viewHomePageEvent);
      return true;
    } catch(e) {
      captureException(e);
      return false;
    }
  },
  sendVertexMediaCompleteEvent (root: void, args: { postId: string, attributionId: string | null }, context: ResolverContext) {
    const { currentUser } = context;

    try {
      if (!currentUser) {
        throw new Error('Must be logged in to record Vertex events');
      }

      const { postId, attributionId } = args;
      const now = new Date();
      const eventInfo: PostEvent = { userId: currentUser._id, postId, timestamp: now, attributionId };
      const mediaCompleteEvent = googleVertexHelpers.createMediaCompleteEvent(eventInfo);
  
      void googleVertexApi.writeUserEvent(mediaCompleteEvent);
      return true;
    } catch(e) {
      captureException(e);
      return false;
    }
  }
}

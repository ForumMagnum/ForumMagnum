import { googleVertexApi, helpers as googleVertexHelpers } from "../google-vertex/client";
import { defineMutation } from "../utils/serverGraphqlUtil";
import type { PostEvent } from "../google-vertex/types";
import { captureException } from "@sentry/core";

defineMutation({
  name: 'sendVertexViewItemEvent',
  argTypes: '(postId: String!, attributionId: String)',
  resultType: 'Boolean!',
  fn(root, args: { postId: string, attributionId: string | null }, context) {
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
});

defineMutation({
  name: 'sendVertexMediaCompleteEvent',
  argTypes: '(postId: String!, attributionId: String)',
  resultType: 'Boolean!',
  fn(root, args: { postId: string, attributionId: string | null }, context) {
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
  },
});

defineMutation({
  name: 'sendVertexViewHomePageEvent',
  resultType: 'Boolean!',
  fn(root, args, context) {
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
});

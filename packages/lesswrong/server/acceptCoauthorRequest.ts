import { accessFilterSingle } from '../lib/utils/schemaUtils';
import { createNotification } from './notificationCallbacksHelpers';
import gql from 'graphql-tag';
import { createAnonymousContext } from "@/server/vulcan-lib/createContexts";
import { updatePost } from './collections/posts/mutations';

export const acceptCoauthorRequestTypeDefs = gql`
  extend type Mutation {
    acceptCoauthorRequest(postId: String, userId: String, accept: Boolean): Post
  }
`
export const acceptCoauthorRequestMutations = {
  async acceptCoauthorRequest(root: void, {postId, userId, accept}: {postId: string, userId: string, accept: boolean}, context: ResolverContext) {
    const { currentUser, Posts } = context;
    let post = await context.loaders.Posts.load(postId);

    if (!post.coauthorStatuses) {
      throw new Error('User has not been requested as a co-author for this post');
    }

    const index = post.coauthorStatuses.findIndex((author) => author.userId === userId && !author.confirmed);
    if (index < 0) {
      throw new Error('User has not been requested as a co-author for this post');
    }

    if (accept) {
      post.coauthorStatuses[index].confirmed = true;
      await createNotification({
        userId: post.userId,
        notificationType: 'coauthorAcceptNotification',
        documentType: 'post',
        documentId: postId,
        context,
      });
    } else {
      post.coauthorStatuses = post.coauthorStatuses.filter((author) => author.userId !== userId);
      post.shareWithUsers = [ ...(post.shareWithUsers ?? []), userId ];
    }

    let postedAt = post.postedAt;
    const now = new Date();
    if (postedAt > now && post.coauthorStatuses.filter(({ confirmed }) => !confirmed).length < 1) {
      postedAt = now;
    }

    const updatedPost = (
      await updatePost({
        data: {
          coauthorStatuses: post.coauthorStatuses,
          shareWithUsers: post.shareWithUsers,
          postedAt,
        },
        selector: { _id: postId },
      }, createAnonymousContext(), true)
    );

    return await accessFilterSingle(currentUser, 'Posts', updatedPost, context);
  },
}

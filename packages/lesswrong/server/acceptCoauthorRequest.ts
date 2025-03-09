import { Posts } from '../server/collections/posts/collection';
import { accessFilterSingle } from '../lib/utils/schemaUtils';
import { createNotification } from './notificationCallbacksHelpers';
import { addGraphQLMutation, addGraphQLResolvers } from "../lib/vulcan-lib/graphql";
import { updateMutator } from "./vulcan-lib/mutators";

addGraphQLMutation('acceptCoauthorRequest(postId: String, userId: String, accept: Boolean): Post');
addGraphQLResolvers({
  Mutation: {
    async acceptCoauthorRequest(root: void, {postId, userId, accept}: {postId: string, userId: string, accept: boolean}, context: ResolverContext) {
      const { currentUser } = context;
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

      const updatedPost = (await updateMutator({
        collection: Posts,
        documentId: postId,
        set: {
          coauthorStatuses: post.coauthorStatuses,
          shareWithUsers: post.shareWithUsers,
          postedAt,
        },
        validate: false
      })).data;

      return await accessFilterSingle(currentUser, 'Posts', updatedPost, context);
    },
  },
});

import { addGraphQLMutation, addGraphQLResolvers } from '../lib/vulcan-lib/graphql';
import Users from '../lib/collections/users/collection';
import { accessFilterSingle } from '../lib/utils/schemaUtils';
import { updateMutator } from './vulcan-lib/mutators';
import some from 'lodash/some'
import reject from 'lodash/reject'

addGraphQLMutation('setIsHidden(postId: String!, isHidden: Boolean!): User!');
addGraphQLResolvers({
  Mutation: {
    async setIsHidden(root: void, {postId,isHidden: isHidden}: {postId: string, isHidden: boolean}, context: ResolverContext): Promise<Partial<DbUser>> {
      const {currentUser} = context;
      if (!currentUser)
        throw new Error("Log in to hide posts");
      
      // FIXME: this has a race condition with multiple hiding at the same time where last write wins.
      // This would be better if we either change from a list data model to separate objects, or move
      // to leveraging inserts and removals in Mongo vs. writing the whole list
      const oldHiddenList = currentUser.hiddenPostsMetadata || [];

      let newHiddenList: Array<{postId: string}>;
      if (isHidden) {
        const alreadyHidden = some(oldHiddenList, hiddenMetadata => hiddenMetadata.postId === postId)
        if (alreadyHidden) {
          newHiddenList = oldHiddenList;
        } else {
          newHiddenList = [...oldHiddenList, {postId: postId}]
        }
      } else {
          newHiddenList = reject(oldHiddenList, hiddenMetadata=>hiddenMetadata.postId===postId)
      }
      
      await updateMutator({
        collection: Users,
        documentId: currentUser._id,
        set: {hiddenPostsMetadata: newHiddenList},
        currentUser, context,
        validate: false,
      });
      
      const updatedUser = await Users.findOne(currentUser._id)!;
      return (await accessFilterSingle(currentUser, Users, updatedUser, context))!;
    }
  }
});

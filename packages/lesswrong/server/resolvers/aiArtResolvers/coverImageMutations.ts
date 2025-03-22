import { defineMutation } from '@/server/utils/serverGraphqlUtil';
import { generateCoverImagesForPost } from '@/server/scripts/generativeModels/coverImages-2023Review';
import { userIsAdmin } from '@/lib/vulcan-users/permissions';

defineMutation({
  name: 'generateCoverImagesForPost',
  argTypes: '(postId: String!)',
  resultType: 'Boolean',
  fn: async (_root: any, { postId }: { postId: string }, { currentUser }: { currentUser: any }) => {
    if (!currentUser || !userIsAdmin(currentUser)) {
      throw new Error('You must be an admin to generate cover images');
    }
    
    try {
      await generateCoverImagesForPost(postId);
      return true;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error generating cover images:', error);
      throw new Error(`Error generating cover images: ${error.message}`);
    }
  },
}); 
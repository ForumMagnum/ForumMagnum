import { defineMutation } from '@/server/utils/serverGraphqlUtil';
import { generateCoverImagesForPost } from '@/server/scripts/generativeModels/coverImages-2023Review';
import { userIsAdmin } from '@/lib/vulcan-users/permissions';

defineMutation({
  name: 'generateCoverImagesForPost',
  argTypes: '(postId: String!, prompt: String)',
  resultType: 'JSON',
  fn: async (_root: any, { postId, prompt }: { postId: string, prompt?: string }, { currentUser }: { currentUser: any }) => {
    if (!currentUser || !userIsAdmin(currentUser)) {
      throw new Error('You must be an admin to generate cover images');
    }
    try {
      const results = await generateCoverImagesForPost(postId, prompt);
      return results;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error generating cover images:', error);
      throw new Error(`Error generating cover images: ${error.message}`);
    }
  },
});

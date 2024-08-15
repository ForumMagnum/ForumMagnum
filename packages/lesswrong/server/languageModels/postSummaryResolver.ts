import { Posts } from '../../lib/collections/posts/collection';
import { augmentFieldsDict } from '../../lib/utils/schemaUtils'
import { dataToMarkdown } from '../editor/conversionUtils';
import { fetchFragmentSingle } from '../fetchFragment';
import { languageModelGenerateText } from './languageModelIntegration';

augmentFieldsDict(Posts, {
  languageModelSummary: {
    resolveAs: {
      type: "String!",
      resolver: async (post: DbPost, _args: void, context: ResolverContext): Promise<string> => {
        if (!post.contents_latest) {
          return "";
        }
        const postWithContents = await fetchFragmentSingle({
          collectionName: "Posts",
          fragmentName: "PostsOriginalContents",
          selector: {_id: post._id},
          currentUser: context.currentUser,
          context,
        });
        if (!postWithContents?.contents?.originalContents) {
          return "";
        }
        const markdownPostBody = dataToMarkdown(
          postWithContents.contents?.originalContents?.data,
          postWithContents.contents?.originalContents?.type,
        );
        const authorName = "Authorname"; //TODO

        return await languageModelGenerateText({
          taskName: "summarize",
          inputs: {
            title: post.title,
            author: authorName,
            text: markdownPostBody,
          },
          maxTokens: 1000,
          context
        });
      }
    },
  },
});

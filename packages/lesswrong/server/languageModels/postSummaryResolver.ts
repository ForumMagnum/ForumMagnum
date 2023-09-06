import { Posts } from '../../lib/collections/posts/collection';
import { augmentFieldsDict } from '../../lib/utils/schemaUtils'
import { dataToMarkdown } from '../editor/conversionUtils';
import { languageModelGenerateText } from './languageModelIntegration';

augmentFieldsDict(Posts, {
  languageModelSummary: {
    resolveAs: {
      type: "String",
      resolver: async (post: DbPost, args: void, context: ResolverContext): Promise<string> => {
        const markdownPostBody = dataToMarkdown(post.contents?.originalContents?.data, post.contents?.originalContents?.type);
        const authorName = "Authorname"; //TODO
        
        return await languageModelGenerateText({
          taskName: "summarize",
          inputs: {
            title: post.title,
            author: authorName,
            text: markdownPostBody,
          },
          maxTokens: 1000,
        });
      }
    },
  },
});

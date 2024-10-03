import { jargonBotClaudeKey } from '@/lib/instanceSettings';
import { defineMutation } from '../../utils/serverGraphqlUtil';
import { getAnthropicPromptCachingClientOrThrow } from '../../languageModels/anthropicClient';
import { exampleJargonGlossary2, exampleJargonPost2 } from './exampleJargonPost';
import { ContentReplacedSubstringComponentInfo } from '@/components/common/ContentItemBody';
import { userIsAdmin } from '@/lib/vulcan-users';
import { PromptCachingBetaMessageParam } from '@anthropic-ai/sdk/resources/beta/prompt-caching/messages';
import { Posts } from '@/lib/collections/posts';
import JargonTerms from '@/lib/collections/jargonTerms/collection';
import { createMutator } from '../../vulcan-lib';
import { initialGlossaryPrompt, formatPrompt, glossarySystemPrompt, mathFormatPrompt } from './jargonPrompts';
import { fetchFragmentSingle } from '@/server/fetchFragment';
import { htmlToMarkdown } from '@/server/editor/conversionUtils';
import { exampleMathGlossary } from './exampleMathOutput';
import { readFile } from 'fs/promises';

const claudeKey = jargonBotClaudeKey.get()

async function queryClaudeJailbreak(prompt: PromptCachingBetaMessageParam[], maxTokens: number, systemPrompt: string) {
const client = getAnthropicPromptCachingClientOrThrow(claudeKey)
return await client.messages.create({
    system: systemPrompt,
    model: "claude-3-5-sonnet-20240620",
    max_tokens: maxTokens,
    messages: prompt
})
}

export const queryClaudeForTerms = async (markdown: string) => {
  console.log(`I'm pinging Claude for terms!`)
  const termsResponse = await queryClaudeJailbreak([
    {
      role: "user", 
      content: [{
        type: "text", 
        text: `${initialGlossaryPrompt} The text is: ${markdown}.
        
The jargon terms are:`
        }]
      }
  ], 5000, "You return a list of terms, with no other text.")

  if (!(termsResponse.content[0].type === "text")) return null
  console.log(`Claude responded with: ${termsResponse.content[0].text}`)
  return termsResponse.content[0].text
}

export const queryClaudeForJargonExplanations = async ({ markdown, terms, formatPrompt, examplePost, exampleExplanations } : {  markdown: string, terms: string, formatPrompt: string, examplePost: string, exampleExplanations: string }) => {
  console.log(`I'm pinging Claude for jargon explanations!`)
  const response = await queryClaudeJailbreak([
    {
      role: "user", 
      content: [{
        type: "text", 
        text: `${formatPrompt} The text is: ${formatPrompt}`}]
    },
    { role: "assistant", 
      content: [{
        type: "text", 
        text: `${exampleExplanations}`
      }]
    },
    {
      role: "user",
      content: [{
        type: "text",
        text: `${formatPrompt} The text is: ${markdown}. The jargon and math terms are: ${terms}`
      }]
    }, 
  ], 5000, glossarySystemPrompt)
  if (!(response.content[0].type === "text")) return null

  let jargonTerms: Array<{ term: string, altTerms?: string[], text: string }> = []

  const text = response.content[0].text
  const jsonGuessMatch = text.match(/\[\s*\{[\s\S]*?\}\s*\]/)
  if (jsonGuessMatch) {
    jargonTerms = JSON.parse(jsonGuessMatch[0])
  } else {
    jargonTerms = []
  }
  console.log(`Claude responded with: ${jargonTerms}`)
  return jargonTerms
}

async function getNewJargonTerms(post: PostsPage, user: DbUser ) {
  if (!userIsAdmin(user)) {
    return null;
  }

  const contents = post.contents;
  const originalHtml = contents?.html ?? ""
  const originalMarkdown = htmlToMarkdown(originalHtml)
  const markdown = (originalMarkdown.length < 200 * 1000) ? originalMarkdown : originalMarkdown.slice(0, 200 * 1000)

  const terms = await queryClaudeForTerms(markdown)
  if (!terms) return null
  
  return queryClaudeForJargonExplanations({markdown, terms, formatPrompt, examplePost: exampleJargonPost2, exampleExplanations: exampleJargonGlossary2})
}

// these functions are used to create jargonTerms explaining LaTeX terms from a post

export function identifyLatexTerms(htmlContent: string): string {
  // Regular expression to match aria-label attributes
  const ariaLabelRegex = /aria-label="([^"]*)"/g;
  
  // Regular expression to match common LaTeX patterns
  const latexPattern = /\\[a-zA-Z]+|[_^{}]|\$/;
  
  // Array to store results
  const results: string[] = [];
  
  let match;
  while ((match = ariaLabelRegex.exec(htmlContent)) !== null) {
    const ariaLabel = match[1];
    if (latexPattern.test(ariaLabel)) {
      results.push(ariaLabel);
    }
  }
  
  return results.join(",");
}


const getMathExample = (() => {
  let examplePostContents: string;

  return async () => {
    if (!examplePostContents) {
      const pathName = './public/exampleMathPost.md'
      examplePostContents = (await readFile(pathName)).toString()
    }

    return examplePostContents;
  };
})();


export async function getLaTeXExplanations(post: PostsPage) {
  const originalHtml = post.contents?.html ?? ""
  const originalMarkdown = htmlToMarkdown(originalHtml)
  const markdown = (originalMarkdown.length < 200 * 1000) ? originalMarkdown : originalMarkdown.slice(0, 200 * 1000)

  const terms = identifyLatexTerms(originalHtml)
  const exampleMathPost = await getMathExample();

  return queryClaudeForJargonExplanations({markdown, terms, formatPrompt: mathFormatPrompt, examplePost: exampleMathPost, exampleExplanations: exampleMathGlossary})
}

export async function createEnglishExplanations(post: PostsPage) {
  const originalHtml = post.contents?.html ?? ""
  const originalMarkdown = htmlToMarkdown(originalHtml)
  const markdown = (originalMarkdown.length < 200 * 1000) ? originalMarkdown : originalMarkdown.slice(0, 200 * 1000)

  const terms = await queryClaudeForTerms(markdown)
  if (!terms) return null

  return queryClaudeForJargonExplanations({markdown, terms, formatPrompt, examplePost: exampleJargonPost2, exampleExplanations: exampleJargonGlossary2})
}

export const createNewJargonTerms = async (postId: string, currentUser: DbUser) => {
  const post = await fetchFragmentSingle({
    collectionName: 'Posts',
    fragmentName: 'PostsPage',
    currentUser,
    selector: { _id: postId },
  });
  if (!post) {
    throw new Error('Post not found');
  }
  const newMathJargon = await getLaTeXExplanations(post);

  const newEnglishTerms = await createEnglishExplanations(post);

  if (newEnglishTerms === null && newMathJargon === null) {
    return [];
  }
}


defineMutation({
    name: 'getNewJargonTerms',
    argTypes: '(postId: String!)',
    resultType: '[JargonTerm]',
    fn: async (_, { postId }: { postId: string }, { currentUser }: ResolverContext) => {
      if (!currentUser) {
        throw new Error('You need to be logged in to generate jargon terms');
      }


      await createNewJargonTerms(postId, currentUser);




      const newJargonTerms = await Promise.all(
        newTerms.map(term =>
          createMutator({
            collection: JargonTerms,
            document: {
              postId: postId,
              term: term.term,
              humansAndOrAIEdited: "AI",
              forLaTeX: false,
              rejected: false,
              contents: {
                originalContents: {
                  data: term.text,
                  type: 'ckEditorMarkup',
                },
              },
              altTerms: term.altTerms,
            },
            currentUser: currentUser,
            validate: false,
          })
        )
      );

      console.log(`New jargon terms: ${newJargonTerms}`)

      // Extract the data property from each result
      return newJargonTerms.map(result => result.data);
    },
});

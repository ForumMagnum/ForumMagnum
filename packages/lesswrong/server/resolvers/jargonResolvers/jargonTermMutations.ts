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
import { initialGlossaryPrompt, formatPrompt, glossarySystemPrompt } from './jargonPrompts';
import { fetchFragmentSingle } from '@/server/fetchFragment';

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

async function getNewJargonTerms(post: PostsPage, user: DbUser ) {
    if (!userIsAdmin(user)) {
      return null;
    }

    const contents = post.contents;
    const originalHtml = contents?.html ?? ""
    const html = (originalHtml.length < 200 * 1000) ? originalHtml : originalHtml.slice(0, 200 * 1000)

    const termsResponse = await queryClaudeJailbreak([
      {
        role: "user", 
        content: [{
          type: "text", 
          text: `${initialGlossaryPrompt} The text is: ${html}.
          
The jargon terms are:`
          }]
        }
    ], 5000, "You return a list of terms, with no other text.")

    console.log("termsResponse", termsResponse)

    if (!(termsResponse.content[0].type === "text")) return null
    
    const response = await queryClaudeJailbreak([
      {
        role: "user", 
        content: [{
          type: "text", 
          text: `${formatPrompt} The text is: ${exampleJargonPost2}`}]
      },
      { role: "assistant", 
        content: [{
          type: "text", 
          text: `${exampleJargonGlossary2}`
        }]
      },
      {
        role: "user",
        content: [{
          type: "text",
          text: `${formatPrompt} The text is: ${html}. The jargon and math terms are: ${termsResponse.content[0].text}`
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

    let glossary: Array<{ term: string, contents: string, altTerms: string[], }> = []

    for (const term of jargonTerms) {
      const altTerms = term.altTerms ?? []; // Default to empty array

      glossary.push({
        term: term.term,
        contents: term.text,
        altTerms: altTerms,
      });

      // Add alt terms to glossary if any
      for (const altTerm of altTerms) {
        glossary.push({
          term: altTerm,
          contents: term.text,
          altTerms: altTerms,
        });
      }
    }
    console.log("glossary", glossary)
    return glossary
  }

defineMutation({
    name: 'generateJargonTerms',
    argTypes: '(postId: String!)',
    resultType: 'JargonTerm[]',
    fn: async (_, { postId }: { postId: string }, context) => {
      const { currentUser, repos } = context;
  
      if (!currentUser) {
        throw new Error('You need to be logged in to generate jargon terms');
      }

      // const post = await Posts.findOne({_id: postId});

      const post = await fetchFragmentSingle({
        collectionName: 'Posts',
        fragmentName: 'PostsPage',
        currentUser,
        selector: { _id: postId },
        context,
      })

      if (!post) {
        throw new Error('Post not found');
      }

      const newTerms = await getNewJargonTerms(post, currentUser)

      if (newTerms === null) {
        return []
      }



      const newJargonTerms = await Promise.all(newTerms.map(term => createMutator({
        collection: JargonTerms,
        document: {
          postId: postId,
          term: term.term,
          contents: {
            originalContents: {
              data: term.contents,
              type: 'ckEditorMarkup',
            },
          },
          altTerms: term.altTerms,
        },
        validate: false,
      })))

      return newJargonTerms

    }
  });

  
export function identifyLatexAriaLabels(htmlContent: string): string[] {
  // Create a temporary DOM parser
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  
  // Find all elements with aria-label attribute
  const elementsWithAriaLabel = doc.querySelectorAll('[aria-label]');
  
  // Array to store results
  const results: string[] = [];
  
  // Regular expression to match common LaTeX patterns
  const latexPattern = /\\[a-zA-Z]+|[_^{}]|\$/;
  
  elementsWithAriaLabel.forEach((element) => {
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) {
      const isLatex = latexPattern.test(ariaLabel);
      if (isLatex) {
        results.push(ariaLabel);
      }
    }
  });
  
  return results
}

export function getLaTeXExplanations(terms: string[], markdown: string) {
  
}

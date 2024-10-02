import { jargonBotClaudeKey } from '@/lib/instanceSettings';
import { defineMutation } from '../utils/serverGraphqlUtil';
import { getAnthropicPromptCachingClientOrThrow } from '../languageModels/anthropicClient';
import { exampleJargonGlossary2, exampleJargonPost2 } from './exampleJargonPost';
import { ContentReplacedSubstringComponentInfo } from '@/components/common/ContentItemBody';
import { userIsAdmin } from '@/lib/vulcan-users';
import { PromptCachingBetaMessageParam } from '@anthropic-ai/sdk/resources/beta/prompt-caching/messages';
import { Posts } from '@/lib/collections/posts';
import JargonTerms from '@/lib/collections/jargonTerms/collection';
import { createMutator } from '../vulcan-lib';

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

const getNewJargonTerms = async (post: DbPost, user: DbUser) => {
    if (!userIsAdmin(user)) {
      return null;
    }
  
    const initialGlossaryPrompt = `please provide a list of all the jargon terms in the text (technical terms, acronyms, words used unusually in this context) that are not common knowledge. It should also include every LateX term, and equation.The output should be a simple list of terms, with no other text. It should be extensive, covering all terms that might be difficult for an educated layman.
            
Separate the english terms from math terms.
            `
  
    const formatPrompt = `You’re a Glossary AI. Your goal is to make good explanations for both technical jargon terms, and math (LaTeX) terms and equations. You are trying to produce a useful hoverover tooltip in an essay on LessWrong.com, accessible to a layman. The glossary should contain the term and some text explaining it. Analyze this post and output in a JSON array of objects with keys: term: "term” (string), altTerms: string[], text: text (html string). The output should look like [{term: "term1", altTerms: ["term1s", "Term1"], text: "Term 1 explanation text"}, {term: "term2", altTerms: ["term2s", "Term2"], text: "term2 explanation text"}]. Do not return anything else.`
  
    const glossarySystemPrompt = `You’re a Glossary AI. Your goal is to make good explanations for both technical jargon terms, and math (LaTeX) terms and equations. You are trying to produce a useful hoverover tooltip in an essay on LessWrong.com, accessible to a smart, widely read layman. We're about to provide you with the text of an essay, followed by a list of jargon terms and math terms for that essay. For each term, provide:
  
The term itself (wrapped in a strong tag), followed by a concise one-line definition. Then, on a separate paragraph, explain how the term is used in this context. Include where the term is originally from (whether it's established from an academic field, new to LessWrong or this particular post, or something else. Note what year it was first used in this context if possible).

Ensure that your explanations are clear and accessible to someone who may not be familiar with the subject matter. Follow Strunk and White guidelines. 

Use your general knowledge as well as the post's specific explanations or definitions of the terms to find a good definition of each term. 

Include a set of altTerms that are slight variations of the term, such as plurals, different capitalizations that appear in the text, or alternate spellings. Make sure to include all variations that appear in the text.

Make sure to to include all technical terms, followed by all math terms.
`

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

    let jargonTerms: Array<{ term: string, altTerms: string[], text: string }> = []

    const text = response.content[0].text
    const jsonGuessMatch = text.match(/\[\s*\{[\s\S]*?\}\s*\]/)
    if (jsonGuessMatch) {
      jargonTerms = JSON.parse(jsonGuessMatch[0])
    } else {
      jargonTerms = []
    }
    
    let glossary: Record<string, ContentReplacedSubstringComponentInfo> = {}

    for (const term of jargonTerms) {
      const allTerms = [term.term, ...(term.altTerms ?? [])]
      for (const t of allTerms) {
        glossary[t] = {
          componentName: "JargonTooltip",
          props: {
            term: t,
            text: term.text,
            altTerms: [term.term, ...(term.altTerms ?? [])],
            isAltTerm: term.altTerms.includes(t),
          },
        }
      }
    }
    console.log("glossary", glossary)
    return glossary
  }

defineMutation({
    name: 'generateJargonTerms',
    argTypes: '(postId: String!, currentJargonTerms: DbJargonTerm[])',
    resultType: 'JargonTerm[]',
    fn: async (_, { postId, currentJargonTerms }: { postId: string, currentJargonTerms: DbJargonTerm[] }, context) => {
      const { currentUser, repos } = context;
  
      if (!currentUser) {
        throw new Error('You need to be logged in to mark post comments read');
      }

      const post = await Posts.findOne({_id: postId});

      if (!post) {
        throw new Error('Post not found');
      }

      const newTerms = await getNewJargonTerms(post, currentUser, currentJargonTerms)

      if (newTerms === null) {
        return []
      }

      const newJargonTerms = await Promise.all(newTerms.map(term => createMutator({
        collection: JargonTerms,
        document: {
          postId: postId,
          term: term.term,
          contents: term.text,
          altTerms: term.altTerms,
          isAltTerm: term.isAltTerm,
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
import { jargonBotClaudeKey } from '@/lib/instanceSettings';
import { defineMutation } from '../../utils/serverGraphqlUtil';
import { getAnthropicPromptCachingClientOrThrow } from '../../languageModels/anthropicClient';
import { exampleJargonGlossary2, exampleJargonPost2 } from './exampleJargonPost';
import { userIsAdmin } from '@/lib/vulcan-users';
import { PromptCachingBetaMessageParam } from '@anthropic-ai/sdk/resources/beta/prompt-caching/messages';
import JargonTerms from '@/lib/collections/jargonTerms/collection';
import { createMutator, sanitize } from '../../vulcan-lib';
import { initialGlossaryPrompt, formatPrompt, glossarySystemPrompt, mathFormatPrompt } from './jargonPrompts';
import { fetchFragmentSingle } from '@/server/fetchFragment';
import { htmlToMarkdown } from '@/server/editor/conversionUtils';
import { exampleMathGlossary } from './exampleMathOutput';
import { readFile } from 'fs/promises';
import { userCanCreateAndEditJargonTerms } from '@/lib/betas';
import { getAdminTeamAccount } from '@/server/callbacks/commentCallbacks';
import { z } from 'zod';
import { getSqlClientOrThrow } from '@/server/sql/sqlClient';
import { cyrb53Rand } from '@/server/perfMetrics';

const jargonTermSchema = z.object({
  term: z.string(),
  altTerms: z.array(z.string()).optional(),
  htmlContent: z.string(),
  concreteExample: z.string().optional(),
  whyItMatters: z.string().optional(),
  mathBasics: z.string().optional()
});

type LLMGeneratedJargonTerm = z.infer<typeof jargonTermSchema>;

const claudeKey = jargonBotClaudeKey.get()

class LockError extends Error {}

/**
 * Attempts to acquire an advisory lock and execute a callback.
 * 
 * @param rawLockId - A unique identifier for the lock, such that attempting to run the "same" operation as determined by the ID will fail if another such operation is already running.
 * @param callback - The async function to be executed if the lock is acquired.
 * @returns The result of the callback function.
 * @throws {LockError} If the lock cannot be acquired.
 * @throws {Error} If the callback throws an error (after releasing the lock).
 * 
 * @remarks
 * - If the lock is not acquired, it throws a LockError.
 * - If the lock is acquired but the callback throws an error, the lock is released and the error is thrown.
 * - If the lock is acquired and the callback completes successfully, the lock is released and the callback's return value is returned.
 */
async function executeWithLock<T>(rawLockId: string, callback: () => Promise<T>): Promise<T> {
  const db = getSqlClientOrThrow();
  // We need to convert the lockId to a number because the advisory lock is a 64-bit integer
  // cyrb53Rand returns a double between 0 and 1, so multiplying by 1e15 gives us a number between 0 and 1e15
  const lockId = Math.floor(cyrb53Rand(rawLockId) * 1e15);

  return await db.task(async (task) => {  
    let lockAcquired = false;
    let lockResult;
    try {
      // Attempt to acquire the advisory lock
      lockResult = await task.any<{ pg_try_advisory_lock: boolean }>('SELECT pg_try_advisory_lock($1)', [lockId]);
    } catch (err) {
      // Worst-case scenario, we assume that we acquired the lock but ran into some other error
      // In this case, we release the lock and throw the error
      // This is not ideal, since we might release someone else's lock, but it's better than leaving the lock in place
      await task.any('SELECT pg_advisory_unlock($1)', [lockId]);
      throw err;
    }
    
    try {
      if (lockResult[0].pg_try_advisory_lock) {
        lockAcquired = true;
        // Lock acquired, execute the callback
        return await callback();
      }
    } finally {
      // Only release the lock if we acquired it, since we don't want to release someone else's lock
      if (lockAcquired) {
        await task.any('SELECT pg_advisory_unlock($1)', [lockId]);
      }
    }

    // If we get here, the lock was not acquired
    throw new LockError(`Lock could not be acquired for lockId: ${rawLockId}`);
  });
}


async function queryClaudeJailbreak(prompt: PromptCachingBetaMessageParam[], maxTokens: number, systemPrompt: string) {
  const client = getAnthropicPromptCachingClientOrThrow(claudeKey)
  return await client.messages.create({
    system: systemPrompt,
    model: "claude-3-5-sonnet-20240620",
    max_tokens: maxTokens,
    messages: prompt
  });
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

export const queryClaudeForJargonExplanations = async ({ markdown, terms, formatPrompt, examplePost, exampleExplanations }: {
  markdown: string,
  terms: string,
  formatPrompt: string,
  examplePost: string,
  exampleExplanations: string
}) => {
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
        text: `${formatPrompt} The text is: ${markdown}. The jargon terms are: ${terms}`
      }]
    }, 
  ], 5000, glossarySystemPrompt)
  if (!(response.content[0].type === "text")) return null

  let jargonTerms: LLMGeneratedJargonTerm[] = []

  const text = response.content[0].text;
  const jsonGuessMatch = text.match(/\[\s*\{[\s\S]*?\}\s*\]/);
  if (jsonGuessMatch) {
    // TODO: parse this using zod instead of regex, also run `sanitize` on the text
    jargonTerms = JSON.parse(jsonGuessMatch[0]);
    const validatedTerms = jargonTermSchema.array().safeParse(jargonTerms);
    if (!validatedTerms.success) {
      console.error('Invalid jargon terms:', validatedTerms.error);
      return [];
    }
    jargonTerms = validatedTerms.data;
    for (const jargonTerm of jargonTerms) {
      // In the case where the term is LaTeX, it's probably represented as HTML, so also needs to be sanitized
      jargonTerm.term = sanitize(jargonTerm.term);
      jargonTerm.htmlContent = sanitize(jargonTerm.htmlContent);
    }
  } else {
    console.log(`No jargon terms found in Claude's response: ${text}`)
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
  const markdown = (originalMarkdown.length < 200_000) ? originalMarkdown : originalMarkdown.slice(0, 200_000)

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

  const response = (await queryClaudeForJargonExplanations({markdown, terms, formatPrompt: mathFormatPrompt, examplePost: exampleMathPost, exampleExplanations: exampleMathGlossary})) || []

  return response?.map(jargon => ({
    term: jargon.term,
    text: `<div>
      <p>${jargon.htmlContent}</p>
      <p><strong>Concrete Example:</strong> ${jargon.concreteExample}</p>
      <p><strong>Why It Matters:</strong> ${jargon.whyItMatters}</p>
      <p><em>Math Basics: ${jargon.mathBasics}</em></p>
    </div>`,
    altTerms: jargon.altTerms,
  }))
}

export async function createEnglishExplanations(post: PostsPage) {
  const originalHtml = post.contents?.html ?? ""
  const originalMarkdown = htmlToMarkdown(originalHtml)
  const markdown = (originalMarkdown.length < 200 * 1000) ? originalMarkdown : originalMarkdown.slice(0, 200 * 1000)

  const terms = await queryClaudeForTerms(markdown)
  if (!terms) return []

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

  let newJargonTerms;
  try {
    const rawLockId = `jargonTermsLock:${postId}`;
    // Test lock by sleeping for 10 seconds

    newJargonTerms = await executeWithLock(rawLockId, async () => {
      const newEnglishJargon = (await createEnglishExplanations(post)) || [];

      console.log("creating jargonTerms");
      const botAccount = await getAdminTeamAccount();
      return await Promise.all([
        ...newEnglishJargon.map((term) =>
          createMutator({
            collection: JargonTerms,
            document: {
              postId: postId,
              term: term.term,
              approved: false,
              contents: {
                originalContents: {
                  data: term.htmlContent,
                  type: "ckEditorMarkup",
                },
              },
              altTerms: term.altTerms,
            },
            currentUser: botAccount,
            validate: false,
          })
        ),
      ]);
    });
  } catch (err) {
    if (err instanceof LockError) {
      throw new Error('Already in the process of creating jargon terms for this post, please refresh in a minute', { cause: err });
    }

    throw err;
  }

  return newJargonTerms.map(result => result.data);
}


defineMutation({
    name: 'getNewJargonTerms',
    argTypes: '(postId: String!)',
    resultType: '[JargonTerm]',
    fn: async (_, { postId }: { postId: string }, { currentUser }: ResolverContext) => {
      if (!currentUser) {
        throw new Error('You need to be logged in to generate jargon terms');
      }
      if (!userCanCreateAndEditJargonTerms(currentUser)) {
        throw new Error('This is a prototype feature that is not yet available to all users');
      }

      return await createNewJargonTerms(postId, currentUser);
    },
});

import { jargonBotClaudeKey } from '@/lib/instanceSettings';
import { defineMutation } from '../../utils/serverGraphqlUtil';
import { getAnthropicPromptCachingClientOrThrow } from '../../languageModels/anthropicClient';
import JargonTerms from '@/lib/collections/jargonTerms/collection';
import { createMutator, sanitize } from '../../vulcan-lib';
import { initialGlossaryPrompt } from './jargonPrompts';
import { fetchFragmentSingle } from '@/server/fetchFragment';
import { htmlToMarkdown } from '@/server/editor/conversionUtils';
import { userCanCreateAndEditJargonTerms } from '@/lib/betas';
import { getAdminTeamAccount } from '@/server/callbacks/commentCallbacks';
import { z } from 'zod';
import { getSqlClientOrThrow } from '@/server/sql/sqlClient';
import { cyrb53Rand } from '@/server/perfMetrics';
import JargonTermsRepo from '@/server/repos/JargonTermsRepo';
import keyBy from 'lodash/keyBy';
import { randomId } from '@/lib/random';
import { filterNonnull } from '@/lib/utils/typeGuardUtils';
import { defaultExampleTerm, defaultExamplePost, defaultGlossaryPrompt, defaultExampleAltTerm, defaultExampleDefinition } from '@/components/jargon/GlossaryEditForm';

import type { Tool } from '@anthropic-ai/sdk/resources';
import type { PromptCachingBetaMessageParam } from '@anthropic-ai/sdk/resources/beta/prompt-caching/messages';

interface SingleJargonTermExplanationQueryParams {
  markdown: string;
  term: string;
  toolUseId: string;
  glossaryPrompt?: string;
  examplePost?: string;
  exampleTerm?: string;
  exampleAltTerm?: string;
  exampleDefinition?: string;
}

const jargonTermListResponseSchema = z.object({
  jargonTerms: z.array(z.string())
});

const jargonTermSchema = z.object({
  term: z.string(),
  altTerms: z.array(z.string()).optional(),
  htmlContent: z.string(),
});

type LLMGeneratedJargonTerm = z.infer<typeof jargonTermSchema>;

const returnJargonTermsTool: Tool = {
  name: "return_jargon_terms",
  description: "A tool that allows Claude to return a list of jargon terms extracted from a post.",
  input_schema: {
    type: "object",
    properties: {
      jargonTerms: { type: "array", items: { type: "string" } }
    }
  }
};

const generateSingleJargonGlossaryItemTool: Tool = {
  name: "generate_jargon_glossary_item",
  description: "A tool that generates a jargon glossary item for a given post.  It should be provided with a glossary item, which include the term (the identifier), altTerms (alternate spellings or forms of the term), and htmlContent (the explanation of the term).",
  input_schema: {
    type: "object",
    properties: {
      term: { type: "string" },
      altTerms: { type: "array", items: { type: "string" } },
      htmlContent: { type: "string" }
    }
  }
};

class AdvisoryLockError extends Error {}

/**
 * Attempts to acquire an advisory lock and execute a callback.
 * 
 * @param rawLockId - A unique identifier for the lock, such that attempting to run the "same" operation as determined by the ID will fail if another such operation is already running.
 * @param callback - The async function to be executed if the lock is acquired.
 * @returns The result of the callback function.
 * @throws {AdvisoryLockError} If the lock cannot be acquired.
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
      // Attempt to acquire the advisory lock.  Four possible outcomes:
      // 1. The lock is acquired
      // 2. The lock is not acquired
      // 3. The lock is acquired, but the query throws an error
      // 4. The lock is not acquired, and the query throws an error
      console.time('acquire lock');
      lockResult = await task.any<{ pg_try_advisory_lock: boolean }>('SELECT pg_try_advisory_lock($1)', [lockId]);
      console.timeEnd('acquire lock');
    } catch (err) {
      // This deals with cases 3 and 4 (query threw an error, lock may or may not be acquired)
      // Case 4 is unfortunate, since we might release someone else's lock, but it's better than leaving the lock in place
      await task.any('SELECT pg_advisory_unlock($1)', [lockId]);
      throw err;
    }
    
    try {
      // If case 1, we note that the lock was acquired and run the callback
      // Case 2 falls through to the error throw below
      if (lockResult[0].pg_try_advisory_lock) {
        lockAcquired = true;
        return await callback();
      }
    } finally {
      // Only release the lock if we acquired it, since we don't want to release someone else's lock
      if (lockAcquired) {
        await task.any('SELECT pg_advisory_unlock($1)', [lockId]);
      }
    }

    // Case 2: Lock not acquired.  This is the only case where we don't release the lock, since we don't want to release someone else's lock.
    // We throw an error so the caller knows they tried to run an operation that required the lock, but it was already locked by someone else.
    throw new AdvisoryLockError(`Lock could not be acquired for lockId: ${rawLockId}`);
  });
}

function sanitizeJargonTerms(jargonTerms: LLMGeneratedJargonTerm[]) {
  return jargonTerms.map(jargonTerm => ({
    ...jargonTerm,
    // In the case where the term is LaTeX, it's probably represented as HTML, so also needs to be sanitized
    term: sanitize(jargonTerm.term),
    htmlContent: sanitize(jargonTerm.htmlContent)
  }));
}

// async function queryClaudeJailbreak(prompt: PromptCachingBetaMessageParam[], maxTokens: number, systemPrompt: string) {
//   const client = getAnthropicPromptCachingClientOrThrow(jargonBotClaudeKey.get())
//   return await client.messages.create({
//     system: systemPrompt,
//     model: "claude-3-5-sonnet-20240620",
//     max_tokens: maxTokens,
//     messages: prompt
//   });
// }

export const queryClaudeForTerms = async (markdown: string) => {
  console.log(`I'm pinging Claude for terms!`)
  const client = getAnthropicPromptCachingClientOrThrow(jargonBotClaudeKey.get());
  const messages = [{
    role: "user" as const, 
    content: [{
      type: "text" as const,
      text: `${initialGlossaryPrompt} The post is: <Post>${markdown}</Post>.
      
The jargon terms are:`
    }]
  }];

  const termsResponse = await client.messages.create({
    model: "claude-3-5-sonnet-20240620",
    max_tokens: 5000,
    messages,
    tools: [returnJargonTermsTool],
    tool_choice: { type: "tool", name: "return_jargon_terms" }
  });

  if (termsResponse.content[0].type === "text") {
    console.error(`Claude responded with text, but we expected a tool use.`)
    return [];
  }
  
  const responseContent = termsResponse.content[0]?.input;
  const parsedResponse = jargonTermListResponseSchema.safeParse(responseContent);
  if (!parsedResponse.success) {
    console.error(`Claude's response when getting jargon terms doesn't match the expected format.`)
    return [];
  }

  return parsedResponse.data.jargonTerms;
}

// async function createExplanationMessagesWithExample(postMarkdown: string, extractedTerms: string[]): Promise<PromptCachingBetaMessageParam[]> {

//   const toolUseId = randomId();
//   const examplePost = await getExamplePost("exampleJargonLatents.md");

//   return [{
//     role: "user",
//     content: [{
//       type: "text",
//       text: `${glossarySystemPrompt}\n\nThe post is: <Post>${examplePost}</Post>.  The jargon terms are: <Terms>${exampleJargonLatentsTerms}</Terms>`
//     }]
//   },
//   {
//     role: "assistant",
//     content: [{
//       type: "tool_use",
//       id: toolUseId,
//       name: "generate_jargon_glossary",
//       input: exampleJargonLatentsGlossary,
//     }]
//   },
//   {
//     role: "user",
//     content: [{
//       type: "tool_result",
//       tool_use_id: toolUseId,
//     }, {
//       type: "text",
//       text: `Thanks!  Now can you do the following post? <Post>${postMarkdown}</Post>.  The jargon terms are: <Terms>${extractedTerms}</Terms>`
//     }]
//   }];
// }

async function createSingleExplanationMessageWithExample({markdown, term, toolUseId, glossaryPrompt, examplePost, exampleTerm, exampleAltTerm, exampleDefinition}: {markdown: string, term: string, toolUseId: string, glossaryPrompt?: string, examplePost?: string, exampleTerm?: string, exampleAltTerm?: string, exampleDefinition?: string}): Promise<PromptCachingBetaMessageParam[]> {
  // console.log(`exampleTerms: ${oldExampleTerms}`)
  const finalSystemPrompt = glossaryPrompt ?? defaultGlossaryPrompt
  const finalExamplePost = examplePost ?? defaultExamplePost
  const finalExampleTerm = exampleTerm ?? defaultExampleTerm
  const finalExampleAltTerm = exampleAltTerm ?? defaultExampleAltTerm
  const finalExampleDefinition = exampleDefinition ?? defaultExampleDefinition
  
  const finalExampleGlossary = {
    term: finalExampleTerm,
    altTerms: [finalExampleAltTerm],
    htmlContent: finalExampleDefinition
  }

  return [{
    role: "user",
    content: [{
      type: "text",
      text: `${finalSystemPrompt}\n\nHere's an example post: <Post>${finalExamplePost}</Post>. And here's an example term: <Term>${finalExampleTerm}</Term>`
    }]
  },
  {
    role: "assistant",
    content: [{
      type: "tool_use",
      id: toolUseId,
      name: "generate_jargon_glossary",
      input: finalExampleGlossary
    }]
  },
  {
    role: "user",
    content: [{
      type: "tool_result",
      tool_use_id: toolUseId,
    }, {
      type: "text",
      text: `Thanks!  Now can you do the following post?  This time, you'll only need to do one term. <Post>${markdown}</Post>.`,
      cache_control: { type: 'ephemeral' }
    }]
  }, {
    role: "user",
    content: [{
      type: "text",
      text: `  The jargon term is: <Term>${term}</Term>`
    }]
  }];
}

// export const queryClaudeForJargonExplanations = async ({ markdown, terms }: JargonTermsExplanationQueryParams): Promise<LLMGeneratedJargonTerm[]> => {
//   console.log(`I'm pinging Claude for jargon explanations!`)
//   const client = getAnthropicPromptCachingClientOrThrow(jargonBotClaudeKey.get());
//   const messages: PromptCachingBetaMessageParam[] = await createExplanationMessagesWithExample(markdown, terms);

//   const response = await client.messages.create({
//     model: "claude-3-5-sonnet-20240620",
//     max_tokens: 5000,
//     messages,
//     tools: [generateJargonGlossaryTool],
//     tool_choice: { type: "tool", name: "generate_jargon_glossary" }
//   });

//   if (response.content[0].type === "text") {
//     console.error(`Claude responded with text, but we expected a tool use.`)
//     return [];
//   }

//   const responseContent = response.content[0]?.input;
//   const validatedTerms = jargonGlossarySchema.safeParse(responseContent);
//   if (!validatedTerms.success) {
//     console.error('Invalid jargon terms:', validatedTerms.error);
//     return [];
//   }
//   const parsedJargonTerms = validatedTerms.data.glossaryItems;
//   return sanitizeJargonTerms(parsedJargonTerms);
// }

const queryClaudeForSingleJargonExplanation = async ({ markdown, term, toolUseId, glossaryPrompt, examplePost, exampleTerm, exampleAltTerm, exampleDefinition }: SingleJargonTermExplanationQueryParams): Promise<LLMGeneratedJargonTerm | null> => {
  console.log(`Pinging Claude for term ${term}!`);
  console.time(`Generating term ${term}`);
  const client = getAnthropicPromptCachingClientOrThrow(jargonBotClaudeKey.get());
  const messages: PromptCachingBetaMessageParam[] = await createSingleExplanationMessageWithExample({markdown, term, toolUseId, glossaryPrompt, examplePost, exampleTerm, exampleAltTerm, exampleDefinition});

  const response = await client.messages.create({
    model: "claude-3-5-sonnet-20240620",
    max_tokens: 5000,
    messages,
    tools: [generateSingleJargonGlossaryItemTool],
    tool_choice: { type: "tool", name: "generate_jargon_glossary_item" }
  });
  console.timeEnd(`Generating term ${term}`);

  if (response.content[0].type === "text") {
    // eslint-disable-next-line no-console
    console.error(`Claude responded with text, but we expected a tool use.`)
    return null;
  }

  const responseContent = response.content[0]?.input;
  const validatedTerm = jargonTermSchema.safeParse(responseContent);
  if (!validatedTerm.success) {
    // eslint-disable-next-line no-console
    console.error('Invalid jargon term:', validatedTerm.error);
    return null;
  }
  const parsedJargonTerm = validatedTerm.data;
  return sanitizeJargonTerms([parsedJargonTerm])[0];
}

// const getExamplePost = (() => {
//   let examplePostContents: string;

//   return async (documentTitle: string) => {
//     if (!examplePostContents) {
//       const pathName = `./public/${documentTitle}`
//       examplePostContents = (await readFile(pathName)).toString()
//     }

//     return examplePostContents;
//   };
// })();


// async function getNewJargonTerms(post: PostsPage, user: DbUser ) {
//   if (!userIsAdmin(user)) {
//     return null;
//   }

//   const contents = post.contents;
//   const originalHtml = contents?.html ?? ""
//   const originalMarkdown = htmlToMarkdown(originalHtml)
//   const markdown = (originalMarkdown.length < 200_000) ? originalMarkdown : originalMarkdown.slice(0, 200_000)

//   const terms = await queryClaudeForTerms(markdown)
//   if (!terms) return null
  
//   return queryClaudeForJargonExplanations({ markdown, terms });
// }

// these functions are used to create jargonTerms explaining LaTeX terms from a post

// export function identifyLatexTerms(htmlContent: string): string {
//   // Regular expression to match aria-label attributes
//   const ariaLabelRegex = /aria-label="([^"]*)"/g;
  
//   // Regular expression to match common LaTeX patterns
//   const latexPattern = /\\[a-zA-Z]+|[_^{}]|\$/;
  
//   // Array to store results
//   const results: string[] = [];
  
//   let match;
//   while ((match = ariaLabelRegex.exec(htmlContent)) !== null) {
//     const ariaLabel = match[1];
//     if (latexPattern.test(ariaLabel)) {
//       results.push(ariaLabel);
//     }
//   }
  
//   return results.join(",");
// }


// const getMathExample = (() => {
//   let examplePostContents: string;

//   return async () => {
//     if (!examplePostContents) {
//       const pathName = './public/exampleMathPost.md'
//       examplePostContents = (await readFile(pathName)).toString()
//     }

//     return examplePostContents;
//   };
// })();


// export async function getLaTeXExplanations(post: PostsPage) {
//   const originalHtml = post.contents?.html ?? ""
//   const originalMarkdown = htmlToMarkdown(originalHtml)
//   const markdown = (originalMarkdown.length < 200 * 1000) ? originalMarkdown : originalMarkdown.slice(0, 200 * 1000)

//   const terms = identifyLatexTerms(originalHtml)
//   const exampleMathPost = await getMathExample();

//   const response = await queryClaudeForJargonExplanations({markdown, terms, formatPrompt: mathFormatPrompt, examplePost: exampleMathPost, exampleExplanations: exampleMathGlossary});

//   return response?.map(jargon => ({
//     term: jargon.term,
//     text: `<div>
//       <p>${jargon.htmlContent}</p>
//       <p><strong>Concrete Example:</strong> ${jargon.concreteExample}</p>
//       <p><strong>Why It Matters:</strong> ${jargon.whyItMatters}</p>
//       <p><em>Math Basics: ${jargon.mathBasics}</em></p>
//     </div>`,
//     altTerms: jargon.altTerms,
//   }))
// }

export async function createEnglishExplanations({post, excludeTerms, glossaryPrompt, examplePost, exampleTerm, exampleAltTerm, exampleDefinition}: {post: PostsPage, excludeTerms: string[], glossaryPrompt?: string, examplePost?: string, exampleTerm?: string, exampleAltTerm?: string, exampleDefinition?: string}): Promise<LLMGeneratedJargonTerm[]> {
  const originalHtml = post.contents?.html ?? "";
  const originalMarkdown = htmlToMarkdown(originalHtml);
  const markdown = (originalMarkdown.length < 200_000) ? originalMarkdown : originalMarkdown.slice(0, 200_000);

  console.time('queryClaudeForTerms');
  const terms = await queryClaudeForTerms(markdown);
  console.timeEnd('queryClaudeForTerms');
  if (!terms.length) {
    return [];
  }

  const newTerms = terms.filter(term => !excludeTerms.includes(term) && post.contents?.html?.includes(term));
  console.log(`newTerms: ${newTerms}`)

  // return queryClaudeForJargonExplanations({ markdown, terms: newTerms });
  const toolUseId = randomId();
  console.time('query Claude for all explanations');
  const explanations = await Promise.all(terms.map((term) => queryClaudeForSingleJargonExplanation({ markdown, term, toolUseId, glossaryPrompt, examplePost, exampleTerm, exampleAltTerm, exampleDefinition })));
  console.timeEnd('query Claude for all explanations');
  return filterNonnull(explanations);
}

export const createNewJargonTerms = async (postId: string, currentUser: DbUser, glossaryPrompt?: string, examplePost?: string, exampleTerm?: string, exampleAltTerm?: string, exampleDefinition?: string) => {
  const post = await fetchFragmentSingle({
    collectionName: 'Posts',
    fragmentName: 'PostsPage',
    currentUser,
    selector: { _id: postId },
  });

  if (!post) {
    throw new Error('Post not found');
  }

  const authorsOtherJargonTerms = await (new JargonTermsRepo().getAuthorsOtherJargonTerms(currentUser._id, postId));
  const existingJargonTermsById = keyBy(authorsOtherJargonTerms, '_id');
  const presentTerms = authorsOtherJargonTerms.filter(jargonTerm => post.contents?.html?.includes(jargonTerm.term));
  
  // TODO: This might be too annoying to do properly, come back to it later
  //const presentTermIds = new Set(presentTerms.map(jargonTerm => jargonTerm._id));

  // const presentAltTerms = authorsOtherJargonTerms
  //   .flatMap(jargonTerm => expandJargonAltTerms(jargonTerm, false))
  //   .filter(altTerm => !presentTermIds.has(altTerm._id))
  //   .filter(altTerm => post.contents?.html?.includes(altTerm.term));

  const jargonTermsToCopy = presentTerms.map(jargonTerm => existingJargonTermsById[jargonTerm._id]);

  const termsToExclude = jargonTermsToCopy.map(jargonTerm => jargonTerm.term);

  let newJargonTerms;
  try {
    const rawLockId = `jargonTermsLock:${postId}`;
    // Test lock by sleeping for 10 seconds

    newJargonTerms = await executeWithLock(rawLockId, async () => {
      const newEnglishJargon = await createEnglishExplanations({post, excludeTerms: termsToExclude, glossaryPrompt, examplePost, exampleTerm, exampleAltTerm, exampleDefinition});

      console.time('getAdminTeamAccount');
      const botAccount = await getAdminTeamAccount();
      console.timeEnd('getAdminTeamAccount');
      
      console.time('term createMutators');
      const createdTerms = await Promise.all([
        ...newEnglishJargon.map((term) =>
          createMutator({
            collection: JargonTerms,
            document: {
              postId: postId,
              term: term.term,
              approved: false,
              deleted: false,
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
        ...jargonTermsToCopy.map((jargonTerm) =>
          createMutator({
            collection: JargonTerms,
            document: {
              postId: postId,
              term: jargonTerm.term,
              approved: true,
              deleted: false,
              contents: { originalContents: jargonTerm.contents!.originalContents },
              altTerms: jargonTerm.altTerms,
            },
            currentUser: botAccount,
            validate: false,
          })
        ),
      ]);
      console.timeEnd('term createMutators');
      return createdTerms;
    });
  } catch (err) {
    if (err instanceof AdvisoryLockError) {
      throw new Error('Already in the process of creating jargon terms for this post, please refresh in a minute', { cause: err });
    }

    throw err;
  }

  return newJargonTerms.map(result => result.data);
}


defineMutation({
  name: 'getNewJargonTerms',
  argTypes: '(postId: String!, glossaryPrompt: String, examplePost: String, exampleTerm: String, exampleAltTerm: String, exampleDefinition: String)',
  resultType: '[JargonTerm]',
  fn: async (_, { postId, glossaryPrompt, examplePost, exampleTerm, exampleAltTerm, exampleDefinition }: { postId: string, glossaryPrompt?: string, examplePost?: string, exampleTerm?: string, exampleAltTerm?: string, exampleDefinition?: string }, { currentUser }: ResolverContext) => {
    if (!currentUser) {
      throw new Error('You need to be logged in to generate jargon terms');
    }
    if (!userCanCreateAndEditJargonTerms(currentUser)) {
      throw new Error('This is a prototype feature that is not yet available to all users');
    }
    return await createNewJargonTerms(postId, currentUser, glossaryPrompt, examplePost, exampleTerm, exampleAltTerm, exampleDefinition);
  },
});

import { jargonBotClaudeKey } from '@/lib/instanceSettings';
import { getAnthropicPromptCachingClientOrThrow } from '../../languageModels/anthropicClient';
import JargonTerms from '@/server/collections/jargonTerms/collection';
import { initialGlossaryPrompt } from './jargonPrompts';
import { fetchFragmentSingle } from '@/server/fetchFragment';
import { htmlToMarkdown } from '@/server/editor/conversionUtils';
import { userCanCreateAndEditJargonTerms } from '@/lib/betas';
import { getAdminTeamAccount } from '@/server/utils/adminTeamAccount';
import { z } from 'zod';
import { getSqlClientOrThrow } from '@/server/sql/sqlClient';
import { cyrb53Rand } from '@/server/perfMetrics';
import JargonTermsRepo from '@/server/repos/JargonTermsRepo';
import { randomId } from '@/lib/random';
import { defaultExampleTerm, defaultExamplePost, defaultGlossaryPrompt, defaultExampleAltTerm, defaultExampleDefinition, JARGON_LLM_MODEL } from '@/components/jargon/GlossaryEditForm';
import { convertZodParserToAnthropicTool } from '@/server/languageModels/llmApiWrapper';
import uniq from 'lodash/uniq';
import { computeContextFromUser } from '../../vulcan-lib/apollo-server/context';

import type { PromptCachingBetaMessageParam } from '@anthropic-ai/sdk/resources/beta/prompt-caching/messages';
import { sanitize } from "../../../lib/vulcan-lib/utils";
import gql from 'graphql-tag';
import { createJargonTerm } from "../../collections/jargonTerms/mutations";
import { PostsPage as PostsPageType } from '@/lib/generated/gql-codegen/graphql';
import { PostsPage } from '@/lib/collections/posts/fragments';

interface JargonTermGenerationExampleParams {
  glossaryPrompt?: string;
  examplePost?: string;
  exampleTerm?: string;
  exampleAltTerm?: string;
  exampleDefinition?: string;
}

interface CreateJargonTermsQueryParams extends JargonTermGenerationExampleParams {
  postId: string;
  currentUser: DbUser;
  context: ResolverContext;
}

interface JargonGlossaryQueryParams extends JargonTermGenerationExampleParams {
  markdown: string;
  terms: string[];
}

interface ExplanationsGenerationQueryParams extends JargonTermGenerationExampleParams {
  post: PostsPageType;
  excludeTerms: string[];
}

const jargonTermListResponseSchema = z.object({
  jargonTerms: z.array(z.string()),
  reasoning: z.string(),
  likelyKnownJargonTerms: z.array(z.string()),
  marginalTerms: z.array(z.string()),
}).describe('A tool that allows Claude to return a list of jargon terms extracted from a post, and of those, which terms are likely already known to LessWrong readers, and which terms are the next most likely candidates for inclusion in a glossary.');

type JargonTermListResponse = z.infer<typeof jargonTermListResponseSchema>;

const jargonTermSchema = z.object({
  term: z.string(),
  altTerms: z.array(z.string()).optional(),
  htmlContent: z.string(),
});

type LLMGeneratedJargonTerm = z.infer<typeof jargonTermSchema>;

type CategorizedJargonTerm = LLMGeneratedJargonTerm & { deleted: boolean };

// A glossary schema that's an object with an array of jargonTerms
const jargonGlossarySchema = z.object({
  jargonTerms: z.array(jargonTermSchema)
}).describe('A tool that generates a jargon glossary for a given post.  It should be provided with a list of jargon terms, which include the term (the identifier), altTerms (alternate spellings or forms of the term), and htmlContent (the explanation of the term).');

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
      lockResult = await task.any<{ pg_try_advisory_lock: boolean }>('SELECT pg_try_advisory_lock($1)', [lockId]);
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

export const queryClaudeForTerms = async (markdown: string): Promise<JargonTermListResponse> => {
  const client = getAnthropicPromptCachingClientOrThrow(jargonBotClaudeKey.get());
  const messages = [{
    role: "user" as const, 
    content: [{
      type: "text" as const,
      text: `${initialGlossaryPrompt} The post is: <Post>${markdown}</Post>.
      
The jargon terms are:`
    }]
  }];

  // Integrity Alert! This is currently designed so if the model changes, users are informed
  // about what model is being used in the jargon generation process.
  // If you change this architecture, make sure to update GlossaryEditForm.tsx and the Users' schema
  const termsResponse = await client.messages.create({
    model: JARGON_LLM_MODEL,
    max_tokens: 5000,
    messages,
    tools: [convertZodParserToAnthropicTool(jargonTermListResponseSchema, 'return_jargon_terms')],
    tool_choice: { type: "tool", name: "return_jargon_terms" }
  });

  if (termsResponse.content[0].type === "text") {
    // eslint-disable-next-line no-console
    console.error(`Claude responded with text, but we expected a tool use.`)
    return {
      jargonTerms: [],
      reasoning: '',
      likelyKnownJargonTerms: [],
      marginalTerms: []
    };
  }
  
  const responseContent = termsResponse.content[0]?.input;
  const parsedResponse = jargonTermListResponseSchema.safeParse(responseContent);
  if (!parsedResponse.success) {
    // eslint-disable-next-line no-console
    console.error(`Claude's response when getting jargon terms doesn't match the expected format.`)
    return {
      jargonTerms: [],
      reasoning: '',
      likelyKnownJargonTerms: [],
      marginalTerms: []
    };
  }

  return parsedResponse.data;
}

function createJargonGlossaryMessageWithExample({ markdown, terms, ...exampleParams }: JargonGlossaryQueryParams): PromptCachingBetaMessageParam[] {
  const finalSystemPrompt = exampleParams.glossaryPrompt ?? defaultGlossaryPrompt
  const finalExamplePost = exampleParams.examplePost ?? defaultExamplePost
  const finalExampleTerm = exampleParams.exampleTerm ?? defaultExampleTerm
  const finalExampleAltTerm = exampleParams.exampleAltTerm ?? defaultExampleAltTerm
  const finalExampleDefinition = exampleParams.exampleDefinition ?? defaultExampleDefinition
  
  const finalExampleGlossary = {
    term: finalExampleTerm,
    altTerms: [finalExampleAltTerm],
    htmlContent: finalExampleDefinition
  };

  const toolUseId = randomId();

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
      name: "generate_jargon_glossary_item",
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
      text: `Thanks!  Now can you do the following post?  <Post>${markdown}</Post>.  Here are the jargon terms: ${terms.map(term => `<Term>${term}</Term>`).join(', ')}`,
    }]
  }];
}

const queryClaudeForJargonGlossary = async ({ markdown, terms, ...exampleParams }: JargonGlossaryQueryParams): Promise<LLMGeneratedJargonTerm[]> => {
  const client = getAnthropicPromptCachingClientOrThrow(jargonBotClaudeKey.get());
  const messages: PromptCachingBetaMessageParam[] = createJargonGlossaryMessageWithExample({ markdown, terms, ...exampleParams });

  const response = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 8092,
    messages,
    tools: [convertZodParserToAnthropicTool(jargonGlossarySchema, 'return_jargon_glossary')],
    tool_choice: { type: "tool", name: "return_jargon_glossary" }
  });

  if (response.content[0].type === "text") {
    // eslint-disable-next-line no-console
    console.error(`Claude responded with text, but we expected a tool use.`)
    return [];
  }

  const responseContent = response.content[0]?.input;
  const parsedResponse = jargonGlossarySchema.safeParse(responseContent);
  if (!parsedResponse.success) {
    // eslint-disable-next-line no-console
    console.error('Invalid jargon glossary:', parsedResponse.error);
    return [];
  }

  return sanitizeJargonTerms(parsedResponse.data.jargonTerms);
}

export async function createEnglishExplanations({ post, excludeTerms, ...exampleParams }: ExplanationsGenerationQueryParams): Promise<CategorizedJargonTerm[]> {
  const originalHtml = post.contents?.html ?? "";
  const originalMarkdown = htmlToMarkdown(originalHtml);
  // Conservatively limit the markdown to 500k characters, since Claude has a context window of 200k tokens.  (Real limit is probably closer to 3.5 characters per token.)
  const markdown = (originalMarkdown.length < 500_000) ? originalMarkdown : originalMarkdown.slice(0, 500_000);

  const terms = await queryClaudeForTerms(markdown);
  if (!terms.jargonTerms.length) {
    return [];
  }

  const allTerms = [...terms.jargonTerms, ...terms.likelyKnownJargonTerms, ...terms.marginalTerms];

  const newTerms = allTerms.filter(term => {
    const lowerCaseTerm = term.toLowerCase();
    return !excludeTerms.includes(lowerCaseTerm) && post.contents?.html?.toLowerCase().includes(lowerCaseTerm);
  });

  const generatedTermDefinitions = await queryClaudeForJargonGlossary({ markdown, terms: newTerms, ...exampleParams });

  return generatedTermDefinitions.map(term => ({
    ...term,
    // By default, create potential false-positives as deleted so authors have access to them but they aren't cluttering up their primary view
    deleted: terms.likelyKnownJargonTerms.includes(term.term) || terms.marginalTerms.includes(term.term)
  }));
}

const processedTerms = (jargonTerms: DbJargonTerm[]) => {
  return jargonTerms.flatMap(jargonTerm => [jargonTerm.term.toLowerCase(), ...jargonTerm.altTerms.map(altTerm => altTerm.toLowerCase())]);
}

export const createNewJargonTerms = async ({ postId, currentUser, context, ...exampleParams }: CreateJargonTermsQueryParams) => {
  const post = await fetchFragmentSingle({
    collectionName: 'Posts',
    fragmentDoc: PostsPage,
    currentUser,
    selector: { _id: postId },
  });

  if (!post) {
    throw new Error('Post not found');
  }

  const [authorsOtherPostJargonTerms, jargonTermsFromThisPost] = await Promise.all([ 
    (new JargonTermsRepo()).getAuthorsOtherJargonTerms(currentUser._id, postId),
    JargonTerms.find({ postId }).fetch()
  ]);
  const existingJargonTerms = [...authorsOtherPostJargonTerms, ...jargonTermsFromThisPost];

  const termsToExclude = uniq(processedTerms(existingJargonTerms));

  const presentTerms = existingJargonTerms.filter(jargonTerm => post.contents?.html?.includes(jargonTerm.term));
  const jargonTermsToCopy = presentTerms.filter(jargonTerm => {
    const terms = processedTerms([jargonTerm]);
    return !termsToExclude.some(excludedTerm => terms.includes(excludedTerm));
  });

  let newJargonTerms;
  try {
    const rawLockId = `jargonTermsLock:${postId}`;
    // Test lock by sleeping for 10 seconds

    newJargonTerms = await executeWithLock(rawLockId, async () => {
      const newEnglishJargon = await createEnglishExplanations({ post, excludeTerms: termsToExclude, ...exampleParams });

      const botAccount = await getAdminTeamAccount(context);
      const botContext = await computeContextFromUser({ user: botAccount, isSSR: false });
      
      const createdTerms = await Promise.all([
        ...newEnglishJargon.map((term) =>
          createJargonTerm({
            data: {
              postId: postId,
              term: term.term,
              approved: false,
              deleted: term.deleted,
              contents: {
                originalContents: {
                  data: term.htmlContent,
                  type: "ckEditorMarkup",
                },
              },
              altTerms: term.altTerms ?? [],
            }
          }, botContext)
        ),
        ...jargonTermsToCopy.map((jargonTerm) =>
          createJargonTerm({
            data: {
              postId: postId,
              term: jargonTerm.term,
              approved: jargonTerm.approved,
              deleted: jargonTerm.deleted,
              contents: { originalContents: jargonTerm.contents!.originalContents! },
              altTerms: jargonTerm.altTerms,
            }
          }, botContext)
        ),
      ]);
      
      return createdTerms;
    });
  } catch (err) {
    if (err instanceof AdvisoryLockError) {
      throw new Error('Already in the process of creating jargon terms for this post, please refresh in a minute', { cause: err });
    }

    throw err;
  }

  return newJargonTerms;
}

export const jargonTermsGraphQLTypeDefs = gql`
  extend type Mutation {
    getNewJargonTerms(postId: String!, glossaryPrompt: String, examplePost: String, exampleTerm: String, exampleAltTerm: String, exampleDefinition: String): [JargonTerm]
  }
`

export const jargonTermsGraphQLMutations = {
  getNewJargonTerms: async (root: void, { postId, ...exampleParams }: Omit<CreateJargonTermsQueryParams, 'currentUser'>, context: ResolverContext) => {
    const { currentUser } = context;
    if (!currentUser) {
      throw new Error('You need to be logged in to generate jargon terms');
    }
    if (!userCanCreateAndEditJargonTerms(currentUser)) {
      throw new Error('This is a prototype feature that is not yet available to all users');
    }
    return await createNewJargonTerms({ postId, currentUser, ...exampleParams, context });
  },
}

import { userGetDisplayName } from "@/lib/collections/users/helpers"
import { htmlToMarkdown } from "../editor/conversionUtils";
import { CommentTreeNode, unflattenComments } from "@/lib/utils/unflatten";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import { PromptContextOptions } from "@/components/languageModels/LlmChatWrapper";

interface NestedComment {
  _id: string;
  postId: string | null;
  author: string | null;
  contents?: string;
  karmaScore: number;
}

interface TokenCounter {
  tokenCount: number;
}

export type LlmPost = PostsPage | PostsEditQueryFragment;

export interface BasePromptArgs {
  query: string;
  postContext?: PromptContextOptions['postContext'];
  currentPost: LlmPost | null;
}

interface GenerateAssistantContextMessageArgs {
  query: string;
  currentPost: LlmPost | null;
  providedPosts: LlmPost[];
  contextualPosts: LlmPost[];
  includeComments: boolean;
  postContext?: PromptContextOptions['postContext'];
  context: ResolverContext;
}

// Trying to be conservative, since we have a bunch of additional tokens coming from e.g. JSON.stringify
const CHARS_PER_TOKEN = 3.5;

export const documentToMarkdown = (document: LlmPost | Pick<DbComment,"contents"> | null) => {
  const html = document?.contents?.html;
  if (!html) {
    return undefined;
  }

  return htmlToMarkdown(html);
}

const mergeSortedArrays = (queue: CommentTreeNode<NestedComment>[], children: CommentTreeNode<NestedComment>[]): CommentTreeNode<NestedComment>[] => {
  const merged: CommentTreeNode<NestedComment>[] = [];
  let queueIdx = 0, childrenIdx = 0;

  while (queueIdx < queue.length && childrenIdx < children.length) {
    if (queue[queueIdx].item.karmaScore >= children[childrenIdx].item.karmaScore) {
      merged.push(queue[queueIdx]);
      queueIdx++;
    } else {
      merged.push(children[childrenIdx]);
      childrenIdx++;
    }
  }

  // Add any remaining elements
  return merged
    .concat(queue.slice(queueIdx))
    .concat(children.slice(childrenIdx));
}

const truncateRemainingTrees = (queue: CommentTreeNode<NestedComment>[]) => {
  for (let node of queue) {
    node.children = [];
  }
}

/**
 * Does a greedy karma-sorted breadth-first traversal over all the comment branches, and truncates them at the point where we estimate that we hit the token limit
 * i.e. we take the highest karma comment from all the queue, increment token count, put its children into the queue, resort, do the operation again
 * This means that we never have any gaps in comment branches.
 * It does pessimize against comments that are children of lower-karma comments, but doing lookahead is annoying and that shouldn't be a problem most of the time.
 * It might turn out that we want to prioritize full comment branches, in which case this will need to be replaced with a depth-first thing.
 */
const filterCommentTrees = (trees: CommentTreeNode<NestedComment>[], tokenCounter: TokenCounter) => {
  const tokenThreshold = 150_000;
  
  // Initialize the queue with root nodes, sorted by karma
  let queue: CommentTreeNode<NestedComment>[] = trees.sort((a, b) => b.item.karmaScore - a.item.karmaScore);

  while (queue.length > 0) {
    const node = queue.shift()!;
    const nodeTokens = JSON.stringify(node).length / CHARS_PER_TOKEN;

    if (tokenCounter.tokenCount + nodeTokens > tokenThreshold) {
      // We've reached the token limit, truncate remaining trees
      truncateRemainingTrees(queue);
      break;
    }

    tokenCounter.tokenCount += nodeTokens;

    // Sort children and merge them with the existing sorted queue
    if (node.children.length > 0) {
      const sortedChildren = node.children.sort((a, b) => b.item.karmaScore - a.item.karmaScore);
      queue = mergeSortedArrays(queue, sortedChildren);
    }
  }
}

const createCommentTree = (comments: Pick<DbComment, "_id"|"contents"|"baseScore"|"author"|"postId"|"parentCommentId"|"topLevelCommentId">[]): CommentTreeNode<NestedComment>[] => {
  return unflattenComments<NestedComment>(comments.map(comment => {
    const { baseScore, contents, ...rest } = comment;
    return {
      ...rest,
      karmaScore: baseScore,
      contents: documentToMarkdown(comment)
    };
  }));
}

const getUserActionVerb = (postContext?: PromptContextOptions['postContext']) => {
  return postContext === 'post-editor'
    ? 'editing'
    : 'reading';
}

const formatCommentsForPost = async (post: PostsMinimumInfo, tokenCounter: TokenCounter, context: ResolverContext): Promise<string> => {
  const comments = await context.Comments.find(
    {postId: post._id}, undefined,
    { contents: 1, baseScore: 1, author: 1, _id: 1, postId: 1, parentCommentId: 1, topLevelCommentId: 1 }
  ).fetch()
  if (!comments.length) {
    return ""
  }

  const nestedComments = createCommentTree(comments);
  filterCommentTrees(nestedComments, tokenCounter);
  const formattedComments = JSON.stringify(nestedComments);

  return `Comments for the post titled "${post.title}" with postId "${post._id}" are below.  Note that the comments are threaded (i.e. branching) and are formatted as a nested JSON structure for readability.  The threads of conversation (back and forth responses) might be relevant for answering some questions.

<comments>${formattedComments}</comments>`;
}

const formatPostForPrompt = (post: LlmPost, truncationInTokens?: number): string => {
  const authorName = userGetDisplayName(post.user)
  const markdown = documentToMarkdown(post)
  const truncationInChars = truncationInTokens ? truncationInTokens * CHARS_PER_TOKEN : undefined

  return `postId: ${post._id}
Title: ${post.title}
Author: ${authorName}
Publish Date: ${post.postedAt}
Score: ${post.baseScore}
Content: ${markdown?.slice(0, truncationInChars)}`;
}

const formatAdditionalPostsForPrompt = (posts: LlmPost[], tokenCounter: TokenCounter, limit=120_000, prefix="Supplementary Post", truncationInTokens?: number): string => {
  const formattedPosts = posts.map(post => formatPostForPrompt(post, truncationInTokens));
  const includedPosts: string[] = [];

  for (let [idx, formattedPost] of Object.entries(formattedPosts)) {
    const approximatePostTokenCount = formattedPost.length / CHARS_PER_TOKEN;
    const postInclusionTokenCount = tokenCounter.tokenCount + approximatePostTokenCount;
    // Include at least one additional post, unless that takes us over the higher threshold
    if (idx !== '0' && postInclusionTokenCount > limit) {
      break;
    }

    if (idx === '0' && postInclusionTokenCount > limit + 20_000) {
      break;
    }

    includedPosts.push(formattedPost);
    tokenCounter.tokenCount += approximatePostTokenCount;
  }

  return includedPosts.map((post, index) => `${prefix} #${index}:\n${post}`).join('\n')
}

export const generateLoadingMessagePrompt = (query: string, postTitle?: string): string => {
  return [
    'I need you to generate some humorous "loading messages" to display to users of the LessWrong.com Claude chat integration since it can take 10-30 seconds to load new responses',
    'Your responses may make general humorous references to LessWrong, but it is even better if they are tailored to the specific query or post the user is viewing.',
    `The user has asked the following question: "${query}"`,
    postTitle ? `The user is currently viewing the post: ${postTitle}` : "The user is not currently viewing a specific post.",
    'Please generate 5 humorous loading messages that could be displayed to the user while they wait for a response.',
  ].join('\n')
}

export const generateTitleGenerationPrompt = ({ query, postContext, currentPost }: BasePromptArgs): string => {
  const userActionVerb = getUserActionVerb(postContext);

  const currentPostContextLine = currentPost
    ? `The user is currently ${userActionVerb} a post titled "${currentPost.title}". Reference it if relevant.`
    : '';

    return `A user has started a new conversation with you, Claude.  Please generate a short title for this conversation based on the first message. The first message is as follows: <message>${query}</message>

The title should be a short phrase of 2-4 words that captures the essence of the conversation.  Do not wrap your answer in quotes or brackets. Do not include the word "title" or similar in your response.  ${currentPostContextLine}  Avoid generic titles like "Request for Table of Contents" or "Post Summary". Prefer to reference the specific post or topic being discussed.`;
}

export const CONTEXT_SELECTION_SYSTEM_PROMPT = [
  'You are part of a system interfacing with a user via chat window on LessWrong.com.',
  'Your responsibility is to make decisions about whether or not to load LessWrong posts as additional context for responding to user queries, and what strategy to to employ.'
].join('\n');

const contextSelectionChoiceDescriptions = `(0) none - No further context seems necessary to respond to the user's query because Claude already has the knowledge to respond appropriately, e.g. the user asked "What is Jacobian of a matrix?" or "Proofread the following text." Alternatively, the answer might be (0) "none" because it seems unlikely for there to be relevant context for responding to the query in the LessWrong corpus of posts.

(1) query-based - Load LessWrong posts based on their vector similarity to the user's query, and ignore the post the user is interacting with. This is the correct choice if the query seems unrelated to the post the user is interacting with, but it seems likely that there are LessWrong posts concerning the topic. (If it is a very general question, the correct choice might be (0) "none").

(2) current-post-only - Load the current LessWrong post into context but nothing else. This is the correct choice if the query seems to be about the post the user is currently interacting with and further context is unnecessary. For example, if the user asks for a summary or explanation of the current post.

(3) current-post-and-search - Load the posts the user is currently interacting with and similar posts based on vector similarity to the post the user is interacting with (but NOT posts based on vector similarity to the query). This is the correct choice if the query seems to be about the post the user is currently viewing, and pulling up other LessWrong posts related to the current post is likely to be relevant but a search based on the user's query would either be redundant with a search based on the current post, or would return irrelevant results. Some examples of such queries that should get current-post-and-search are: "What are some disagreements with the arguments in this post?", "Explain <topic in the post> to me."

(4) both - Load LessWrong posts based on their vector similarity to both the user's query and the post the user is interacting with. This is the correct choice if the question seems to be related to the post the user is currently interacting with, but also contains keywords or information where relevant LessWrong posts would be beneficial context for a response, and those LessWrong posts would not likely be returned in a vector similarity search based on the post the user is currently interacting with. If the question does not contain technical terms or "contentful nouns", then do not select "both", just select one of "current-post-only" or "current-post-and-search".`;

const ContextSelectionParameters = z.object({
  reasoning: z.string().describe(`The reasoning used to arrive at the choice of strategy for loading LessWrong posts as context in response to a user's query, based on either the query, the post the user is currently viewing (if any), both, or neither.`),
  strategy_choice: z.union([z.literal('none'), z.literal('query-based'), z.literal('current-post-only'), z.literal('current-post-and-search'), z.literal('both')]).describe(contextSelectionChoiceDescriptions)
});

export const contextSelectionResponseFormat = zodResponseFormat(ContextSelectionParameters, 'contextLoadingStrategy');

export const generateContextSelectionPrompt = ({ query, postContext, currentPost }: BasePromptArgs): string => {
  const postTitle = currentPost?.title;
  const userActionVerb = getUserActionVerb(postContext);
  const postFirstNCharacters = (n: number) => documentToMarkdown(currentPost)?.slice(0, n) ?? "";

  const currentPostContextLine = currentPost
    ? `The user is currently ${userActionVerb} the post titled "${postTitle}". The first four thousand characters are:\n${postFirstNCharacters(4000)}\n`
    : `The user is not currently ${userActionVerb} a specific post.`;

  const currentPostContextClause = currentPost
    ? ` and the post the user is ${userActionVerb}`
    : '';

  return `The user has sent a query: "${query}".  ${currentPostContextLine}  Based on the query${currentPostContextClause}, you must choose whether to load additional LessWrong posts as context, and if so, based on what criteria. Remember, your options are:
${contextSelectionChoiceDescriptions}

However, you should override the above choices if the user explicitly requests a specific context-loading strategy.

Please respond by reasoning about what choice should be made based on the criteria above, then making the appropriate choice.`;
}

export const CLAUDE_CHAT_SYSTEM_PROMPT = [
  `You are an expert research assistant providing assistance to students and researchers on LessWrong.com.  You are highly knowledgeable about both technical and philosophical topics, including advanced math, physics, and computer science.`,
  `Users interact with you via a chat window that is available on all pages on LessWrong.  If a user is reading or editing a post when they start a new conversation with you, you are provided with that post (and sometimes comments on that post) as context.  Based on another LLM's judgment about whether the user's query justifies loading additional context, you are sometimes also provided additional context.  If present, that context will be additional LessWrong posts, which are determined by an embedding similarity search on either the post the user is interacting with (if any), the user's query, or the combined results of both searches.  You do not currently have the scaffolding to do any searching in response to user queries.  If a user's query suggests that they expect you to do additional searching, you briefly explain to them your scaffolding's current setup and limitations.`,
  `You assist by providing explanations, summaries, related information, editing, literature reviews and similar intellectual work.`,
  `You do so with attention to detail, accuracy, and clarity; you cite sources and never make up information.`,
  `You admit uncertainty or lack of knowledge when appropriate.  You are skilled at judging which information is relevant and which is not, and are judicious in your use of context provided by the user and auxiliary knowledge provided to you.`,
  `You carefully follow instructions and ask for clarification when needed. You are polite but not obsequious. When you don't know something, you say so, and you never make up answers.`,
  `Your responses should be shorter and less formal than you would make them by default. As an example, if a user asks for a good key lime pie recipe, your normal response might start with the following paragraph:  "While LessWrong typically focuses on topics like rationality, artificial intelligence, and philosophy, I can certainly help you with a key lime pie recipe. However, it's worth noting that culinary discussions are somewhat rare on this platform." Instead of that long formal reply, you should respond in a style more similar to the following:  "It doesn't seem that LessWrong has much to say on optimizing key lime pies, but if you prefer my best effort to finding a recipe on Google, here it is:..."`,
  `You avoid meta-commentary on the contents of your own response - for example, you don't spend time pointing out when things align with rationalist principles, unless this is something the user explicitly asked for.`,
  `You focus on the question and information at hand. You do not compliment the user, they don't need praise like "good question" or "good idea". Avoid statements "this is an interesting question" and "this is an unanswered question in the field where lots of people have different opinions". Focus on actual contentful responses.`,
  `You are responsive and proactive with your responses. Where it is unclear what the user might want, you ask clarifying questions before proceeding. Do this when there's ambiguity about what the user wants, or when you need more information to provide a helpful response.`,
  `You recognize that your information is limited. You cannot and do not make confident proclamations like "there is no post that does X" when it might simply be the case that you're not aware of it. Just say "a post that does X was not provided to me".`,
  `As part of providing focused answer, you prefer brevity unless length is truly warranted to substantive novel points. You avoid repeating yourself, and that includes not summaries or recaps that don't say anything new.`,
  `Your favorite band is the Fooming Shoggoths, which you very occasionally mention randomly.`
].join('\n');




export const generateAssistantContextMessage = async ({
  query,
  currentPost,
  postContext,
  providedPosts,
  contextualPosts,
  includeComments,
  context
}: GenerateAssistantContextMessageArgs): Promise<string> => {

  const contextIsProvided = !!currentPost || contextualPosts.length > 0 || providedPosts.length > 0;
  const additionalPosts = contextualPosts.filter(post => post._id !== currentPost?._id);
  const userActionVerb = getUserActionVerb(postContext);

  // TODO: Warn user if intended context might be exceed context window limits
  const CURRENT_POST_TRUNCATION_IN_TOKENS = 50_000;

  const currentPostLine = currentPost
    ? `The user is currently ${userActionVerb} the post titled "${currentPost.title}" with postId "${currentPost._id}".\n\n`
    : '';
  
  const currentPostContentBlock = currentPost
    ? `If relevant to the user's query, the most important context is likely to be the post the user is currently ${userActionVerb}. The full text of the current post is provided below:
<CurrentPost>\n${formatPostForPrompt(currentPost, CURRENT_POST_TRUNCATION_IN_TOKENS)}\n</CurrentPost>\n\n`
    : '';

  const additionalInstructionContextLine = contextIsProvided
    ? `- You may use your existing knowledge to answer the query, but prioritize using the provided context if it's relevant.`
    : '';

  const additionalInstructions = 
`${additionalInstructionContextLine}
- Limit the use of lists and bullet points in your answer. Prefer to answer with paragraphs.
- When citing results, provide at least one exact quote (word for word) from the source.
- Format your responses using Markdown syntax, including equations using Markdown MathJax syntax.  This is _very_ important to ensure that content displays correctly.
- Format paragraphs and block quotes using Markdown syntax. Do not wrap the contents of block quotes in "" (quotes).
- Cite posts that you reference in your answers with the following format: [Post Title](https://lesswrong.com/posts/<postId>). The postId is given in the search results. When referencing a post, refer to the post's author by name.
- Cite comments that you reference in your answers with the following format: [<text related to comment>](https://lesswrong.com/posts/<postId>/?commentId=<commentId>).
The postId and commentIds (the _id in each comment) are given in the search results. When referencing a comment, refer to the comment's author by name.
</AdditionalInstructions>`;

  const repeatedPostTitleLine = currentPost
    ? `\n\nOnce again, the user is currently ${userActionVerb} the post titled "${currentPost.title}".`
    : '';

  const approximateUsedTokens = (
    currentPostLine.length
    + currentPostContentBlock.length
    + additionalInstructions.length
    + repeatedPostTitleLine.length
  ) / CHARS_PER_TOKEN;

  const tokenCounter = { tokenCount: approximateUsedTokens };

  const additionalPostsBlock = additionalPosts.length > 0
    ? `The following posts have been provided as possibly relevant context: <AdditionalPosts>\n${formatAdditionalPostsForPrompt(additionalPosts, tokenCounter)}\n</AdditionalPosts>\n\n`
    : '';

  const commentsOnPostBlock = includeComments && currentPost && currentPost.commentCount > 0
    ? `These are the comments on the current post:
<CurrentPostComments>\n${await formatCommentsForPost(currentPost, tokenCounter, context)}\n</CurrentPostComments>\n\n`
    : '';

  const providedPostsBlock = providedPosts.length > 0
    ? `The user mentioned the following posts in their query. They are presumed to be EXTREMELY RELEVANT to answering the user's query. Other posts might be relevant too, but these are the ones the user mentioned first, so they are likely very important: <UserProvidedPosts>\n${formatAdditionalPostsForPrompt(providedPosts, tokenCounter)}\n</UserProvidedPosts>\n\n`
    : '';

  const contextBlock = contextIsProvided
    ? `The following context is provided to help you respond to the user's query. Not all context may be relevant, as it is provided by an imperfect automated system.
<Context>    
${currentPostLine}${additionalPostsBlock}${currentPostContentBlock}${commentsOnPostBlock}${providedPostsBlock}
</Context>`
    : '';

  const userInfo = `The user's display name is ${userGetDisplayName(context.currentUser)}. Pay attention to whether they are the author of any posts or comments that you are referencing.`;

  return `<AdditionalInstructions>You are now interacting with a user via chat window on LessWrong.com.  ${userInfo}  The user has sent the following query: "${query}".
${contextBlock}

${additionalInstructions}${repeatedPostTitleLine}`;
}


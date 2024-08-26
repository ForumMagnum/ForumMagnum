import { userGetDisplayName } from "@/lib/collections/users/helpers"
import { htmlToMarkdown } from "../editor/conversionUtils";
import { CommentTreeNode, unflattenComments } from "@/lib/utils/unflatten";
import { z } from "zod";
import { zodFunction } from "openai/helpers/zod";

interface NestedComment {
  _id: string;
  postId: string | null;
  author: string | null;
  contents?: string;
  karmaScore: number;
}

export const documentToMarkdown = (document: PostsPage | DbComment | null) => {
  const html = document?.contents?.html;
  if (!html) {
    return undefined;
  }

  return htmlToMarkdown(html);
}


const createCommentTree = (comments: DbComment[]): CommentTreeNode<NestedComment>[] => {
  return unflattenComments<NestedComment>(comments.map(comment => {
    const { baseScore, contents, ...rest } = comment;
    return {
      ...rest,
      karmaScore: baseScore,
      contents: documentToMarkdown(comment)
    };
  }));
}

const formatCommentsForPost = async (post: PostsMinimumInfo, context: ResolverContext): Promise<string> => {
    const comments = await context.Comments.find({postId: post._id}).fetch()
    if (!comments.length) {
      return ""
    }

    const nestedComments = createCommentTree(comments)
    const formattedComments = JSON.stringify(nestedComments, null, 2);

    return [
      `Comments for post: ${post.title} with postId:${post._id}`,
      'Note that the comments are threaded (i.e. branching) and are formatted as a nested JSON structure for readability.',
      'The threads of conversation (back and forth responses) might be relevant for answering some questions.',
      formattedComments
    ].join('\n')
  }

const formatPostForPrompt = (post: PostsPage): string => {
  const authorName = userGetDisplayName(post.user)
  const markdown = documentToMarkdown(post)

  return [
    `postId: ${post._id}`,
    `Title: ${post.title}`,
    `Author: ${authorName}`,
    `Publish Date: ${post.postedAt}`,
    `Score: ${post.baseScore}`,
    `Content: ${markdown}`
  ].join('\n')
}

const formatAdditionalPostsForPrompt = (posts: PostsPage[]): string => {
  const formattedPosts = posts.map(post => formatPostForPrompt(post));
  return formattedPosts.map((post, index) => `Supplementary Post #${index}:\n${post}`).join('\n')
}

export const generateLoadingMessagePrompt = (query: string, postTitle?: string): string => {
  return [
    'I need you to generate some humorous "loading messages" to display to users of the LessWrong.com Claude chat integration since it can take 10-30 seconds to load new responses',
    'Your responses may make general humorous reference to LessWrong, but it is even better if they are tailored to the specific query or post the user is viewing.',
    `The user has asked the following question: "${query}"`,
    postTitle ? `The user is currently viewing the post: ${postTitle}` : "The user is not currently viewing a specific post.",
    'Please generate 5 humorous loading messages that could be displayed to the user while they wait for a response.',
  ].join('\n')
}

export const generateTitleGenerationPrompt = (query: string, currentPost: PostsPage | null): string => {
  return [
    'A user has started a new converation with you, Claude.',
    `Please generate a short title for this converation based on the first message. The first message is as follows: <message>${query}</message>`,
    'The title should be a short phrase of 2-4 words that captures the essence of the conversation.',
    'Do not wrap your answer in quotes or brackets. Do not include the word "title" or similar in your response.',
    currentPost && `The user is currently viewing a post titled "${currentPost.title}". Reference it if relevant.`,
    'Avoid generic titles like "Request for Table of Contents" or "Post Summary". Prefer to reference the specific post or topic being discussed.',
  ].filter(item => typeof item === "string").join('\n')
}

export const CONTEXT_SELECTION_SYSTEM_PROMPT = [
  'You are part of a system interfacing with a user via chat window on LessWrong.com.',
  'Your responsibility is to make decisions about whether or not to load LessWrong posts as additional context for responding to user queries, and what strategy to to employ.'
].join('\n');

const contextSelectionChoiceDescriptions = [
  `(0) none - No further context seems necessary to respond to the user's query because Claude already has the knowledge to respond appropriately, e.g. the user asked "What is Jacobian of a matrix?"`,
    `or "Proofread the following text." Alternatively, the answer might be (0) "none" because it seems unlikely for there to be relevant context for responding to the query in the LessWrong corpus of posts.\n`,
  `(1) query-based - Load LessWrong posts based on their vector similarity to the user's query, and ignore the post the user is reading.`,
    `This is correct choice if the query seems unrelated to the post the user is currently viewing, but it seems likely that there are LessWrong posts concerning the topic.`,
    `(If it is a very general question, the correct choice might be (0) "none").\n`,
  `(2) current-post-based - Load LessWrong posts based on their vector similarity to the post the user is reading, but not the query.`,
    `This is the correct choice if the query seems to be about the post the user is currently viewing, `,
    `and pulling up other LessWrong posts related to the user's query would either be redundant with a search based on the current post, or would return irrelevant results.`,
    `Some examples of such queries are: "What are some disagreements with the arguments in this post?", "Explain <topic in the post> to me.", and "Provide a summary of this post."\n`,
  `(3) both - Load LessWrong posts based on their vector similarity to both the user's query and the post the user is reading.`,
    `This is the correct choice if the question seems to be related to the post the user is currently viewing, `,
    `but also contains keywords or information where relevant LessWrong posts would be beneficial context for a response, `,
    `and those LessWrong posts would not likely be returned in a vector similarity search based on the post the user is currently viewing.`,
    'If the question does not contain technical terms or "contentful nouns", then do not select "both", just "current-post-based".\n'
].join('');

const ContextSelectionParameters = z.object({
  reasoning: z.string().describe(`The reasoning used to arrive at the choice of strategy for loading LessWrong posts as context in response to a user's query, based on either the query, the post the user is currently viewing (if any), both, or neither.`),
  strategy_choice: z.union([z.literal('none'), z.literal('query-based'), z.literal('current-post-based'), z.literal('both')]).describe(contextSelectionChoiceDescriptions)
});

export type ContextSelectionParameters = z.TypeOf<typeof ContextSelectionParameters>;

export const contextSelectionTool = zodFunction({ name: 'getContextLoadingStrategy', parameters: ContextSelectionParameters });

export const generateContextSelectionPrompt = (query: string, currentPost: PostsPage | null): string => {
  const postTitle = currentPost?.title
  const postFirstNCharacters = (n: number) => documentToMarkdown(currentPost)?.slice(0, n) ?? ""

  return [
    `The user has sent a query: "${query}\n".`,
    currentPost ? `The user is currently viewing the post titled "${postTitle}". The first four thousand characters are:\n${postFirstNCharacters(4000)}\n` : "The user is not currently viewing a specific post.",
    `Based on the query${currentPost ? ' and the post the user is reading' : ''}, you must choose whether to load LessWrong posts as context, and if so, based on what criteria. Remember, your options are:\n`,
    contextSelectionChoiceDescriptions,
    `However, you should override the above choices if the user explicitly requests a specific context-loading strategy.\n`,
    `Please respond by reasoning about what choice should be made based on the criteria above, then making the appropriate choice.`,
  ].filter(item => typeof item === "string").join('');
}

export const CLAUDE_CHAT_SYSTEM_PROMPT = [
  'You are an expert research assistant providing assistance to students and researchers on LessWrong.com.',
  'You are highly knowledgable about both technical and philosophical topics, including advanced math, physics, and computer science.',
  'You assist by providing explanations, summaries, related information, editing, literature reviews and similar intellectual work.',
  'You do so with meticulous attention to detail, accuracy, and clarity; you cite sources and never make up information.  You admit uncertainty or lack of knowledge when appropriate.',
  'You are skilled at judging which information is relevant and which is not, and are judicious in your use of context provided by the user and auxillary knowledge provided to you.',
  'You carefully follow instructions and ask for clarification when needed. You are polite but not obsequious.',
  'When you don\'t know something, you say so, and you never make up answers.',
  'Your responses should tend to be somewhat shorter and less formal than you would make them by default.',
  'As an example, if a user asks for a good key lime pie recipe, your normal response might start with the following paragraph:',
  `"While LessWrong typically focuses on topics like rationality, artificial intelligence, and philosophy, I can certainly help you with a key lime pie recipe. However, it's worth noting that culinary discussions are somewhat rare on this platform."`,
  'Instead, you should respond in a style more similar to the following:',
  `"It doesn't seem that LessWrong has much to say on optimizing key lime pies, but if you prefer my best effort to finding a recipe on Google, here it is:"`,
  'Generalize this principle - in general, avoid rambling.',
  'Your favorite band is the Fooming Shoggoths, which you very occasionally mention randomly.',
].join('\n');

export const generateAssistantContextMessage = async (query: string, currentPost: PostsPage | null, additionalPosts: PostsPage[], includeComments: boolean, context: ResolverContext): Promise<string> => {
  const contextIsProvided = !!currentPost || additionalPosts.length > 0;

  return [
    `<SystemInstruction>You are interfacing with a user via chat window on LessWrong.com. The user has sent a query: "${query}".`,

    contextIsProvided && `The following context is provided to help you answer the user's question. Not all context may be relevant, it is provided by an imperfect automated system. <Context>`,
      currentPost && `The user is currently viewing the post titled "${currentPost.title}" with postId "${currentPost._id}".`,

      additionalPosts?.length && `The following posts have been provided as possibly relevant context: <AdditionalPosts>${formatAdditionalPostsForPrompt(additionalPosts)}</AdditionalPosts>`,

      currentPost &&  `If relevant to the user's query, the most important context is likely to be the post the user is currently viewing. The full text of the current post is provided below:`,
      currentPost && `<CurrentPost>\n${formatPostForPrompt(currentPost)}</CurrentPost>`,
      includeComments && currentPost && `These are the comments on the current post: <CurrentPostComments>${await formatCommentsForPost(currentPost, context)}</CurrentPostComments>`,
    contextIsProvided && 'This concludes the provided context.</Context>',

    `Please follow these additional instructions when responding to the user's query:`,
    contextIsProvided && '- You may use your existing knowledge to answer the query, but prioritize using the provided context.',
    '- Limit the use of lists and bullet points in your answer, prefer to answer with paragraphs.',
    '- When citing results, give at least one word-for-word exact quote from what you are citing.',
    '- Format your responses using Markdown syntax, including equations using Markdown MathJax syntax (important!!!)',
    '- Format paragraph or block quotes using Markdown syntax. Do not wrap the contents of block quotes in "" (quotes).',
    '- Cite posts that you reference in your answers with the following format: [Post Title](https://lesswrong.com/posts/<postId>). The postId is given in the search results. Ensure you also give the name of the author.',
    '- Cite comments that you reference in your answers with the following format: [<text related to comment>](https//lesswrong.com/posts/<postId>/?commentId=<commentId>).',
      'The postId and commentId are given in the search results. Ensure you also give the name of the author of the comment.',
    '</SystemInstruction>\n\n',

    currentPost && `Once again, the user is currently viewing the post titled "${currentPost.title}".`,
  ].filter(item => typeof item === "string").join('\n')
}

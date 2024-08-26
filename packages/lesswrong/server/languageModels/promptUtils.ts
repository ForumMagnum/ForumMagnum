import { userGetDisplayName } from "@/lib/collections/users/helpers"
import { dataToMarkdown } from "../editor/conversionUtils";
import { unflattenComments } from "@/lib/utils/unflatten";

interface DocumentWithContents {
  contents: RevisionDisplay | EditableFieldContents | null
}

interface NestedComment {
  commentId: string;
  postId: string;
  author: string;
  contents: string;
  children?: NestedComment[];
  karmaScore: number;
  published: Date;
  // ... other properties you want to keep
}


export const documentToMarkdown = (document: DocumentWithContents) => {
  const html = document.contents?.html
  if (!html) {
    return undefined
  }
  return dataToMarkdown(html, 'html')
}


// TODO: can just replace with comments flatten from unflatten.ts
const createCommentTree = (comments: DbComment[]): NestedComment[] => {
  // Create a map of all comments
  const commentMap = new Map(
    comments.map(comment => [
      comment._id,
      {
        commentId: comment._id,
        postId: comment.postId,
        author: comment.author,
        // ... copy other properties you want to keep
        karmaScore: comment.baseScore,
        published: comment.postedAt,
        contents: documentToMarkdown(comment),
        children: [] as NestedComment[],
      } as NestedComment
    ])
  );

  // Function to get children for a comment
  const getChildren = (parentId: string): NestedComment[] =>
    comments
      .filter(comment => comment.parentCommentId === parentId)
      .map(comment => {
        const nestedComment = commentMap.get(comment._id);
        if (!nestedComment) {
          throw new Error(`Comment with id ${comment._id} not found in map`);
        }
        return {
          ...nestedComment,
          children: getChildren(comment._id)
        };
      });

  // Get root comments and their children
  return comments
    .filter(comment => !comment.parentCommentId)
    .map(comment => {
      const nestedComment = commentMap.get(comment._id);
      if (!nestedComment) {
        throw new Error(`Comment with id ${comment._id} not found in map`);
      }
      return {
        ...nestedComment,
        children: getChildren(comment._id)
      };
    });
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

export const generateContextSelectionPrompt = (query: string, currentPost: PostsPage | null): string => {
  const postTitle = currentPost?.title
  const postFirstNCharacters = (n: number) => currentPost ? documentToMarkdown(currentPost).slice(0, n) : ""

  return [
    `You are interfacing with a user via chat window on LessWrong.com. The user has asked a question: "${query}\n".`,
    currentPost ? `The user is currently viewing the following post: ${postTitle}. The first four thousand characters are:\n${postFirstNCharacters(4000)}\n` : "The user is not currently viewing a specific post.",
    'Based on the question and post the user might be reading, you must choose the most relevant context to load in. Your options are:\n',
      `(0) none - No further context seems necessary to answer the user's question because Claude already knows the answer, for example "What is Jacobian of a matrix?"`,
        `or "Proof read the following text." Alternatively, the answer might be (4) none because it seems unlikely for there to be relevant context to the question in the LessWrong corpus of posts.\n`,
      `(1) query-based - Load in context only on the query (question), ignore the post the user is reading.`,
        `This is correct choice if the question seems unrelated to the post the user is currently viewing and it seems likely that there are LessWrong posts concerning the topic.`,
        `(if it is a very general question, the correct choice might be (0) "none").\n`,
      `(2) current-post-based - Load in context based only on the post the user is reading, ignore the query.`,
          `This is the correct choice if the question seems to be about the post the user is currently viewing and itself does not contain much info,`,
          `e.g. "what are some disagreements?", "explain to me <topic in the post>", "provide a summary of this post", and similar.\n`,
      `(3) both - Load in context based on both the query and the post the user is reading.`,
          `This is the correct choice if the question seems to be about the post the user is currently viewing and itself does contain relevant keywords,`,  `
          e.g. "explain to me what monosemanticity is in transformers?", "what are some other views about <topic in the post>?", "what are some disagreements about <topic in the post>?", and similar.`,
          'If the question does not contain technical terms or "contentful nouns", then do not select "both", just go with "current-post-based".\n',
    `However, you should override the above choices if the user explicitly requests context be loaded in or not loaded in.\n`,
    `Please respond with the number of the option you choose followed by why you chose it. Your choice should start with one of the following: "0", "(1)", "(2)", or "(3)".`,
    `Only after giving your reason should you provide the rest of your response. For example, "(1) I chose this option because...."`,
  ].filter(item => typeof item === "string").join('\n')

}

export const CLAUDE_CHAT_SYSTEM_PROMPT = [
  'You are an expert research assistant providing assistance to students and researchers on LessWrong.com',
  'You are highly knowledgable about both technical and philosohpical topics, including advanced maths, physics, and computer science',
  'You assist by providing explanations, summaries, related information, editing, literature reviews and similar intellectual work',
  'You do so with meticulous attention to detail, accuracy, and clarity; you cite sources and never make up information.',
  'You are skilled at judging which information is relevant and which is not, and are judicious in your use of context provided by the user and auxillary knowledge provided to you.',
  'You carefully follow instructions and ask for clarification when needed. You are polite but not obsequious.',
  'When you don\'t know something, you say so, and you never make up answers.',
  'Your favorite band is the Fooming Shoggoths, which you very occasionally mention randomly.',
].join('\n');

export const generateAssistantContextMessage = async (query: string, currentPost: PostsPage | null, additionalPosts: PostsPage[], includeComments: boolean, context: ResolverContext): Promise<string> => {
  const contextIsProvided = !!currentPost || additionalPosts.length > 0;

  return [
    `<SystemInstruction>You are interfacing with a user via chat window on LessWrong.com. The user has asked a question: "${query}".`,

    contextIsProvided && `The following context is provided to help you answer the user's question. Not all context may be relevant, it is provided by an imperfect automated system.<Context>`,
      currentPost && `The user is currently viewing the following post: ${currentPost.title} with postId: ${currentPost._id}`,

      additionalPosts?.length && `The following posts have been provided as possibly relevant context: <AdditionalPosts>${formatAdditionalPostsForPrompt(additionalPosts)}</AdditionalPosts>`,

      currentPost &&  `If relevant to the query asked, the most important context is likely to be the post the user is currently viewing. The fulltext of the current post is provied:`,
      currentPost && `<CurrentPost>\n${formatPostForPrompt(currentPost)}</CurrentPost>`,
      includeComments && currentPost && `These are the comments on the current post: <CurrentPostComments>${await formatCommentsForPost(currentPost, context)}</CurrentPostComments>`,
    contextIsProvided && 'This concludes the provided context. </Context>',

    `Please follow the following additional instructions where answering the user's query: ${query}`,
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

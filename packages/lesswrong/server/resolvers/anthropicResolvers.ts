import { userIsAdmin } from "@/lib/vulcan-users";
import { defineMutation } from "../utils/serverGraphqlUtil";
import { getAnthropicClientOrThrow } from "../languageModels/anthropicClient";
import { z } from 'zod'
import { getEmbeddingsFromApi } from "../embeddings";
import { dataToMarkdown, markdownToHtml } from "../editor/conversionUtils";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";

const ClaudeMessage = `input ClaudeMessage {
  role: String!
  content: String!
  displayContent: String
}`

const PromptContextOptions = `input PromptContextOptions {
  query: String!
  postId: String
  useRag: Boolean
  includeComments: Boolean
}`

interface ClaudeMessage {
  role: string
  content: string
  displayContent?: string
}

interface ClaudeConversation {
  messages: ClaudeMessage[]
  title: string
}

// If present, use to construct context
interface PromptContextOptions {
  query: string
  postId?: string,
  post?: DbPost, //TODO: Make the type be one or the other
  useRag?: boolean
  includeComments?: boolean
  // editorContents: 
}

interface DocumentWithContents {
  contents: EditableFieldContents | null
}

const claudeMessageSchema = z.object({
  role: z.union([z.literal('user'), z.literal('assistant')]),
  content: z.string(),
  displayContent: z.optional(z.string())
})

const claudeMessagesSchema = z.array(claudeMessageSchema)

const documentToMarkdown = (document: DocumentWithContents) => {
  const originalContents = document.contents?.originalContents
  if (!originalContents) {
    return undefined
  }
  return dataToMarkdown(originalContents.data, originalContents.type)
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

// a type for kind of context to use that's a value of "query-based", "post-based", or "both"
type RagContextType = "query-based" | "current-post-based" | "both" | "none" | "error"

const selectAdditionalContext = async (query: string, currentPost?: DbPost): Promise<RagContextType> => {

  const contextTypeMapping: Record<string, RagContextType> = {
    "(1)": "query-based",
    "(2)": "current-post-based",
    "(3)": "both",
    "(4)": "none"
  }

  const client = getAnthropicClientOrThrow()

  const postTitle = currentPost?.title
  const postFirst2000Characters = currentPost ? documentToMarkdown(currentPost).slice(0, 2000) : ""
  const contextSelectionPrompt = `
  You are interfacing with a user via chat window on LessWrong.com. The user has asked a question: "${query}".
  ${currentPost ? `The user is currently viewing the following post: ${postTitle}. The first two thousand characters are: ${postFirst2000Characters}` : "The user is not currently viewing a specific post."}
  Based on the question and post the user might be reading, you must choose the most relevant context to load in. Your options are:
  (1) "query-based" – Load in context only on the query (question), ignore the post the user is reading. This is correct choice if the question seems unrelated to the post the user is currently viewing.
  (2) "current-post-based" – Load in context based only on the post the user is reading, ignore the query. This is the correct choice if the question seems to be about the post the user is currently viewing and itself does not contain much info, e.g. "what are some disagreements?", "explain to me <topic in the post>", "provide a summary of this post", and similar.
  (3) "both" – Load in context based on both the query and the post the user is reading. This is the correct choice if the question seems to be about the post the user is currently viewing and itself does contain relevant keywords, e.g. "explain to me what monosemanticity is in transformers?", "what are some other views about <topic in the post>?", "what are some disagreements about <topic in the post>?", and similar.
  (4) "none" - No further context seems necessary to answer the user's question because Claude already knows the answer, for example "What is Jacobian of a matrix?" or "Proof the following text."

  Please respond with the number of the option you choose followed by why you chose it. Your choice should start with one of the following: "(1)", "(2)", "(3)", or "(4)". Only after giving your reason should you provide the rest of your response. For example, "(1) I chose this option because...." You do not need to answer the question.
`
  const response = await client.messages.create({
    model: "claude-3-haiku-20240307",
    max_tokens: 512,
    messages: [{role: "user", content: contextSelectionPrompt}]
  })

  const result = response.content[0]
  if (result.type === 'tool_use') {
    throw new Error("response is tool use which is not a proper response in this context")
  }

  console.log({result, contextSelectionPrompt})

  //check if result is one of the expected values
  if (!["(1)", "(2)", "(3)", "(4)"].includes(result.text.slice(0, 3))) {
    return "error" as RagContextType
  }
  else {
    return contextTypeMapping[result.text.slice(0, 3)]
  }
}


const createPromptWithContext = async (options: PromptContextOptions, context: ResolverContext) => {
  const { query, postId, post: providedPost, useRag, includeComments } = options

  const post = providedPost ?? (postId ? await context.loaders.Posts.load(postId) : undefined)
  if ((postId || providedPost) && !post) {
    // eslint-disable-next-line no-console
    console.error("Post not found based on provided post or postId", postId)
  }

  const contextSelectionCode = await selectAdditionalContext(query, providedPost)

  // const useQueryContext = ['query-based', 'both'].includes(contextSelectionCode)
  const useQueryRelatedPostsContext = ['query-based', 'both'].includes(contextSelectionCode)
  const useCurrentPostAndRelatedContext = ['current-post-based', 'both'].includes(contextSelectionCode)


  // Load in Current Posts as Context
  let postContextPrompt = ""
  if ( useCurrentPostAndRelatedContext && post ) {
    const author = await context.loaders.Users.load(post.userId)
    const authorName = author.displayName ?? author.username // TODO: If using on AF, use full name
    const markdown = documentToMarkdown(post)
    const formattedCurrentPost = `
postId: ${post._id}
Title: ${post.title}
Author: ${authorName}
Publish Date: ${post.postedAt}
Score: ${post.baseScore} 
Content:
${markdown}
  `

      const justThePostContextPrompt = `
The user is currently viewing the following post. 
<UsersCurrentPost>${formattedCurrentPost}</UsersCurrentPost>
- Its contents might be extremely relevant to the question or not at all. Use your judgment for whether or not to draw upon.
- If citing the the post, do so with the following format: [Post Title](https://lesswrong.com/posts/<postId>). The postId is given in the search results. Ensure you also give the displayName of the author.
\n`

    let commentsContextPrompt = ""
    if (includeComments) {
      const comments = await context.Comments.find({postId: post._id}).fetch()
      if (comments.length > 0) {
        const nestedComments = createCommentTree(comments)
        const formattedComments = JSON.stringify(nestedComments, null, 2);

      commentsContextPrompt = `Further, here are the comments on the user's current post: <UsersCurrentPostComments>${formattedComments}</UsersCurrentPostComments>
- These may be relevant to the user's query. They are more likely relevant if the user asks about the comments explicitly, or about disagreements and criticism.
- When citing comments, refer to them as "comments on the post" and cite them with the following format: [<reference to comment>](https://lesswrong.com/posts/<postId>?commentId=<commentId>) 
The commentId is given in the search results. Ensure you also give the displayName of the author.\n\n`
      }
    }

  postContextPrompt = justThePostContextPrompt + commentsContextPrompt
  }

  // Load in Related Posts as Context (based on closeness to query or current post)
  const actualPostId = post?._id ?? postId

  const { embeddings: queryEmbeddings } = await getEmbeddingsFromApi(query)
  const nearestPostsBasedOnQuery = useQueryRelatedPostsContext ? await context.repos.postEmbeddings.getNearestPostsWeightedByQuality(queryEmbeddings, contextSelectionCode==='query-based' ? 5 : 3) : []
  const nearestPostsBasedOnPostId = useCurrentPostAndRelatedContext && actualPostId ? await context.repos.postEmbeddings.getNearestPostsWeightedByQualityByPostId(actualPostId) : []

  const nearestPostsPossiblyDuplicated = [...nearestPostsBasedOnQuery, ...nearestPostsBasedOnPostId]  
  const nearestPosts = Array.from(new Set(nearestPostsPossiblyDuplicated.map(post => post._id))).map(postId => nearestPostsPossiblyDuplicated.find(post => post._id === postId) as DbPost)
  console.log({nearestPostsBasedOnQueryTitles: nearestPostsBasedOnQuery.map(post => post.title), nearestPostsBasenOnPostIdTitles: nearestPostsBasedOnPostId.map(post => post.title)})

  const formattedPostsFromQueryMatch: string[] = nearestPosts.map((post, index) => {
    const markdown = documentToMarkdown(post)
    return `
Search Result #${index}
postId: ${post._id}
Title: ${post.title}
Author: ${post.author}
Publish Date: ${post.postedAt}
Score: ${post.baseScore}
Content:
${markdown}`
  })

  const searchResultsContextPrompt =  formattedPostsFromQueryMatch && `The following search results were found user's query.
<PossiblyRelevantPosts>${formattedPostsFromQueryMatch.join('\n')}</PossiblyRelevantPosts>
- Not all results may be relevant. Ignore relevant results and use only those that seem relevant to you, if any.
- Refer to the search results as "possible relevant posts".
- Cite the results you use with the following format: [Post Title](https//lesswrong.com/posts/<postId>). The postId is given in the search results. Ensure you also give the displayName of the author.
`
  
  const promptIntro = `<SystemInstruction>A reader of LessWrong.com is asking you a question. The following context is provided to help you answer it.\n`
  const promptQueryAndInstructions = `In responding to the user query, please follow these instructions:
- You may have been provided additional context such PossiblyRelevantPosts or the UsersCurrentPost. If relevant, use this context to help you answer the query.
- You may also use your own knowledge and experience to answer the query, but prioritize using provided context.
- Limit the use of lists and bullet points in your answer, prefer to answer with paragraphs. 
- When citing results, give at least one word-for-word exact quote from what you are citing.
- Format paragraph or block quotes using Markdown syntax, i.e. start them with a >. Do not wrap the contents of block quotes in "" (quotes).
- The context loaded to you is formatted in Markdown.
- Please format your response using Markdown syntax.
- When writing equations, format them using Markdown MathJax syntax. No need to mention this to the user.
- If you are not confident in your answer, e.g. what something means or if you unsure, it is better to say you are unsure or don't know than to guess.
</SystemInstruction>\n\n
${query}
`

const compiledPrompt = `${promptIntro}\n${postContextPrompt}${searchResultsContextPrompt}${promptQueryAndInstructions}`

  console.log("Number of posts returned and their titles", nearestPosts.length, nearestPosts.map(post => post.title))
  //print to the console the first 1000 characters and last 1000 characters of the prompt
  console.log({useQueryRelatedPostsContext, useCurrentPostAndRelatedContext, contextSelectionCode})
  console.log(compiledPrompt.slice(0, 500))
  console.log(compiledPrompt.slice(-1000))

  return { queryWithContext: compiledPrompt, postsLoadedIntoContext: nearestPosts }    
}


defineMutation({
  name: 'sendClaudeMessage',
  schema: `${ClaudeMessage}\n${PromptContextOptions}`,
  argTypes: '(messages: [ClaudeMessage!]!, promptContextOptions: PromptContextOptions!, title: String)',
  resultType: 'JSON',
  fn: async (_, {messages, promptContextOptions, title }: {messages: ClaudeMessage[], promptContextOptions: PromptContextOptions, title: string|null}, context): Promise<ClaudeConversation> => {
    const { currentUser } = context;
    if (!userIsAdmin(currentUser)) {
      throw new Error("only admins can use Claude chat at present")
    }

    // Check that conversation history past in conforms to schema
    const parsedMessagesWrapper = claudeMessagesSchema.safeParse(messages)

    if (!parsedMessagesWrapper.success) {
      throw new Error("role must be either user or assistant")
    }

    const client = getAnthropicClientOrThrow()

    const validatedMessages = parsedMessagesWrapper.data
    const firstQuery = validatedMessages.filter(message => message.role === 'user')[0]
    const isFirstMessage = validatedMessages.length === 1

    // Get post context if exists and is needed
    let currentPost = (!title || isFirstMessage) && promptContextOptions?.postId ? await context.loaders.Posts.load(promptContextOptions.postId) : undefined
    if (currentPost && !currentPost.author) {
      const author = await context.loaders.Users.load(currentPost.userId)
      const authorName = author.displayName ?? author.username // TODO: If using on AF, use full name
      currentPost = {...currentPost, author: authorName}
    }


    // Generate title for the converation (there shouldn't be a first message with a title already, but if there is, don't overwrite it)
    let newTitle = title
    if (!title) {

      // TODO: actually feed post or post title into this prompt()
    const titleGenerationPrompt = `A user has started a new converation with you, Claude. 
Please generate a short title for this converation based on the first messate. The first message is as follows: ${firstQuery.content}
The tile should be a short phrase of 2-4 words that captures the essence of the conversation.
Do not include the word "title" or similar in your response.
Do not wrap your answer in quotes or brackets.
${currentPost ? `The user is currently viewing the following post ${currentPost.title}. Reference it if relevant` : ""}
`
    console.log("titleGenerationPrompt", titleGenerationPrompt)

    // TODO: This can probably be done in parallel with the rest of the conversation 
    const titleResult = await client.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 50,
      messages: [{role: "user", content: titleGenerationPrompt}]
    })

    const titleResponse = titleResult.content[0]
    if (titleResponse.type === 'tool_use') {
      throw new Error("response is tool use which is not a proper response in this context")
    }
    newTitle = titleResponse.text
  }

  // just in case the title is still empty
  if (!newTitle) {
    // Converation with Claude plus date in YY-MM-DD format
    newTitle = `Conversation with Claude ${new Date().toISOString().slice(0, 10)}`
  }

    if  (isFirstMessage){
      const { queryWithContext, postsLoadedIntoContext } = await createPromptWithContext({...promptContextOptions, post: currentPost}, context)
      //TODO: also mention loading current post context
      const prefix = `*Based on your query, the following posts were loaded into the LLM's context window*:`
      const allLoadedPosts = currentPost ? [currentPost, ...postsLoadedIntoContext] : postsLoadedIntoContext;
      // TODO: is this okay? freaking underscore and lodash weren't working for me
      const uniquePosts: DbPost[] = Array.from(new Set(allLoadedPosts.map(post => post._id))).map(postId => allLoadedPosts.find(post => post._id === postId) as DbPost)
      const listOfPosts = uniquePosts.map(post => `- *[${post.title}](${postGetPageUrl(post)}) by ${post.author}*`).join("\n")
      const displayContent = postsLoadedIntoContext.length ? await markdownToHtml(`${prefix}\n${listOfPosts}\n\n\n*You asked:*\n\n${firstQuery.content}`) : undefined

      firstQuery.displayContent || firstQuery.content

      // replace the first message in validateMessages with queryWithContext
      validatedMessages[0] = {
        role: firstQuery.role,
        content: queryWithContext,
        displayContent
      }
    }

    const validatedMessagesWithoutDisplayContent = validatedMessages.map(({role, content}) => ({role, content}))


    const result = await client.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 4096,
      messages: validatedMessagesWithoutDisplayContent
    })

    const response = result.content[0]

    if (response.type === 'tool_use') {
      throw new Error("response is tool use which is not a proper response in this context")
    }

    const responseHtml = await markdownToHtml(response.text)

    const updatedMessages = [...validatedMessages, { role: "assistant", content: response.text, displayContent: responseHtml }]

    return { messages: updatedMessages, title: newTitle }
  }
})

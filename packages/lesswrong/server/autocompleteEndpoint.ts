
import { PromptCachingBetaMessageParam } from "@anthropic-ai/sdk/resources/beta/prompt-caching/messages";
import { formatRelative } from "@/lib/utils/timeFormat";
import { runQuery } from "./vulcan-lib/query";
import { gql } from "@/lib/generated/gql-codegen";

const postsForAutocompleteQuery = gql(`
  query multiPostsForAutocompleteQuery($input: MultiPostInput) {
    posts(input: $input) {
      results {
        ...PostsForAutocomplete
      }
    }
  }
`);

const commentsForAutocompleteQuery = gql(`
  query multiCommentsForAutocompleteQuery($input: MultiCommentInput) {
    comments(input: $input) {
      results {
        ...CommentsForAutocomplete
      }
    }
  }
`);

const commentsForAutocompleteWithParentsQuery = gql(`
  query multiCommentsForAutocompleteWithParentsQuery($input: MultiCommentInput) {
    comments(input: $input) {
      results {
        ...CommentsForAutocompleteWithParents
      }
    }
  }
`);

const getParentComments = (comment: CommentsForAutocompleteWithParents) => {
  const parentComments: CommentsForAutocompleteWithParents[] = [];
  let currentComment: CommentsForAutocompleteWithParents | null = comment;
  while (currentComment.parentComment && currentComment.parentComment._id !== currentComment._id) {
    currentComment = currentComment.parentComment as CommentsForAutocompleteWithParents;
    if (currentComment) {
      parentComments.push(currentComment);
    } else {
      break;
    }
  }
  return parentComments.reverse();
}

const getPostBodyFormatted = (post: PostsForAutocomplete) => {
  return `${post.title}
by ${post.user?.displayName}
${post.baseScore}
${post.contents?.markdown}`.trim();
}

const getCommentBodyFormatted = (comment: CommentsForAutocomplete) => {
  const dateString = formatRelative(new Date(comment.createdAt ?? 0), new Date(), false)
  return `Comment on ${comment.post?.title}
${comment.user?.displayName} ${dateString} ${comment.baseScore} ${comment.extendedScore?.agreement}
${comment.contents?.markdown}`.trim();
}

const getPostReplyMessageFormatted = (post: PostsForAutocomplete, currentUser: DbUser, prefix: string) => {
  return `${getPostBodyFormatted(post)}
---
Comment on ${post.title}
${currentUser.displayName} 1h ${Math.floor(20 + (Math.random() * 75))} ${Math.floor((Math.random() - 0.35) * 100)}
${prefix}`.trim();
}

const getCommentReplyMessageFormatted = (comment: CommentsForAutocompleteWithParents, prefix: string, currentUser: DbUser) => {
  const parentComments = getParentComments(comment);
  return `${getPostBodyFormatted(comment.post!)}
---
${parentComments.map((comment) => getCommentBodyFormatted(comment)).join("\n---\n")}
---
${getCommentBodyFormatted(comment)}
---
Comment on ${comment.post?.title}
${currentUser.displayName} 1h ${Math.floor(20 + (Math.random() * 75))} ${Math.floor((Math.random() - 0.5) * 100)}
${prefix}`.trim();
}

export async function constructMessageHistory(
  prefix: string,
  commentIds: string[],
  postIds: string[],
  user: DbUser,
  context: ResolverContext,
  replyingCommentId?: string,
  postId?: string
): Promise<PromptCachingBetaMessageParam[]> {
  const messages: PromptCachingBetaMessageParam[] = [];

  // Make the fetches parallel to save time
  const [postsResponse, commentsResponse] = await Promise.all([
    runQuery(postsForAutocompleteQuery, {
      input: { terms: { postIds } }
    }, context),
    runQuery(commentsForAutocompleteQuery, {
      input: { terms: { commentIds } }
    }, context),
  ]);

  const posts = postsResponse.data?.posts?.results?.filter((post): post is NonNullable<typeof post> => !!post) ?? [];
  const comments = commentsResponse.data?.comments?.results?.filter((comment): comment is NonNullable<typeof comment> => !!comment) ?? [];

  // eslint-disable-next-line no-console
  console.log(`Converting ${posts.length} posts and ${comments.length} comments to messages`);

  // Add fetched posts and comments to message history
  for (const post of posts) {
    messages.push({
      role: "user",
      content: [{ type: "text", text: `<cmd>cat lw/${post._id}.txt</cmd>` }],
    });

    messages.push({
      role: "assistant",
      content: [
        {
          type: "text",
          text: getPostBodyFormatted(post),
        },
      ],
    });
  }

  for (const comment of comments) {
    messages.push({
      role: "user",
      content: [{ type: "text", text: `<cmd>cat lw/${comment._id}.txt</cmd>` }],
    });

    messages.push({
      role: "assistant",
      content: [{ type: "text", text: getCommentBodyFormatted(comment) }],
    });
  }

  // Add final user message with prefix
  messages.push({
    role: "user",
    content: [{ type: "text", text: `<cmd>cat lw/hsqKp56whpPEQns3Z.txt</cmd>`, cache_control: {type: "ephemeral"}}]
  });

  if (replyingCommentId) {
    // Fetch the comment we're replying to
    const replyingToCommentResponse = await runQuery(commentsForAutocompleteWithParentsQuery, {
      input: { terms: { commentIds: [replyingCommentId] } }
    }, context);
    
    const replyingToComments = replyingToCommentResponse.data?.comments?.results?.filter((comment): comment is NonNullable<typeof comment> => !!comment) ?? [];
    if (replyingToComments.length === 0) {
      throw new Error("Comment not found");
    }
    const replyingToComment = replyingToComments[0];
    const message = getCommentReplyMessageFormatted(replyingToComment, prefix, user)

    messages.push({
      role: "assistant",
      content: [
        {
          type: "text",
          text: message
        },
      ],
    });
  }
  else if (postId) {
    const postResponse = await runQuery(postsForAutocompleteQuery, {
      input: { terms: { postIds: [postId] } }
    }, context);
    
    const posts = postResponse.data?.posts?.results?.filter((post): post is NonNullable<typeof post> => !!post) ?? [];
    if (posts.length === 0) {
      throw new Error("Post not found");
    }
    const post = posts[0];

    messages.push({
      role: "assistant",
      content: [
        {
          type: "text",
          text: getPostReplyMessageFormatted(post, user, prefix)
        },
      ],
    });
  }
  else {
    messages.push({
      role: "assistant",
      content: [
        {
          type: "text",
          text: `${prefix}`
        }
      ]
    });
  }
  return messages;
}

export async function construct405bPrompt(
  prefix: string,
  commentIds: string[],
  postIds: string[],
  user: DbUser,
  context: ResolverContext,
  replyingCommentId?: string,
  postId?: string
): Promise<string> {

  // Make the fetches parallel to save time
  const [postsResponse, commentsResponse] = await Promise.all([
    runQuery(postsForAutocompleteQuery, {
      input: { terms: { postIds } }
    }, context),
    runQuery(commentsForAutocompleteQuery, {
      input: { terms: { commentIds } }
    }, context),
  ]);

  const posts = postsResponse.data?.posts?.results?.filter((post) => !!post) ?? [];
  const comments = commentsResponse.data?.comments?.results?.filter((comment) => !!comment) ?? [];

  // eslint-disable-next-line no-console
  console.log(`Converting ${posts.length} posts and ${comments.length} comments to messages`, postId, replyingCommentId);

  let finalSection = ''

  if (replyingCommentId) {
    // Fetch the comment we're replying to
    const replyingToCommentResponse = await runQuery(commentsForAutocompleteWithParentsQuery, {
      input: { terms: { commentIds: [replyingCommentId] } }
    }, context);
    
    const replyingToComments = replyingToCommentResponse.data?.comments?.results?.filter((comment) => !!comment) ?? [];
    if (replyingToComments.length === 0) {
      throw new Error("Comment not found");
    }
    const replyingToComment = replyingToComments[0];

    finalSection = getCommentReplyMessageFormatted(replyingToComment, prefix, user)    
  } else if (postId) {
    const postResponse = await runQuery(postsForAutocompleteQuery, {
      input: { terms: { postIds: [postId] } }
    }, context);
    
    const posts = postResponse.data?.posts?.results?.filter((post) => !!post) ?? [];
    if (posts.length === 0) {
      throw new Error("Post not found");
    }
    const post = posts[0];

    finalSection = getPostReplyMessageFormatted(post, user, prefix)
  } else {
    finalSection = `${prefix}`
  }


  return `
${posts.map((post) => getPostBodyFormatted(post)).join("\n---\n")}
====
${comments.map((comment) => getCommentBodyFormatted(comment)).join("\n---\n")}
====
${finalSection}`.trim();
}

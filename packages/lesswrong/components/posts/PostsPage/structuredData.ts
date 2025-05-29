import { postCoauthorIsPending, postGetPageUrl } from "@/lib/collections/posts/helpers";
import { tagGetUrl } from "@/lib/collections/tags/helpers";
import { userGetProfileUrl } from "@/lib/collections/users/helpers";
import { isAF } from "@/lib/instanceSettings";
import { CommentTreeNode } from "@/lib/utils/unflatten";


const getCommentStructuredData = ({
  comment
}: {
  comment: CommentTreeNode<CommentsList>
}): Record<string, any> => ({
  "@type": "Comment",
  text: comment.item.contents?.html,
  datePublished: new Date(comment.item.postedAt).toISOString(),
  author: [{
    "@type": "Person",
    name: comment.item.user?.displayName,
    url: userGetProfileUrl(comment.item.user, true),
    interactionStatistic: [
      {
        "@type": "InteractionCounter",
        interactionType: {
          "@type": "http://schema.org/CommentAction",
        },
        userInteractionCount: comment.item.user?.[isAF ? "afCommentCount" : "commentCount"],
      },
      {
        "@type": "InteractionCounter",
        interactionType: {
          "@type": "http://schema.org/WriteAction",
        },
        userInteractionCount: comment.item.user?.[isAF ? "afPostCount" : "postCount"],
      },
    ],
  }],
  ...(comment.children.length > 0 && {comment: comment.children.map(child => getCommentStructuredData({comment: child}))})
})

/**
 * Build structured data for a post to help with SEO.
 */
export const getStructuredData = ({
  post,
  description,
  commentTree,
  answersTree
}: {
  post: PostsWithNavigation | PostsWithNavigationAndRevision;
  description: string | null;
  commentTree: CommentTreeNode<CommentsList>[];
  answersTree: CommentTreeNode<CommentsList>[];
}) => {
  const hasUser = !!post.user;
  const hasCoauthors = !!post.coauthors && post.coauthors.length > 0;
  const answersAndComments = [...answersTree, ...commentTree];
  // Get comments from Apollo Cache

  return {
    "@context": "http://schema.org",
    "@type": "DiscussionForumPosting",
    "url": postGetPageUrl(post, true),
    "text": post.contents?.html ?? description,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": postGetPageUrl(post, true),
    },
    headline: post.title,
    ...(description && { description: description }),
    datePublished: new Date(post.postedAt).toISOString(),
    about: post.tags.filter(tag => !!tag.description?.htmlHighlight).map(tag => ({
      "@type": "Thing",
      name: tag.name,
      url: tagGetUrl(tag, undefined, true),
      description: tag.description?.htmlHighlight,
    })),
    ...(hasUser && {
      author: [
        {
          "@type": "Person",
          name: post.user.displayName,
          url: userGetProfileUrl(post.user, true),
        },
        ...(hasCoauthors
          ? post.coauthors
              .filter(({ _id }) => !postCoauthorIsPending(post, _id))
              .map(coauthor => ({
                "@type": "Person",
                "name": coauthor.displayName,
                url: userGetProfileUrl(post.user, true),
              }))
          : []),
      ],
    }),
    ...(answersAndComments.length > 0 && {comment: answersAndComments.map(comment => getCommentStructuredData({comment}))}),
    interactionStatistic: [
      {
        "@type": "InteractionCounter",
        interactionType: {
          "@type": "http://schema.org/CommentAction",
        },
        userInteractionCount: post.commentCount,
      },
      {
        "@type": "InteractionCounter",
        interactionType: {
          "@type": "http://schema.org/LikeAction",
        },
        userInteractionCount: post.baseScore,
      },
    ],
  };
};

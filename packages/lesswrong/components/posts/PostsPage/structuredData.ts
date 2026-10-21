import type { ForumTypeString } from '@/lib/instanceSettings';
import { postGetAbsolutePageUrl } from "@/lib/collections/posts/helpers";
import { tagGetAbsoluteUrl } from "@/lib/collections/tags/helpers";
import { userGetAbsoluteProfileUrl } from "@/lib/collections/users/helpers";
import { forumTitleSetting } from "@/lib/instanceSettings";
import { CommentTreeNode } from "@/lib/utils/unflatten";

const POST_DESCRIPTION_EXCLUSIONS: RegExp[] = [
  /cross-? ?posted/i,
  /epistemic status/i,
  /acknowledgements/i
];


const getCommentStructuredData = ({
  comment,
  forumType,
}: {
  comment: CommentTreeNode<CommentsList>,
  forumType: ForumTypeString,
}): Record<string, any> => ({
  "@type": "Comment",
  text: comment.item.contents?.html,
  datePublished: new Date(comment.item.postedAt).toISOString(),
  author: [{
    "@type": "Person",
    name: comment.item.user?.displayName,
    url: userGetAbsoluteProfileUrl(comment.item.user, forumType),
    interactionStatistic: [
      {
        "@type": "InteractionCounter",
        interactionType: {
          "@type": "http://schema.org/CommentAction",
        },
        userInteractionCount: comment.item.user?.[forumType === "AlignmentForum" ? "afCommentCount" : "commentCount"],
      },
      {
        "@type": "InteractionCounter",
        interactionType: {
          "@type": "http://schema.org/WriteAction",
        },
        userInteractionCount: comment.item.user?.[forumType === "AlignmentForum" ? "afPostCount" : "postCount"],
      },
    ],
  }],
  ...(comment.children.length > 0 && {comment: comment.children.map(child => getCommentStructuredData({comment: child, forumType}))})
})

/**
 * Build structured data for a post to help with SEO.
 */
export const getStructuredData = ({
  post,
  description,
  commentTree,
  answersTree,
  forumType,
}: {
  post: PostsWithNavigation | PostsWithNavigationAndRevision;
  description: string | null;
  commentTree: CommentTreeNode<CommentsList>[];
  answersTree: CommentTreeNode<CommentsList>[];
  forumType: ForumTypeString;
}) => {
  const { user, coauthors } = post;
  const hasUser = !!user;
  const hasCoauthors = !!coauthors && coauthors.length > 0;
  const answersAndComments = [...answersTree, ...commentTree];
  // Get comments from Apollo Cache

  return {
    "@context": "http://schema.org",
    "@type": "DiscussionForumPosting",
    "url": postGetAbsolutePageUrl(post, forumType),
    "text": post.contents?.html ?? description,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": postGetAbsolutePageUrl(post, forumType),
    },
    headline: post.title,
    ...(description && { description: description }),
    datePublished: new Date(post.postedAt).toISOString(),
    about: post.tags.filter(tag => !!tag.description?.htmlHighlight).map(tag => ({
      "@type": "Thing",
      name: tag.name,
      url: tagGetAbsoluteUrl(tag, forumType),
      description: tag.description?.htmlHighlight,
    })),
    ...(hasUser && {
      author: [
        {
          "@type": "Person",
          name: user.displayName,
          url: userGetAbsoluteProfileUrl(post.user, forumType),
        },
        ...(hasCoauthors
          ? coauthors
              .filter(({ _id }) => !post.coauthorUserIds.includes(_id))
              .map(coauthor => ({
                "@type": "Person",
                "name": coauthor.displayName,
                url: userGetAbsoluteProfileUrl(post.user, forumType),
              }))
          : []),
      ],
    }),
    ...(answersAndComments.length > 0 && {comment: answersAndComments.map(comment => getCommentStructuredData({comment, forumType}))}),
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

/** Get a og:description-appropriate description for a post */
export const getPostDescription = (post: {
  contents?: { plaintextDescription: string | null } | null;
  customHighlight?: { plaintextDescription: string | null } | null;
  socialPreviewData?: { text?: string | null } | null;
  shortform?: boolean | null;
  user: { displayName: string } | null;
}, forumType: ForumTypeString) => {
  if (post.socialPreviewData?.text) {
    return post.socialPreviewData.text;
  }

  const longDescription = post.customHighlight?.plaintextDescription || post.contents?.plaintextDescription;
  if (longDescription) {
    // concatenate the first few paragraphs together up to some reasonable length
    const plaintextPars = longDescription
      // paragraphs in the plaintext description are separated by double-newlines
      .split(/\n\n/)
      // get rid of bullshit opening text ('epistemic status' or 'crossposted from' etc)
      .filter((par) => !POST_DESCRIPTION_EXCLUSIONS.some((re) => re.test(par)));

    if (!plaintextPars.length) return "";

    // concatenate paragraphs together with a delimiter, until they reach an
    // acceptable length (target is 100-200 characters)
    // this will return a longer description if one of the first couple of
    // paragraphs is longer than 200
    let firstFewPars = plaintextPars[0];
    for (const par of plaintextPars.slice(1)) {
      const concat = `${firstFewPars} • ${par}`;
      // If we're really short, we need more
      if (firstFewPars.length < 40) {
        firstFewPars = concat;
        continue;
      }
      // Otherwise, if we have room for the whole next paragraph, concatenate it
      if (concat.length < 150) {
        firstFewPars = concat;
        continue;
      }
      // If we're here, we know we have enough and couldn't fit the last
      // paragraph, so we should stop
      break;
    }
    if (firstFewPars.length > 148) {
      return firstFewPars.slice(0, 149).trim() + "…";
    }
    return firstFewPars + " …";
  }
  if (post.shortform)
    return `A collection of shorter posts ${
      post.user ? `by ${forumTitleSetting.get(forumType)} user ${post.user.displayName}` : ""
    }`;
  return null;
};


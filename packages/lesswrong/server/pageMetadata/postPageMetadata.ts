import { getClient } from "@/lib/apollo/nextApolloClient";
import { gql } from "@/lib/generated/gql-codegen";
import { isEAForum, tabLongTitleSetting, tabTitleSetting } from "@/lib/instanceSettings";
import type { Metadata } from "next";
import merge from "lodash/merge";
import { defaultMetadata } from "./sharedMetadata";
import { postCoauthorIsPending, postGetPageUrl } from "@/lib/collections/posts/helpers";
import { cloudinaryCloudNameSetting } from "@/lib/publicSettings";
import { getPostDescription } from "@/components/posts/PostsPage/structuredData";

const PostMetadataQuery = gql(`
  query PostMetadata($postId: String) {
    post(selector: { _id: $postId }) {
      result {
        _id
        title
        slug
        isEvent
        groupId
        canonicalSource
        socialPreviewData {
          _id
          imageUrl
          text
        }
        customHighlight {
          plaintextDescription
        }
        contents {
          plaintextDescription
        }
        user {
          _id
          displayName
        }
        coauthors {
          _id
          displayName
        }
        hasCoauthorPermission
        coauthorStatuses {
          userId
          confirmed
          requested
        }
        shortform
        eventImageId
        noIndex
        rejected
        baseScore
        createdAt
      }
    }
  }
`);

const CommentPermalinkMetadataQuery = gql(`
  query CommentPermalinkMetadata($commentId: String) {
    comment(selector: { _id: $commentId }) {
      result {
        _id
        user {
          displayName
        }
        contents {
          plaintextMainText
        }
        deleted
      }
    }
  }
`);

function getSocialPreviewImageUrl(post: PostMetadataQuery_post_SinglePostOutput_result_Post) {
  if (post.isEvent && post.eventImageId) {
    return `https://res.cloudinary.com/${cloudinaryCloudNameSetting.get()}/image/upload/c_fill,g_auto,ar_191:100/${post.eventImageId}`
  }
  return post.socialPreviewData?.imageUrl ?? "";
}

function getPostTitleString(post: PostMetadataQuery_post_SinglePostOutput_result_Post) {
  const siteName = tabTitleSetting.get() ?? tabLongTitleSetting.get();
  const titleString = `${post.title} — ${siteName}`;
  return titleString;
}

function getCitationTags(post: PostMetadataQuery_post_SinglePostOutput_result_Post) {
  let formattedDate = post.createdAt;
  if (formattedDate) {
    formattedDate = new Date(formattedDate).toISOString();
    formattedDate = formattedDate.slice(0, formattedDate.indexOf("T")).replace(/-/g, "/");
  }
  
  return {
    citation_title: post.title,
    ...(post.user?.displayName && { citation_author: post.user.displayName }),
    ...(post.coauthors?.filter(({ _id }) => !postCoauthorIsPending(post, _id))?.map(coauthor => coauthor.displayName) && { citation_author: post.coauthors?.map(coauthor => coauthor.displayName) }),
    ...(formattedDate && { citation_publication_date: formattedDate }),
  } satisfies Metadata['other'];
}

function getCommentDescription(comment: CommentPermalinkMetadataQuery_comment_SingleCommentOutput_result_Comment) {
  if (comment.deleted) {
    return '[Comment deleted]';
  }

  return `Comment ${comment.user ? 
    `by ${comment.user.displayName} ` : 
    ''
  }- ${comment.contents?.plaintextMainText}`;
}

export function getPostPageMetadataFunction<Params>(paramsToPostIdConverter: (params: Params) => string) {
  return async function generateMetadata({ params, searchParams }: { params: Promise<Params>, searchParams: Promise<{ commentId?: string }> }): Promise<Metadata> {
    const [paramValues, searchParamsValues] = await Promise.all([params, searchParams]);

    const postId = paramsToPostIdConverter(paramValues);
    const commentId = searchParamsValues.commentId;

    const client = getClient();

    const [{ data: postData }, { data: commentData }] = await Promise.all([
      client.query({
        query: PostMetadataQuery,
        variables: { postId },
      }),
      commentId
        ? client.query({
            query: CommentPermalinkMetadataQuery,
            variables: { commentId },
          })
        : { data: null },
    ]);

    const post = postData?.post?.result;
    const comment = commentData?.comment?.result;

    if (!post) return {};

    const description = comment
      ? getCommentDescription(comment)
      : getPostDescription(post) ?? defaultMetadata.description;

    const ogUrl = postGetPageUrl(post, true);
    const canonicalUrl = post.canonicalSource ?? ogUrl;
    const socialPreviewImageUrl = getSocialPreviewImageUrl(post);
    const titleString = getPostTitleString(post);
    const noIndex = post.noIndex || post.rejected || (post.baseScore <= 0 && isEAForum);
    
    const imagesProp = socialPreviewImageUrl ? { images: socialPreviewImageUrl } : {};

    const postMetadata = {
      title: titleString,
      description,
      openGraph: {
        title: titleString,
        url: ogUrl,
        description,
        ...imagesProp,
      },
      alternates: {
        canonical: canonicalUrl,
      },
      twitter: {
        ...imagesProp,
        description,
      },
      other: {
        ...getCitationTags(post),
      },
      ...(noIndex ? { robots: { index: false } } : {}),
    } satisfies Metadata;

    return merge(defaultMetadata, postMetadata);
  }
}
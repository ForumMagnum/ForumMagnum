import { gql } from "@/lib/generated/gql-codegen";
import { isEAForum, cloudinaryCloudNameSetting } from '@/lib/instanceSettings';
import type { Metadata } from "next";
import merge from "lodash/merge";
import { CommentPermalinkMetadataQuery, getCommentDescription, getDefaultMetadata, getMetadataDescriptionFields, getMetadataImagesFields, getPageTitleFields, getResolverContextForGenerateMetadata, handleMetadataError, noIndexMetadata } from "./sharedMetadata";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import { getPostDescription } from "@/components/posts/PostsPage/structuredData";
import { formatIsoDate, getPostCitation } from "@/lib/collections/posts/citations";
import { runQuery } from "../vulcan-lib/query";

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
        coauthorUserIds
        shortform
        eventImageId
        noIndex
        rejected
        baseScore
        postedAt
        hideAuthor
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

/**
 * Highwire Press citation_* meta tags, which Google Scholar (and reference
 * managers such as Zotero) use to index and import the post as a citable work.
 * See https://scholar.google.com/intl/en/scholar/inclusion.html#indexing
 */
function getCitationTags(post: PostMetadataQuery_post_SinglePostOutput_result_Post) {
  const citation = getPostCitation(post);
  const publicationDate = citation.publishedAt
    ? formatIsoDate(citation.publishedAt).replace(/-/g, "/")
    : null;

  return {
    citation_title: citation.title,
    citation_author: citation.authors,
    ...(publicationDate && {
      citation_publication_date: publicationDate,
      citation_online_date: publicationDate,
    }),
    citation_publisher: citation.siteName,
    citation_public_url: citation.url,
    citation_fulltext_html_url: citation.url,
    citation_abstract_html_url: citation.url,
    citation_language: "en",
  } satisfies Metadata['other'];
}

interface PostPageMetadataOptions {
  noIndex?: boolean;
}

export function getPostPageMetadataFunction<Params>(paramsToPostIdConverter: (params: Params) => string, options?: PostPageMetadataOptions) {
  return async function generateMetadata({ params, searchParams }: { params: Promise<Params>, searchParams: Promise<{ commentId?: string }> }): Promise<Metadata> {
    const [paramValues, searchParamsValues, defaultMetadata] = await Promise.all([params, searchParams, getDefaultMetadata()]);

    const postId = paramsToPostIdConverter(paramValues);
    const commentId = searchParamsValues.commentId;
    const resolverContext = await getResolverContextForGenerateMetadata(searchParamsValues);

    try {
      const [{ data: postData }, { data: commentData }] = await Promise.all([
        runQuery(
          PostMetadataQuery,
          { postId },
          resolverContext
        ),
        commentId
          ? runQuery(
              CommentPermalinkMetadataQuery,
              { commentId },
              resolverContext
            )
          : { data: null },
      ]);
  
      const post = postData?.post?.result;
      const comment = commentData?.comment?.result;
  
      if (!post) return defaultMetadata;
  
      const description = comment
        ? getCommentDescription(comment)
        : getPostDescription(post) ?? defaultMetadata.description;
  
      const ogUrl = postGetPageUrl(post, true);
      const canonicalUrl = post.canonicalSource ?? ogUrl;
      const socialPreviewImageUrl = getSocialPreviewImageUrl(post);
      const postNoIndex = post.noIndex || post.rejected || (post.baseScore <= 0 && isEAForum());
      const noIndex = postNoIndex || commentId || options?.noIndex;
  
      const titleFields = getPageTitleFields(post.title);
      const descriptionFields = getMetadataDescriptionFields(description);
      const imagesFields = getMetadataImagesFields(socialPreviewImageUrl);
      
      const postMetadata = {
        openGraph: {
          url: ogUrl,
        },
        alternates: {
          canonical: canonicalUrl,
        },
        other: {
          ...getCitationTags(post),
        },
        ...(noIndex ? noIndexMetadata : {}),
      } satisfies Metadata;
  
      return merge({}, defaultMetadata, postMetadata, titleFields, descriptionFields, imagesFields);
    } catch (error) {
      return handleMetadataError('Error generating post page metadata', error);
    }
  }
}

import { gql } from "@/lib/generated/gql-codegen";
import type { ForumTypeString } from '@/lib/instanceSettings';
import type { Metadata } from "next";
import merge from "lodash/merge";
import { CommentPermalinkMetadataQuery, getCommentDescription, getDefaultMetadata, getMetadataDescriptionFields, getMetadataImagesFields, getPageTitleFields, getResolverContextForGenerateMetadata, handleMetadataError, noIndexMetadata } from "./sharedMetadata";
import { postGetAbsolutePageUrl } from "@/lib/collections/posts/helpers";
import { getPostDescription } from "@/components/posts/PostsPage/structuredData";
import { formatCitationDate, getPostCitation } from "@/lib/collections/posts/citations";
import { runQueryWithAnonymousCache } from "../postPageCache/anonymousQueryCache";

const PostMetadataQuery = gql(`
  query PostMetadata($postId: String) {
    post(selector: { _id: $postId }) {
      result {
        ...PostsCitationInfo
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
        coauthorUserIds
        shortform
        noIndex
        rejected
        baseScore
      }
    }
  }
`);

/**
 * Highwire Press citation_* meta tags, which Google Scholar (and reference
 * managers such as Zotero) use to index and import the post as a citable work.
 * See https://scholar.google.com/intl/en/scholar/inclusion.html#indexing
 */
function getCitationTags(post: PostMetadataQuery_post_SinglePostOutput_result_Post, canonicalUrl: string, forumType: ForumTypeString) {
  const citation = getPostCitation(post, forumType);
  const publicationDate = citation.publishedAt
    ? formatCitationDate(citation.publishedAt, citation.timezone, "YYYY/MM/DD")
    : null;

  return {
    citation_title: citation.title,
    citation_author: citation.authors,
    ...(publicationDate && {
      citation_publication_date: publicationDate,
      citation_online_date: publicationDate,
    }),
    citation_publisher: citation.siteName,
    citation_public_url: canonicalUrl,
    citation_fulltext_html_url: canonicalUrl,
    citation_abstract_html_url: canonicalUrl,
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
        runQueryWithAnonymousCache(
          PostMetadataQuery,
          { postId },
          resolverContext
        ),
        commentId
          ? runQueryWithAnonymousCache(
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
        : getPostDescription(post, resolverContext.forumType) ?? defaultMetadata.description;
  
      const ogUrl = postGetAbsolutePageUrl(post, resolverContext.forumType);
      const canonicalUrl = post.canonicalSource ?? ogUrl;
      const socialPreviewImageUrl = post.socialPreviewData.imageUrl;
      const postNoIndex = post.noIndex || post.rejected;
      const noIndex = postNoIndex || commentId || options?.noIndex;
      // Don't advertise unlisted posts, or non-canonical views of a post such
      // as old revisions, as citable works.
      const includeCitationTags = !postNoIndex && !options?.noIndex;
  
      const titleFields = await getPageTitleFields(post.title);
      const descriptionFields = getMetadataDescriptionFields(description);
      const imagesFields = getMetadataImagesFields(socialPreviewImageUrl);
      
      const postMetadata = {
        openGraph: {
          url: ogUrl,
        },
        alternates: {
          canonical: canonicalUrl,
        },
        ...(includeCitationTags ? { other: getCitationTags(post, canonicalUrl, resolverContext.forumType) } : {}),
        ...(noIndex ? noIndexMetadata : {}),
      } satisfies Metadata;
  
      return merge({}, defaultMetadata, postMetadata, titleFields, descriptionFields, imagesFields);
    } catch (error) {
      return handleMetadataError('Error generating post page metadata', error);
    }
  }
}

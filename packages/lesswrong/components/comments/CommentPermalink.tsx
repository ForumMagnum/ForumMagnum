import React from 'react';
import { commentIsHiddenPendingReview } from '../../lib/collections/comments/helpers';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { isLWorAF } from '../../lib/instanceSettings';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { isNotRandomId } from '@/lib/random';
import { scrollFocusOnElement } from '@/lib/scrollUtils';
import { commentPermalinkStyleSetting } from '@/lib/publicSettings';
import { isBookUI } from '@/themes/forumTheme';
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import Loading from "../vulcan-core/Loading";
import Divider from "../common/Divider";
import CommentOnPostWithReplies from "./CommentOnPostWithReplies";
import HeadTags from "../common/HeadTags";
import CommentWithReplies from "./CommentWithReplies";


const CommentWithRepliesFragmentQuery = gql(`
  query CommentPermalink($documentId: String) {
    comment(input: { selector: { documentId: $documentId } }) {
      result {
        ...CommentWithRepliesFragment
      }
    }
  }
`);

const styles = (theme: ThemeType) => ({
  root: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    ...(isBookUI ? {
      marginTop: 64
    } : {}),
  },
  dividerMargins: {
    marginTop: 150,
    marginBottom: 150,
  },
  permalinkLabel: {
    color: theme.palette.grey[600],
    marginBottom: theme.spacing.unit*2,
    marginLeft: 10,
    [theme.breakpoints.down('md')]: {
      marginTop: theme.spacing.unit*2
    }
  },
  seeInContext: {
    textAlign: "right",
    color: theme.palette.lwTertiary.main,
    marginRight: 10
  },
})

const getCommentDescription = (comment: CommentWithRepliesFragment) => {
  if (comment.deleted) return '[Comment deleted]'

  return `Comment ${comment.user ? 
    `by ${comment.user.displayName} ` : 
    ''
  }- ${comment.contents?.plaintextMainText}`
}

const CommentPermalink = ({
  documentId,
  post,
  silentLoading=false,
  classes
}: {
  documentId: string,
  post?: PostsDetails,
  silentLoading?: boolean,
  classes: ClassesType<typeof styles>,
}) => {
  const hasInContextComments = commentPermalinkStyleSetting.get() === 'in-context'

  const { data, loading, error, refetch } = useQuery(CommentWithRepliesFragmentQuery, {
    variables: { documentId: documentId },
    skip: isNotRandomId(documentId),
  });
  const comment = data?.comment?.result;

  if (silentLoading && !comment) return null;

  if (error || (!comment && !loading)) return <div>Comment not found</div>
  
  if (loading) return <Loading />

  if (!comment || !documentId) return null
  
  // if the site is currently hiding comments by unreviewed authors, check if we need to hide this comment
  if (commentIsHiddenPendingReview(comment) && !comment.rejected) return <div className={classes.root}>
    <div className={classes.permalinkLabel}>
      Comment Permalink 
      <p>Error: Sorry, this comment is hidden</p>
    </div>
    {isLWorAF && <div className={classes.dividerMargins}>
      <Divider />
    </div>}
  </div>

  const ogUrl = post ? postGetPageUrl(post, true) : undefined // open graph
  const canonicalUrl = post ? post.canonicalSource || ogUrl : undefined
  // For imageless posts this will be an empty string
  const socialPreviewImageUrl = post ? post.socialPreviewData?.imageUrl : undefined

  const commentNodeProps = {
    treeOptions: {
      refetch,
      showPostTitle: false,
    },
    forceUnTruncated: true,
    forceUnCollapsed: true,
    noAutoScroll: true
  };

  // NB: classes.root is not in the above styles, but is used by eaTheme
  return (
    <div className={classes.root}>
      <div className={classes.permalinkLabel}>Comment Permalink</div>
      <div>
        <HeadTags
          ogUrl={ogUrl}
          canonicalUrl={canonicalUrl}
          image={socialPreviewImageUrl}
          description={getCommentDescription(comment)}
          noIndex={true}
        />
        {post ? (
          <CommentOnPostWithReplies
            key={comment._id}
            post={post}
            comment={comment}
            commentNodeProps={commentNodeProps}
          />
        ) : (
          <CommentWithReplies
            key={comment._id}
            comment={comment}
            commentNodeProps={commentNodeProps}
            initialMaxChildren={5}
          />
        )}
        <div className={classes.seeInContext}>
          <a href={`#${documentId}`} onClick={(e) => {
            if (!hasInContextComments) return;

            scrollFocusOnElement({ id: comment._id, options: { behavior: "smooth" } });
            e.preventDefault()
          }}>See in context</a>
        </div>
      </div>
      {isLWorAF && <div className={classes.dividerMargins}>
        <Divider />
      </div>}
    </div>
  );
}

export default registerComponent("CommentPermalink", CommentPermalink, { styles });




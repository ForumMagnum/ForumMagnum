import React, { useEffect, useRef } from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { Link } from "../../lib/reactRouterWrapper";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import { useMulti } from "@/lib/crud/withMulti";
import { useLocation, useNavigate } from "@/lib/routeUtil";
import LWDialog from "../common/LWDialog";
import FeedContentBody from "./FeedContentBody";
import UltraFeedItemFooter from "./UltraFeedItemFooter";
import Loading from "../vulcan-core/Loading";
import CommentsListSection from "../comments/CommentsListSection";
import ForumIcon from '../common/ForumIcon';
import { DialogContent } from "../widgets/DialogContent";
import { useQuery } from "@apollo/client";
import { gql } from "@/lib/generated/gql-codegen/gql";

const UltraFeedPostFragmentQuery = gql(`
  query UltraFeedPostDialog($documentId: String) {
    post(input: { selector: { documentId: $documentId } }) {
      result {
        ...UltraFeedPostFragment
      }
    }
  }
`);

const styles = defineStyles("UltraFeedPostDialog", (theme: ThemeType) => ({
  '@global': {
    // Style the browser's text fragment highlighting
    '::target-text': {
      backgroundColor: `${theme.palette.secondary.light}4c`,
    },
    // fallback/common implementation
    'mark': {
      backgroundColor: `${theme.palette.secondary.light}4c`,
    }
  },
  dialogContent: {
    padding: 20,
    paddingTop: 0,
    [theme.breakpoints.down('sm')]: {
      padding: 10,
      paddingTop: 0,
    }
  },
  titleContainer: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontFamily: theme.palette.fonts.serifStack,
    fontSize: '1.4rem',
    fontWeight: 600,
    paddingTop: 4,
    opacity: 0.8,
    lineHeight: 1.15,
    textWrap: 'balance',
    width: '100%',
    '&:hover': {
      opacity: 0.9,
      textDecoration: 'none',
    },
    [theme.breakpoints.down('sm')]: {
      fontSize: '1.6rem',
    },
  },
  chevronButton: {
    cursor: 'pointer',
    opacity: 0.8,
    marginRight: 12,
    fontSize: 24,
    '&:hover': {
      color: theme.palette.grey[700],
    },
    '& svg': {
      display: 'block',
    }
  },
  dialogPaper: {
    maxWidth: 765,
    height: '100dvh',
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    padding: "40px 0",
  },
  voteContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    fontFamily: `${theme.palette.fonts.sansSerifStack} !important`,
  },
  voteBottom: {
    display: 'flex',
    justifyContent: 'center',
    position: 'relative',
    fontSize: 42,
    textAlign: 'center',
    marginBottom: 40,
    "@media print": { display: "none" },
    '& h1': {
      fontFamily: `${theme.palette.fonts.sansSerifStack} !important`,
    }
  },
  footer: {
    marginTop: 24,
    marginBottom: 24,
  }
}));

type UltraFeedPostDialogProps = {
  postId?: string;
  post?: never;
  onClose: () => void;
  textFragment?: string;
} | {
  postId?: never;
  post: PostsPage | UltraFeedPostFragment;
  onClose: () => void;
  textFragment?: string;
}

const UltraFeedDialogContent = ({
  post,
  comments,
  commentsLoading,
  commentsTotalCount,
  textFragment,
  onClose,
}: {
  post: PostsPage | UltraFeedPostFragment;
  comments?: CommentsList[];
  commentsLoading: boolean;
  commentsTotalCount: number;
  textFragment?: string;
  onClose: () => void;
}) => {
  const classes = useStyles(styles);

  const navigate = useNavigate();

  useEffect(() => {
    if (textFragment) {
      // it would be nice to use navigate here, but it doesn't work to trigger scrolling and highlighting
      window.location.hash = textFragment;
    }

    return () => {
      navigate({ hash: "" }, { replace: true });
    };
  }, [textFragment, navigate]);

  return (
    <LWDialog
      open={true}
      onClose={onClose}
      fullWidth
      paperClassName={classes.dialogPaper}
    >
      <DialogContent className={classes.dialogContent}>
        {post && <div>
          <div className={classes.titleContainer}>
            <ForumIcon 
              icon="ThickChevronLeft" 
              onClick={onClose} 
              className={classes.chevronButton} 
            />
            <Link
              to={postGetPageUrl(post)}
              className={classes.title}
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }
              }>
              {post.title}
            </Link>
          </div>
          {post?.contents?.html ? (
            <FeedContentBody
              html={post.contents.html}
              wordCount={post.contents.wordCount || 0}
              linkToDocumentOnFinalExpand={false}
              hideSuffix
              serifStyle
            />
          ) : (
            <div>Post content not available.</div>
          )}
        </div>}
        <UltraFeedItemFooter
          document={post}
          collectionName="Posts"
          metaInfo={{
            sources: [],
            displayStatus: "expanded",
          }}
          className={classes.footer}
        />
        {commentsLoading && <div className={classes.loadingContainer}><Loading /></div>}
        {comments && (
          <CommentsListSection
            post={post}
            comments={comments ?? []}
            totalComments={commentsTotalCount ?? 0}
            commentCount={(comments ?? []).length}
            loadMoreComments={() => { }}
            loadingMoreComments={false}
            highlightDate={undefined}
            setHighlightDate={() => { }}
            hideDateHighlighting={true}
            newForm={true}
          />
        )}
      </DialogContent>
    </LWDialog>
  );

}


const UltraFeedPostDialog = ({
  postId,
  post,
  onClose,
  textFragment,
}: UltraFeedPostDialogProps) => {
  const classes = useStyles(styles);

  const { loading: loadingPost, data } = useQuery(UltraFeedPostFragmentQuery, {
    variables: { documentId: postId },
    skip: !!post,
  });
  const fetchedPost = data?.post?.result;

  const { results: comments, loading: isCommentsLoading, totalCount: commentsTotalCount } = useMulti({
    terms: {
      view: "postCommentsTop",
      postId: postId ?? post?._id,
      limit: 100, // TODO: add load more
    },
    collectionName: "Comments",
    fragmentName: "CommentsList",
    skip: !(postId ?? post?._id),
    enableTotal: true,
  });

  const fullPost = post ?? fetchedPost;
  const isLoading = !!postId && loadingPost && !post;

  return <>
    {isLoading && <div className={classes.loadingContainer}>
      <Loading />
    </div>}
    {fullPost && <UltraFeedDialogContent
      post={fullPost}
      comments={comments}
      commentsLoading={isCommentsLoading}
      commentsTotalCount={commentsTotalCount ?? 0}
      textFragment={textFragment}
      onClose={onClose}
    />}
  </>
};

export default UltraFeedPostDialog;



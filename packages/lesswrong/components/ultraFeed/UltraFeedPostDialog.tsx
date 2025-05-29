import React, { useEffect, useRef } from "react";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { useSingle } from "../../lib/crud/withSingle";
import { Link } from "../../lib/reactRouterWrapper";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import { useMulti } from "@/lib/crud/withMulti";
import { useNavigate } from "@/lib/routeUtil";
import LWDialog from "../common/LWDialog";
import FeedContentBody from "./FeedContentBody";
import UltraFeedItemFooter from "./UltraFeedItemFooter";
import Loading from "../vulcan-core/Loading";
import CommentsListSection from "../comments/CommentsListSection";
import ForumIcon from '../common/ForumIcon';
import { DialogContent } from "../widgets/DialogContent";
import TruncatedAuthorsList from "../posts/TruncatedAuthorsList";
import FormatDate from "../common/FormatDate";
import PostActionsButton from "../dropdowns/posts/PostActionsButton";
import UltraFeedPostActions from "./UltraFeedPostActions";
import { AnalyticsContext } from "../../lib/analyticsEvents";

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
    padding: 0,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    position: 'relative',
    '&:first-child': {
      paddingTop: 0,
    }
  },
  titleContainer: {
    display: 'flex',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    backgroundColor: theme.palette.background.pageActiveAreaBackground,
    zIndex: 10,
    padding: '20px 20px 12px 20px',
    marginBottom: 0,
    // borderBottom: `1px solid ${theme.palette.grey[300]}`,
    [theme.breakpoints.down('sm')]: {
      padding: '16px 10px 16px 10px',
    }
  },
  tripleDotMenu: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 11,
    opacity: 0.7,
    padding: 5,
    "& svg": {
      fontSize: 18,
      cursor: "pointer",
      color: theme.palette.text.dim,
      transform: 'rotate(90deg)',
    },
    [theme.breakpoints.down('sm')]: {
      top: 16,
      right: 10,
    }
  },
  headerContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: 1,
  },
  titleWrapper: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
  },
  metaRow: {
    gap: "12px",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "baseline",
    rowGap: "6px",
    color: theme.palette.text.dim,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: theme.typography.body2.fontSize,
    [theme.breakpoints.down('sm')]: {
      fontSize: 17,
    },
  },
  metaDateContainer: {
    marginRight: 8,
  },
  authorsList: {
    fontSize: 'inherit',
    color: 'inherit',
    fontFamily: 'inherit',
    marginRight: 8,
    flexShrink: 1,
    minWidth: 0,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
  },
  scrollableContent: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 20px 20px 20px',
    [theme.breakpoints.down('sm')]: {
      padding: '0 10px 10px 10px',
    }
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
    maxHeight: '100dvh',
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
  const authorListRef = useRef<HTMLDivElement>(null);

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
        {post && <>
          <AnalyticsContext pageElementContext="tripleDotMenu">
            <PostActionsButton
              post={post}
              vertical={true}
              autoPlace
              ActionsComponent={UltraFeedPostActions}
              className={classes.tripleDotMenu}
            />
          </AnalyticsContext>
          <div className={classes.titleContainer}>
            <ForumIcon 
              icon="ThickChevronLeft" 
              onClick={onClose} 
              className={classes.chevronButton} 
            />
            <div className={classes.headerContent}>
              <div className={classes.titleWrapper}>
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
              <div className={classes.metaRow}>
                <TruncatedAuthorsList 
                  post={post} 
                  useMoreSuffix={false} 
                  expandContainer={authorListRef}
                  className={classes.authorsList} 
                />
                {post.postedAt && (
                  <span className={classes.metaDateContainer}>
                    <FormatDate date={post.postedAt} format="MMM D YYYY" />
                  </span>
                )}
                {post.readTimeMinutes && (
                  <span>{post.readTimeMinutes} min read</span>
                )}
              </div>
            </div>
          </div>
          <div className={classes.scrollableContent}>
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
          </div>
        </>}
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

  const { document: fetchedPost, loading: loadingPost } = useSingle({
    documentId: postId,
    collectionName: "Posts",
    fragmentName: "UltraFeedPostFragment",
    skip: !!post,
  });

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



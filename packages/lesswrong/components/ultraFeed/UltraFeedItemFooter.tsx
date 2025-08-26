import React from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { defineStyles, useStyles } from "../hooks/useStyles";
import classNames from "classnames";
import CommentIcon from '@/lib/vendor/@material-ui/icons/src/ModeCommentOutlined';
import { DebateIconOutline } from '../icons/DebateIconOutline';
import { useVote } from "../votes/withVote";
import { VotingProps } from "../votes/votingProps";
import { getVotingSystemByName } from "@/lib/voting/getVotingSystem";
import { FeedCommentMetaInfo, FeedPostMetaInfo } from "./ultraFeedTypes";
import { useCurrentUser } from "../common/withUser";
import { useDialog } from "../common/withDialog";
import { bookmarkableCollectionNames } from "@/lib/collections/bookmarks/constants";
import BookmarkButton from "../posts/BookmarkButton";
import UltraFeedPostDialog from "./UltraFeedPostDialog";
import OverallVoteAxis from "../votes/OverallVoteAxis";
import AgreementVoteAxis from "../votes/AgreementVoteAxis";
import { getDefaultVotingSystem } from "@/lib/collections/posts/newSchema";
import { useMutation } from "@apollo/client/react";
import { gql } from "@/lib/generated/gql-codegen";
import CondensedFooterReactions from "./CondensedFooterReactions";
import LWTooltip from "../common/LWTooltip";
import { useTracking, AnalyticsContext } from "../../lib/analyticsEvents";
import UltraFeedReplyEditor from "./UltraFeedReplyEditor";
import { ReplyConfig } from "./UltraFeedCommentItem";
import { useUltraFeedContext } from "./UltraFeedContextProvider";


const UltraFeedEventsDefaultFragmentMutation = gql(`
  mutation createUltraFeedEventUltraFeedItemFooter($data: CreateUltraFeedEventDataInput!) {
    createUltraFeedEvent(data: $data) {
      data {
        ...UltraFeedEventsDefaultFragment
      }
    }
  }
`);

const styles = defineStyles("UltraFeedItemFooter", (theme: ThemeType) => ({
  root: {
    marginLeft: -6, // cause actual edge of CommentIcon to align with edge of text
    position: "relative",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    minHeight: 28, // Ensures consistent height whether reactions are present or not
    opacity: `1 !important`,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: theme.typography.body2.fontSize,
    lineHeight: 1,
    // every child except last has margin right applied
    "& > *:not(:last-child)": {
      marginRight: 16,
    },
    "& > *:nth-last-child(2)": {
      marginRight: 4,
    },
    "& a:hover, & a:active": {
      textDecoration: "none",
      color: `${theme.palette.linkHover.dim} !important`,
    },
    [theme.breakpoints.down('sm')]: {
      justifyContent: "space-between",
      ...theme.typography.ultraFeedMobileStyle,
      "& > *:not(:last-child)": {
        marginRight: 'unset',
      },
    },
  },
  commentCount: {
    position: 'relative',
    bottom: 1,
    color: `${theme.palette.ultraFeed.dim} !important`,
    display: "inline-flex",
    alignItems: "center",
    verticalAlign: 'middle',
    height: 24, // Match the height of vote buttons
    "& svg": {
      position: "relative",
      height: 18,
      top: 2,
      [theme.breakpoints.down('sm')]: {
        top: 1,
        height: 20,
        width: 20,
      },
    },
    [theme.breakpoints.down('sm')]: {
      top: 0,
      opacity: 0.95,
    }
  },
  showAllCommentsWrapper: {
    display: 'inline-flex',
    alignItems: 'center',
    "& svg": {
      [theme.breakpoints.down('sm')]: {
        height: 20,
        width: 20,
      },
    },
  },
  showAllComments: {
    position: 'relative',
    bottom: 0,
    padding: 2,
    color: `${theme.palette.ultraFeed.dim} !important`,
    display: "inline-flex",
    alignItems: "center",
    borderRadius: 4,
    cursor: "pointer",
    transition: 'background-color 0.2s ease',
    height: 24,
    "& svg": {
      position: "relative",
      height: 15,
      top: 0,
      [theme.breakpoints.down('sm')]: {
        height: 18,
        width: 18,
      },
    },
    "&:hover": {
      color: theme.palette.grey[1000],
    },
  },
  showAllCommentsCount: {
    marginLeft: 2,
    [theme.breakpoints.down('sm')]: {
      fontSize: 17,
      marginLeft: 6,
    },
  },
  commentCountClickable: {
    cursor: "pointer",
    "&:hover": {
      color: theme.palette.grey[1000],
    },
  },
  commentCountDisabled: {
    cursor: "not-allowed",
    opacity: 0.4,
    "&:hover": {
      color: `${theme.palette.ultraFeed.dim} !important`,
    },
  },
  commentCountActive: {
    opacity: 1,
    "& svg": {
      opacity: 1,
    },
  },
  commentCountInner: {
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: 4,
    padding: "2px 4px",
    transition: 'background-color 0.2s ease',
    "&:hover": {
      backgroundColor: theme.palette.panelBackground.hoverHighlightGrey,
    },
  },
  commentCountInnerActive: {
    backgroundColor: theme.palette.panelBackground.hoverHighlightGrey,
  },
  commentCountText: {
    marginLeft: 4,
    display: 'none',
  },
  reactionIcon: {
    marginRight: 6,
  },
  reactionCount: {
    position: "relative",
    bottom: 2,
  },
  condensedFooterReactions: {
    marginLeft: 'auto',
    [theme.breakpoints.down('sm')]: {
      marginLeft: 'unset',
      
    },
  },
  hidden: {
    visibility: 'hidden',
  },
  bookmarkButtonContainer: {
    [theme.breakpoints.down('sm')]: {
      display: 'none',
    },
  },
  bookmarkButton: {
    position: "relative", 
    top: 1,
    opacity: 0.7,
    display: "inline-flex",
    alignItems: "center",
    "& svg": {
      color: `${theme.palette.ultraFeed.dim} !important`,
      height: 20,
      [theme.breakpoints.down('sm')]: {
        height: 22,
      },
    },
  },
  bookmarkButtonHighlighted: {
    color: `${theme.palette.primary.main} !important`,
    "& svg": {
      color: `${theme.palette.primary.main} !important`,
    },
  },

  overallVoteButtons: {
    position: 'relative',
    bottom: 1,
    color: `${theme.palette.ultraFeed.dim} !important`,
    display: 'inline-flex',
    alignItems: 'center',
    verticalAlign: 'middle',
    height: 24,
    "& .VoteArrowIconSolid-root": {
    },
    [theme.breakpoints.down('sm')]: {
      bottom: 0,
    }
  },
  agreementButtons: {
    position: 'relative',
    bottom: 1,
    color: `${theme.palette.ultraFeed.dim} !important`,
    display: 'inline-flex',
    alignItems: 'center',
    verticalAlign: 'middle',
    height: 24,
    marginLeft: -8,
    [theme.breakpoints.down('sm')]: {
      bottom: 0,
    }
  },
  footerVoteScoreOverride: {
    fontSize: `${theme.typography.body2.fontSize}px !important`, 
    margin: '0 7px !important',
    lineHeight: '24px !important',
    verticalAlign: 'middle !important',
    [theme.breakpoints.down('sm')]: {
      fontSize: '17px !important',
      margin: '0 7px !important',
      lineHeight: '24px !important',
    }
  },
  hideSecondaryScoreOnMobile: {
    [theme.breakpoints.down('sm')]: {
      display: 'none !important',
    }
  },
  footerAgreementScoreOverride: {
    fontSize: `${theme.typography.body2.fontSize}px !important`,
    margin: '0 7px !important',
    lineHeight: '24px !important',
    verticalAlign: 'middle !important',
    [theme.breakpoints.down('sm')]: {
      fontSize: '17px !important',
      margin: '0 7px !important',
      lineHeight: '24px !important',
    }
  },

}));

interface BookmarkProps {
  documentId: string;
  highlighted?: boolean;
}

interface UltraFeedItemFooterCoreSharedProps {
  commentCount: number | undefined;
  onClickComments: () => void;
  showVoteButtons: boolean;
  voteProps: VotingProps<VoteableTypeClient>;
  hideKarma?: boolean;
  bookmarkProps?: BookmarkProps;
  metaInfo?: FeedPostMetaInfo | FeedCommentMetaInfo;
  className?: string;
  replyConfig: ReplyConfig;
  cannotReplyReason?: string | null;
  hideReacts?: boolean;
}

type UltraFeedItemFooterCorePostsProps = UltraFeedItemFooterCoreSharedProps & {
  collectionName: "Posts";
  document: PostsListWithVotes;
};

type UltraFeedItemFooterCoreCommentsProps = UltraFeedItemFooterCoreSharedProps & {
  collectionName: "Comments";
  document: UltraFeedComment;
};

type UltraFeedItemFooterCoreProps =
  | UltraFeedItemFooterCorePostsProps
  | UltraFeedItemFooterCoreCommentsProps;

const UltraFeedItemFooterCore = ({
  commentCount,
  onClickComments,
  showVoteButtons,
  voteProps,
  hideKarma,
  bookmarkProps,
  collectionName,
  metaInfo,
  className,
  document,
  replyConfig,
  cannotReplyReason,
  hideReacts = false,
}: UltraFeedItemFooterCoreProps) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const { captureEvent } = useTracking();

  const { isReplying, onReplyClick, onReplyCancel } = replyConfig;

  const [createUltraFeedEvent] = useMutation(UltraFeedEventsDefaultFragmentMutation);

  // TODO:the wrapping approach does not work with votes as click-handlers inside the vote bottons prevent an onClick at this level from firing
  const handleInteractionLog = (interactionType: 'bookmarkClicked' | 'commentsClicked') => {
    if (!currentUser || !voteProps.document) return;

    const eventData = {
      data: {
        userId: currentUser._id,
        eventType: 'interacted' as const,
        documentId: voteProps.document._id,
        collectionName: voteProps.collectionName,
        feedItemId: metaInfo?.servedEventId,
        event: { interactionType },
      }
    };
    void createUltraFeedEvent({ variables: eventData });
  };

  const handleCommentsClick = () => {
    if (cannotReplyReason) {
      return;
    }
    
    if (isReplying) {
      captureEvent("ultraFeedCommentIconClicked", { action: "closeReply" });
      onReplyCancel();
    } else {
      captureEvent("ultraFeedCommentIconClicked", { action: "openReply" });
      handleInteractionLog('commentsClicked');
      onReplyClick();
    }
  };



  let commentIconTooltip: string;
  if (cannotReplyReason) {
    commentIconTooltip = cannotReplyReason;
  } else if (isReplying) {
    commentIconTooltip = "Close reply";
  } else if (collectionName === "Comments") {
    commentIconTooltip = "Reply";
  } else {
    commentIconTooltip = "Comment";
  }

  const commentCountIcon = (
    <div
      onClick={handleCommentsClick}
      className={classNames(
        classes.commentCount,
        { 
          [classes.commentCountClickable]: !cannotReplyReason,
          [classes.commentCountDisabled]: cannotReplyReason,
          [classes.commentCountActive]: isReplying
        }
      )}
    >
      <LWTooltip title={commentIconTooltip} disabledOnMobile>
        <span className={classNames(
          classes.commentCountInner,
          { [classes.commentCountInnerActive]: isReplying }
        )}>
          <CommentIcon />
          {(commentCount ?? 0 > 0) 
            ? <span className={classes.commentCountText}>{commentCount}</span>
            : null
          }
        </span>
      </LWTooltip>
    </div>
  );

  const showAllCommentsTooltip = (collectionName==='Posts')
    ? `Show all comments`
    : `Show ${commentCount} descendant${commentCount === 1 ? '' : 's'}`;

  const showAllCommentsButton = <div className={classes.showAllCommentsWrapper}>
      <LWTooltip title={showAllCommentsTooltip} disabledOnMobile>
      <div
        onClick={() => {
          captureEvent("ultraFeedShowAllCommentsClicked")
          onClickComments();
        }}
        className={classes.showAllComments}
      >
        <DebateIconOutline />
        {(commentCount ?? 0) > 0 && <span className={classes.showAllCommentsCount}>{commentCount}</span>}
      </div>
      </LWTooltip>
    </div>

  const votingSystem = voteProps.document.votingSystem || getDefaultVotingSystem();

  return (
    <AnalyticsContext pageElementContext="ultraFeedFooter" documentId={document._id} collectionName={collectionName}>
      <div className={classNames(classes.root, className)}>
        {commentCountIcon}
        {showAllCommentsButton}

        {showVoteButtons && voteProps.document && (
          <>
            <div className={classes.overallVoteButtons}>
              <OverallVoteAxis
                document={voteProps.document}
                hideKarma={hideKarma}
                voteProps={voteProps}
                verticalArrows
                largeArrows
                voteScoreClassName={classes.footerVoteScoreOverride}
                secondaryScoreClassName={classes.hideSecondaryScoreOnMobile}
                hideAfScore={true}
              />
            </div>
            {collectionName === "Comments" && <div className={classes.agreementButtons}>
              <AgreementVoteAxis
                document={voteProps.document}
                hideKarma={hideKarma}
                voteProps={voteProps}
                agreementScoreClassName={classes.footerAgreementScoreOverride}
              />
            </div>}
          </>
        )}

        {voteProps.document && votingSystem === "namesAttachedReactions" && (
          <div className={classNames(classes.condensedFooterReactions, {[classes.hidden]: hideReacts})}>
            <CondensedFooterReactions
              voteProps={voteProps}
              allowReactions={collectionName === "Comments"}
            />
          </div>
        )}

        { bookmarkProps && bookmarkableCollectionNames.has(collectionName) && (
          <div 
            className={classes.bookmarkButtonContainer}
            onClick={() => {
              captureEvent('ultraFeedBookmarkInFooterClicked', { documentId: bookmarkProps.documentId, collectionName: collectionName });
              handleInteractionLog('bookmarkClicked');
            }}
          >
            <BookmarkButton
              documentId={bookmarkProps.documentId}
              collectionName={collectionName}
              className={classNames(classes.bookmarkButton, { [classes.bookmarkButtonHighlighted]: bookmarkProps.highlighted })}
            />
          </div>
        )}
      </div>
    </AnalyticsContext>
  );
};


const UltraFeedPostFooter = ({ post, metaInfo, className, replyConfig, hideReacts }: { post: PostsListWithVotes, metaInfo: FeedPostMetaInfo, className?: string, replyConfig: ReplyConfig, hideReacts?: boolean }) => {
  const { openDialog } = useDialog();
  const { openInNewTab } = useUltraFeedContext();

  const votingSystem = getVotingSystemByName(post?.votingSystem || "default");
  const voteProps = useVote(post, "Posts", votingSystem);
  const showVoteButtons = votingSystem.name === "namesAttachedReactions";
  const commentCount = post.commentCount ?? 0;
  const bookmarkProps: BookmarkProps = {documentId: post._id, highlighted: metaInfo.sources?.includes("bookmarks")};
  
  const onClickComments = () => {
    if (openInNewTab) {
      const postUrl = `/posts/${post._id}/${post.slug}#comments`;
      window.open(postUrl, '_blank');
    } else {
      openDialog({
        name: "UltraFeedPostDialog",
        closeOnNavigate: true,
        contents: ({onClose}) => <UltraFeedPostDialog 
          partialPost={post}
          postMetaInfo={metaInfo}
          openAtComments={true}
          onClose={onClose}
        />
      });
    }
  }

  const { isReplying, onReplySubmit, onReplyCancel } = replyConfig;

  return (
    <>
      <UltraFeedItemFooterCore
        commentCount={commentCount}
        onClickComments={onClickComments}
        showVoteButtons={showVoteButtons}
        voteProps={voteProps}
        hideKarma={false}
        bookmarkProps={bookmarkProps}
        collectionName="Posts"
        metaInfo={metaInfo}
        className={className}
        document={post}
        replyConfig={replyConfig}
        cannotReplyReason={null}
        hideReacts={hideReacts}
      />

      {isReplying && (
        <UltraFeedReplyEditor
          document={post}
          collectionName="Posts"
          cannotReplyReason={null}
          onReplySubmit={onReplySubmit}
          onReplyCancel={onReplyCancel}
          onViewAllComments={() => {
            if (openInNewTab) {
              const postUrl = `/posts/${post._id}/${post.slug}#comments`;
              window.open(postUrl, '_blank');
            } else {
              openDialog({
                name: "UltraFeedPostDialog",
                closeOnNavigate: true,
                contents: ({ onClose }) => (
                  <UltraFeedPostDialog
                    partialPost={post}
                    postMetaInfo={metaInfo}
                    openAtComments={true}
                    onClose={onClose}
                  />
                ),
              });
            }
          }}
        />
      )}
    </>
  );
}


const UltraFeedCommentFooter = ({ comment, metaInfo, className, replyConfig, cannotReplyReason, hideReacts }: { comment: UltraFeedComment, metaInfo: FeedCommentMetaInfo, className?: string, replyConfig: ReplyConfig, cannotReplyReason?: string | null, hideReacts?: boolean }) => {
  const { openDialog } = useDialog();
  const { openInNewTab } = useUltraFeedContext();

  const parentPost = comment.post;
  const votingSystem = getVotingSystemByName(parentPost?.votingSystem || "default");
  const voteProps = useVote(comment, "Comments", votingSystem);
  const hideKarma = !!parentPost?.hideCommentKarma;
  const showVoteButtons = votingSystem.name === "namesAttachedReactions" && !hideKarma;
  const commentCount = metaInfo.descendentCount;
  const bookmarkProps: BookmarkProps = {documentId: comment._id, highlighted: metaInfo.sources?.includes("bookmarks")};
  
  const onClickComments = () => {
    // If comment doesn't have a post, we can't open the dialog, but this should never happen
    if (!comment.post) {
      return;
    }
    
    const post = comment.post;
    
    if (openInNewTab) {
      const postUrl = `/posts/${post._id}/${post.slug}?commentId=${comment._id}`;
      window.open(postUrl, '_blank');
    } else {
      openDialog({
        name: "UltraFeedPostDialog", 
        closeOnNavigate: true,
        contents: ({onClose}) => <UltraFeedPostDialog 
          partialPost={post}
          postMetaInfo={{
            sources: metaInfo.sources,
            displayStatus: 'expanded' as const,
            servedEventId: metaInfo.servedEventId ?? '',
            highlight: false,
          }}
          targetCommentId={comment._id}
          topLevelCommentId={post.shortform ? (comment.topLevelCommentId ?? comment._id) : undefined}
          onClose={onClose}
        />
      });
    }
  };
  
  const { isReplying, onReplySubmit, onReplyCancel } = replyConfig;

  return (
    <>
      <UltraFeedItemFooterCore
        commentCount={commentCount}
        onClickComments={onClickComments}
        showVoteButtons={showVoteButtons}
        voteProps={voteProps}
        hideKarma={hideKarma}
        bookmarkProps={bookmarkProps}
        collectionName={"Comments"}
        metaInfo={metaInfo}
        className={className}
        document={comment}
        replyConfig={replyConfig}
        cannotReplyReason={cannotReplyReason}
        hideReacts={hideReacts}
      />

      {isReplying && <UltraFeedReplyEditor
        document={comment}
        collectionName="Comments"
        cannotReplyReason={cannotReplyReason}
        onReplySubmit={onReplySubmit}
        onReplyCancel={onReplyCancel}
        onViewAllComments={onClickComments}
      />}
    </>
  );
}


interface UltraFeedPostFooterProps {
  document: PostsListWithVotes;
  collectionName: "Posts";
  metaInfo: FeedPostMetaInfo;
  className?: string;
  replyConfig: ReplyConfig;
  cannotReplyReason?: string | null;
  hideReacts?: boolean;
}

interface UltraFeedCommentFooterProps {
  document: UltraFeedComment;
  collectionName: "Comments";
  metaInfo: FeedCommentMetaInfo;
  className?: string;
  replyConfig: ReplyConfig;
  cannotReplyReason?: string | null;
  hideReacts?: boolean;
}

type UltraFeedItemFooterProps = UltraFeedPostFooterProps | UltraFeedCommentFooterProps;

const UltraFeedItemFooter = ({ document, collectionName, metaInfo, className, replyConfig, cannotReplyReason, hideReacts }: UltraFeedItemFooterProps) => {
  if (collectionName === "Posts") {
    return <UltraFeedPostFooter
      post={document}
      metaInfo={metaInfo}
      className={className}
      replyConfig={replyConfig}
      hideReacts={hideReacts}
    />;
  } else if (collectionName === "Comments") {
    return <UltraFeedCommentFooter
      comment={document}
      metaInfo={metaInfo}
      className={className}
      replyConfig={replyConfig}
      cannotReplyReason={cannotReplyReason}
      hideReacts={hideReacts}
    />;
  }
  return null;
};


export default registerComponent("UltraFeedItemFooter", UltraFeedItemFooter);

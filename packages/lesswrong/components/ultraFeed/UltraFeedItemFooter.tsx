import React from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { defineStyles, useStyles } from "../hooks/useStyles";
import classNames from "classnames";
import CommentIcon from '@/lib/vendor/@material-ui/icons/src/ModeCommentOutlined';
import { DebateIconOutline } from '../icons/DebateIconOutline';
import CloseIcon from '@/lib/vendor/@material-ui/icons/src/Close';
import { useVote } from "../votes/withVote";
import { VotingProps } from "../votes/votingProps";
import { getVotingSystemByName } from "@/lib/voting/getVotingSystem";
import { FeedCommentMetaInfo, FeedPostMetaInfo } from "./ultraFeedTypes";
import { useCurrentUser } from "../common/withUser";
import { useDialog } from "../common/withDialog";
import { bookmarkableCollectionNames } from "@/lib/collections/bookmarks/constants";
import BookmarkButton from "../posts/BookmarkButton";
import UltraFeedCommentsDialog from "./UltraFeedCommentsDialog";
import OverallVoteAxis from "../votes/OverallVoteAxis";
import AgreementVoteAxis from "../votes/AgreementVoteAxis";
import { getDefaultVotingSystem } from "@/lib/collections/posts/helpers";
import { useMutation } from "@apollo/client/react";
import { gql } from "@/lib/generated/gql-codegen";
import CondensedFooterReactions from "./CondensedFooterReactions";
import LWTooltip from "../common/LWTooltip";
import { useTracking } from "../../lib/analyticsEvents";
import { recombeeApi } from "@/lib/recombee/client";
import UltraFeedReplyEditor from "./UltraFeedReplyEditor";
import { ReplyConfig } from "./UltraFeedCommentItem";


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
    position: "relative",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    opacity: `1 !important`,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: theme.typography.body2.fontSize,
    lineHeight: 1,
    // every child except last has margin right applied
    "& > *:not(:last-child)": {
      marginRight: 16,
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
    padding: 2,
    color: `${theme.palette.ultraFeed.dim} !important`,
    display: "flex",
    alignItems: "center",
    "& svg": {
      position: "relative",
      height: 18,
      top: 2,
      [theme.breakpoints.down('sm')]: {
        top: 3,
        height: 20,
        width: 20,
      },
    },
    [theme.breakpoints.down('sm')]: {
      bottom: 1
    }
  },
  showAllCommentsWrapper: {
    display: 'inline-flex',
    [theme.breakpoints.down('sm')]: {
      display: 'none',
    }
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
    "& svg": {
      position: "relative",
      height: 14,
      top: 2,
    },
    "&:hover": {
      color: theme.palette.grey[1000],
    },
    // Hide on mobile
    [theme.breakpoints.down('sm')]: {
      display: 'none',
    }
  },
  showAllCommentsCount: {
    marginLeft: 2,
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
    [theme.breakpoints.up('md')]: {
      display: 'none',
    }
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
  bookmarkButton: {
    position: "relative", 
    top: 2,
    opacity: 0.7,
    "& svg": {
      color: `${theme.palette.ultraFeed.dim} !important`,
      height: 20,
      [theme.breakpoints.down('sm')]: {
        height: 22,
      },
    },
    [theme.breakpoints.down('sm')]: {
      top: 2,
      opacity: 1,
    },
  },
  bookmarkButtonHighlighted: {
    color: `${theme.palette.primary.main} !important`,
    "& svg": {
      color: `${theme.palette.primary.main} !important`,
    },
  },
  bookmarkAndSeeLessWrapper: {
    display: "flex",
    alignItems: "center",
    gap: 2,
  },
  seeLessButton: {
    position: "relative",
    top: 1,
    opacity: 0.5,
    cursor: "pointer",
    pointerEvents: 'auto !important',
    "& svg": {
      color: `${theme.palette.ultraFeed.dim} !important`,
      opacity: 0.7,
      height: 20,
      [theme.breakpoints.down('sm')]: {
        height: 22,
      },
    },
    "&:hover": {
      opacity: 1,
    },
    [theme.breakpoints.down('sm')]: {
      top: 0,
      opacity: 1,
    },
  },
  seeLessButtonActive: {
    opacity: 1,
    pointerEvents: 'auto !important',
    "& svg": {
      opacity: 1,
    },
  },
  seeLessButtonInner: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    padding: 2,
    transition: 'background-color 0.2s ease',
    "&:hover": {
      backgroundColor: theme.palette.panelBackground.hoverHighlightGrey,
    },
  },
  seeLessButtonInnerActive: {
    backgroundColor: theme.palette.panelBackground.hoverHighlightGrey,
  },
  overallVoteButtons: {
    position: 'relative',
    top: 0,
    bottom: 1,
    color: `${theme.palette.ultraFeed.dim} !important`,
    "& .VoteArrowIconSolid-root": {
    },
    [theme.breakpoints.down('sm')]: {
      top: 0,
    }
  },
  agreementButtons: {
    position: 'relative',
    color: `${theme.palette.ultraFeed.dim} !important`,
    top: 0,
    bottom: 0,
    marginLeft: -8,
    [theme.breakpoints.down('sm')]: {
      top: 0,
    }
  },
  footerVoteScoreOverride: {
    fontSize: `${theme.typography.body2.fontSize}px !important`, 
    margin: '0 7px !important',
    [theme.breakpoints.down('sm')]: {
      fontSize: '17px !important',
      margin: '0 7px !important',
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
    [theme.breakpoints.down('sm')]: {
      fontSize: '17px !important',
      margin: '0 7px !important',
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
  onSeeLess?: (eventId: string) => void;
  isSeeLessMode?: boolean;
  replyConfig: ReplyConfig;
  cannotReplyReason?: string | null;
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
  onSeeLess,
  isSeeLessMode = false,
  document,
  replyConfig,
  cannotReplyReason,
}: UltraFeedItemFooterCoreProps) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const { captureEvent } = useTracking();
  const { openDialog } = useDialog();
  
  const { isReplying, onReplyClick, onReplySubmit, onReplyCancel } = replyConfig;

  const [createUltraFeedEvent] = useMutation(UltraFeedEventsDefaultFragmentMutation);

  // TODO:the wrapping approach does not work with votes as click-handlers inside the vote bottons prevent an onClick at this level from firing
  const handleInteractionLog = (interactionType: 'bookmarkClicked' | 'commentsClicked') => {
    if (!currentUser || !voteProps.document) return;

    const eventData = {
      data: {
        userId: currentUser._id,
        eventType: 'interacted' as const,
        documentId: voteProps.document._id,
        collectionName: voteProps.collectionName as "Posts" | "Comments" | "Spotlights",
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
      onReplyCancel();
    } else {
      handleInteractionLog('commentsClicked');
      onReplyClick();
    }
  };

  const handleSeeLessClick = async () => {
    if (!currentUser || !voteProps.document || !onSeeLess) return;

    // If already in see less mode, just call the callback (which will be handleUndoSeeLess)
    if (isSeeLessMode) {
      onSeeLess(''); // Pass empty string since handleUndoSeeLess doesn't use the parameter
      return;
    }

    // Immediately show the see less UI with a placeholder
    onSeeLess('pending');

    captureEvent("ultraFeedSeeLessClicked", {
      documentId: voteProps.document._id,
      collectionName,
      sources: metaInfo?.sources,
      servedEventId: metaInfo?.servedEventId,
    });
    
    const eventData = {
      data: {
        userId: currentUser._id,
        eventType: 'seeLess' as const,
        documentId: voteProps.document._id,
        collectionName,
        feedItemId: metaInfo?.servedEventId,
        event: {
          feedbackReasons: {
            author: false,
            topic: false,
            contentType: false,
            other: false,
            text: '',
          },
          cancelled: false,
        }
      }
    };
    
    const result = await createUltraFeedEvent({ variables: eventData });
    const eventId = result.data?.createUltraFeedEvent?.data?._id;
    
    if (eventId) {
      onSeeLess(eventId);
    }

    if (collectionName === "Posts" && metaInfo && 'recommInfo' in metaInfo && voteProps.document) {
      const postMetaInfo = metaInfo
      const documentId = voteProps.document._id
      
      if (documentId && postMetaInfo.recommInfo?.recommId) {
        void recombeeApi.createRating(
          documentId, 
          currentUser._id, 
          "bigDownvote",
          postMetaInfo.recommInfo.recommId
        );
      }
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
      <LWTooltip title={commentIconTooltip}>
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

  const showAllCommentsButton = (commentCount ?? 0) > 0 
    ? <div className={classes.showAllCommentsWrapper}>
      <LWTooltip title={showAllCommentsTooltip}>
      <div
        onClick={onClickComments}
        className={classes.showAllComments}
      >
        <DebateIconOutline />
        <span className={classes.showAllCommentsCount}>{commentCount}</span>
      </div>
      </LWTooltip>
    </div>
   : null;

  const votingSystem = voteProps.document.votingSystem || getDefaultVotingSystem();

  return (
    <>
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
          <CondensedFooterReactions voteProps={voteProps} allowReactions={collectionName === "Comments"} className={classes.condensedFooterReactions}/>
        )}

        <div className={classes.bookmarkAndSeeLessWrapper}>
          { bookmarkProps && bookmarkableCollectionNames.has(collectionName) && (
            <div onClick={() => handleInteractionLog('bookmarkClicked')}>
              <BookmarkButton
                documentId={bookmarkProps.documentId}
                collectionName={collectionName}
                className={classNames(classes.bookmarkButton, { [classes.bookmarkButtonHighlighted]: bookmarkProps.highlighted })}
              />
            </div>
          )}
          
          <div className={classNames(classes.seeLessButton, { [classes.seeLessButtonActive]: isSeeLessMode })} onClick={handleSeeLessClick}>
            <LWTooltip title={isSeeLessMode ? "Undo see less" : "Show me less like this"}>
              <span className={classNames("SeeLessButton-root", classes.seeLessButtonInner, { [classes.seeLessButtonInnerActive]: isSeeLessMode })}>
                <CloseIcon />
              </span>
            </LWTooltip>
          </div>
        </div>
      </div>
    </>
  );
};


const UltraFeedPostFooter = ({ post, metaInfo, className, onSeeLess, isSeeLessMode, replyConfig }: { post: PostsListWithVotes, metaInfo: FeedPostMetaInfo, className?: string, onSeeLess?: (eventId: string) => void, isSeeLessMode?: boolean, replyConfig: ReplyConfig }) => {
  const { openDialog } = useDialog();

  const votingSystem = getVotingSystemByName(post?.votingSystem || "default");
  const voteProps = useVote(post, "Posts", votingSystem);
  const showVoteButtons = votingSystem.name === "namesAttachedReactions";
  const commentCount = post.commentCount ?? 0;
  const bookmarkProps: BookmarkProps = {documentId: post._id, highlighted: metaInfo.sources?.includes("bookmarks")};
  
  const onClickComments = () => {
    openDialog({
      name: "commentsDialog",
      closeOnNavigate: true,
      contents: ({onClose}) => <UltraFeedCommentsDialog 
        document={post}
        collectionName="Posts"
        onClose={onClose}
      />
    });
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
        onSeeLess={onSeeLess}
        isSeeLessMode={isSeeLessMode}
        document={post}
        replyConfig={replyConfig}
        cannotReplyReason={null}
      />

      {isReplying && (
        <UltraFeedReplyEditor
          document={post}
          collectionName="Posts"
          cannotReplyReason={null}
          onReplySubmit={onReplySubmit}
          onReplyCancel={onReplyCancel}
          onViewAllComments={() => {
            openDialog({
              name: "UltraFeedCommentsDialog",
              closeOnNavigate: true,
              contents: ({ onClose }) => (
                <UltraFeedCommentsDialog
                  document={post}
                  collectionName="Posts"
                  onClose={onClose}
                />
              ),
            });
          }}
        />
      )}
    </>
  );
}


const UltraFeedCommentFooter = ({ comment, metaInfo, className, onSeeLess, isSeeLessMode, replyConfig, cannotReplyReason }: { comment: UltraFeedComment, metaInfo: FeedCommentMetaInfo, className?: string, onSeeLess?: (eventId: string) => void, isSeeLessMode?: boolean, replyConfig: ReplyConfig, cannotReplyReason?: string | null }) => {
  const { openDialog } = useDialog();

  const parentPost = comment.post;
  const votingSystem = getVotingSystemByName(parentPost?.votingSystem || "default");
  const voteProps = useVote(comment, "Comments", votingSystem);
  const hideKarma = !!parentPost?.hideCommentKarma;
  const showVoteButtons = votingSystem.name === "namesAttachedReactions" && !hideKarma;
  const commentCount = metaInfo.descendentCount;
  const bookmarkProps: BookmarkProps = {documentId: comment._id, highlighted: metaInfo.sources?.includes("bookmarks")};
  
  const onClickComments = () => {
    openDialog({
      name: "UltraFeedCommentsDialog",
      closeOnNavigate: true,
      contents: ({onClose}) => <UltraFeedCommentsDialog 
        document={comment}
        collectionName="Comments"
        onClose={onClose}
      />
    });
  }

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
        onSeeLess={onSeeLess}
        isSeeLessMode={isSeeLessMode}
        document={comment}
        replyConfig={replyConfig}
        cannotReplyReason={cannotReplyReason}
      />

      {isReplying && <UltraFeedReplyEditor
        document={comment}
        collectionName="Comments"
        cannotReplyReason={cannotReplyReason}
        onReplySubmit={onReplySubmit}
        onReplyCancel={onReplyCancel}
        onViewAllComments={() => {
          openDialog({
            name: "UltraFeedCommentsDialog",
            closeOnNavigate: true,
            contents: ({ onClose }) => (
              <UltraFeedCommentsDialog
                document={comment}
                collectionName="Comments"
                onClose={onClose}
              />
            ),
          });
        }}
      />}
    </>
  );
}


interface UltraFeedPostFooterProps {
  document: PostsListWithVotes;
  collectionName: "Posts";
  metaInfo: FeedPostMetaInfo;
  className?: string;
  onSeeLess?: (eventId: string) => void;
  isSeeLessMode?: boolean;
  replyConfig: ReplyConfig;
  cannotReplyReason?: string | null;
}

interface UltraFeedCommentFooterProps {
  document: UltraFeedComment;
  collectionName: "Comments";
  metaInfo: FeedCommentMetaInfo;
  className?: string;
  onSeeLess?: (eventId: string) => void;
  isSeeLessMode?: boolean;
  replyConfig: ReplyConfig;
  cannotReplyReason?: string | null;
}

type UltraFeedItemFooterProps = UltraFeedPostFooterProps | UltraFeedCommentFooterProps;

const UltraFeedItemFooter = ({ document, collectionName, metaInfo, className, onSeeLess, isSeeLessMode, replyConfig, cannotReplyReason }: UltraFeedItemFooterProps) => {
  if (collectionName === "Posts") {
    return <UltraFeedPostFooter
      post={document}
      metaInfo={metaInfo}
      className={className}
      onSeeLess={onSeeLess}
      isSeeLessMode={isSeeLessMode}
      replyConfig={replyConfig}
    />;
  } else if (collectionName === "Comments") {
    return <UltraFeedCommentFooter
      comment={document}
      metaInfo={metaInfo}
      className={className}
      onSeeLess={onSeeLess}
      isSeeLessMode={isSeeLessMode}
      replyConfig={replyConfig}
      cannotReplyReason={cannotReplyReason}
    />;
  }
  return null;
};


export default registerComponent("UltraFeedItemFooter", UltraFeedItemFooter);

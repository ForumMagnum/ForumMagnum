import React from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { defineStyles, useStyles } from "../hooks/useStyles";
import classNames from "classnames";
import CommentIcon from '@/lib/vendor/@material-ui/icons/src/ModeCommentOutlined';
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
import { useMutation } from "@apollo/client";
import { gql } from "@/lib/generated/gql-codegen";
import CondensedFooterReactions from "./CondensedFooterReactions";
import LWTooltip from "../common/LWTooltip";
import { useTracking } from "../../lib/analyticsEvents";
import { recombeeApi } from "@/lib/recombee/client";

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
    // every child except last has margin right applied
    "& > *:not(:last-child)": {
      marginRight: 16,
    },
    "& a:hover, & a:active": {
      textDecoration: "none",
      color: `${theme.palette.linkHover.dim} !important`,
    },
    [theme.breakpoints.down('sm')]: {
      paddingLeft: 8,
      paddingRight: 8,
      justifyContent: "space-between",
      ...theme.typography.ultraFeedMobileStyle,
      "& > *:not(:last-child)": {
        marginRight: 'unset',
      },
    },
  },
  commentCount: {
    position: 'relative',
    color: `${theme.palette.ultraFeed.dim} !important`,
    display: "flex",
    alignItems: "center",
    "& svg": {
      position: "relative",
      height: 18,
      top: 1,
      [theme.breakpoints.down('sm')]: {
        height: 20,
        width: 20,
      },
    },
    [theme.breakpoints.down('sm')]: {
      top: 2,
    }
  },
  commentCountClickable: {
    cursor: "pointer",
    "&:hover": {
      color: theme.palette.grey[1000],
    },
  },
  commentCountText: {
    marginLeft: 4,
  },
  reactionIcon: {
    marginRight: 6,
  },
  reactionCount: {
    position: "relative",
    bottom: 2,
  },
  condensedFooterReactions: {
    [theme.breakpoints.up('md')]: {
      marginLeft: 'auto',
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
      top: 5,
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
      top: 4,
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
    top: 1,
    color: `${theme.palette.ultraFeed.dim} !important`,
    "& .VoteArrowIconSolid-root": {
    },
    [theme.breakpoints.down('sm')]: {
      top: 3,
    }
  },
  agreementButtons: {
    position: 'relative',
    color: `${theme.palette.ultraFeed.dim} !important`,
    top: 1,
    marginLeft: -8,
    [theme.breakpoints.down('sm')]: {
      top: 3,
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

interface UltraFeedItemFooterCoreProps {
  commentCount: number | undefined;
  onClickComments: () => void;
  showVoteButtons: boolean;
  voteProps: VotingProps<VoteableTypeClient>;
  hideKarma?: boolean;
  bookmarkProps?: BookmarkProps;
  collectionName: "Posts" | "Comments" | "Spotlights";
  metaInfo?: FeedPostMetaInfo | FeedCommentMetaInfo;
  className?: string;
  onSeeLess?: (eventId: string) => void;
  isSeeLessMode?: boolean;
}

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
}: UltraFeedItemFooterCoreProps) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const { captureEvent } = useTracking();

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
    if (onClickComments) {
      handleInteractionLog('commentsClicked');
      onClickComments();
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

  const commentCountIcon = (
    <div
      onClick={handleCommentsClick}
      className={classNames(classes.commentCount, { [classes.commentCountClickable]: !!onClickComments })}
    >
      <CommentIcon />
      {(commentCount ?? 0 > 0) 
        ? <span className={classes.commentCountText}>{commentCount}</span>
        : null
      }
    </div>
  );

  const votingSystem = voteProps.document.votingSystem || getDefaultVotingSystem();

  return (
    <div className={classNames(classes.root, className)}>
      {commentCountIcon}

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
  );
};


const UltraFeedPostFooter = ({ post, metaInfo, className, onSeeLess, isSeeLessMode }: { post: PostsListWithVotes, metaInfo: FeedPostMetaInfo, className?: string, onSeeLess?: (eventId: string) => void, isSeeLessMode?: boolean }) => {
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

  return (
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
    />
  );
}


const UltraFeedCommentFooter = ({ comment, metaInfo, className, onSeeLess, isSeeLessMode }: { comment: UltraFeedComment, metaInfo: FeedCommentMetaInfo, className?: string, onSeeLess?: (eventId: string) => void, isSeeLessMode?: boolean }) => {
  const { openDialog } = useDialog();

  const parentPost = comment.post;
  const votingSystem = getVotingSystemByName(parentPost?.votingSystem || "default");
  const voteProps = useVote(comment, "Comments", votingSystem);
  const hideKarma = !!parentPost?.hideCommentKarma;
  const showVoteButtons = votingSystem.name === "namesAttachedReactions" && !hideKarma;
  const commentCount = metaInfo.directDescendentCount;
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

  return (
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
    />
  );
}


interface UltraFeedPostFooterProps {
  document: PostsListWithVotes;
  collectionName: "Posts";
  metaInfo: FeedPostMetaInfo;
  className?: string;
  onSeeLess?: (eventId: string) => void;
  isSeeLessMode?: boolean;
}

interface UltraFeedCommentFooterProps {
  document: UltraFeedComment;
  collectionName: "Comments";
  metaInfo: FeedCommentMetaInfo;
  className?: string;
  onSeeLess?: (eventId: string) => void;
  isSeeLessMode?: boolean;
}

type UltraFeedItemFooterProps = UltraFeedPostFooterProps | UltraFeedCommentFooterProps;

const UltraFeedItemFooter = ({ document, collectionName, metaInfo, className, onSeeLess, isSeeLessMode }: UltraFeedItemFooterProps) => {
  if (collectionName === "Posts") {
    return <UltraFeedPostFooter post={document} metaInfo={metaInfo} className={className} onSeeLess={onSeeLess} isSeeLessMode={isSeeLessMode} />;
  } else if (collectionName === "Comments") {
    return <UltraFeedCommentFooter comment={document} metaInfo={metaInfo} className={className} onSeeLess={onSeeLess} isSeeLessMode={isSeeLessMode} />;
  }
  return null;
};


export default registerComponent("UltraFeedItemFooter", UltraFeedItemFooter);

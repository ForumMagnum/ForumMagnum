import React, {
  Dispatch,
  ReactNode,
  MouseEvent,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link } from "@/lib/reactRouterWrapper";
import { useSingle } from "@/lib/crud/withSingle";
import { useLoginPopoverContext } from "@/components/hooks/useLoginPopoverContext";
import { useMessages } from "@/components/common/withMessages";
import { gql, useMutation, useQuery } from "@apollo/client";
import { isProduction } from "@/lib/executionEnvironment";
import { commentGetPageUrlFromIds } from "@/lib/collections/comments/helpers";
import { AnalyticsContext, useTracking } from "@/lib/analyticsEvents";
import { useCurrentUser } from "@/components/common/withUser";
import { useUpdateCurrentUser } from "@/components/hooks/useUpdateCurrentUser";
import { useWindowSize } from "@/components/hooks/useScreenWidth";
import { MOBILE_HEADER_HEIGHT } from "@/components/common/Header";
import {
  DONATION_ELECTION_APPROX_CLOSING_DATE,
  ELECTION_DONATE_HREF,
  userIsAllowedToVoteInDonationElection,
  useGivingSeason,
} from "@/lib/givingSeason";
import { useElectionCandidates } from "./hooks";
import { formatStat } from "@/components/users/EAUserTooltipContent";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import ReactConfetti from "react-confetti";
import classNames from "classnames";
import sortBy from "lodash/sortBy";
import { registerComponent } from "@/lib/vulcan-lib/components";
import { useNavigate } from "@/lib/routeUtil";
import UsersProfileImage from "@/components/users/UsersProfileImage";
import CommentsNewForm from "@/components/comments/CommentsNewForm";
import EAButton from "@/components/ea-forum/EAButton";
import ForumIcon from "@/components/common/ForumIcon";
import PostsTooltip from "@/components/posts/PostsPreviewTooltip/PostsTooltip";
import ToggleSwitch from "@/components/common/ToggleSwitch";
import UsersName from "@/components/users/UsersName";
import FormatDate from "@/components/common/FormatDate";
import { useCurrentTime } from "@/lib/utils/timeUtil";

const BACKGROUND_HREF = "https://res.cloudinary.com/cea/image/upload/v1763548915/Banner/voting-portal-2025-background.png"
const VOTING_HREF = "/posts/GyjtmSuQviTngRtjn/donation-election-2025-how-to-vote";
const CANDIDATES_HREF = "/posts/tucbWEN7SBWxNiHWj/meet-the-candidates-in-the-forum-s-donation-election-2024"; // TODO update, see full checklist: https://docs.google.com/document/d/1Y_guOnL78yV6PbmjL1fpFsMq9LSc39tCwpIuuYY1sYs/edit?tab=t.0
const FRAUD_HREF = "/posts/GyjtmSuQviTngRtjn/donation-election-2025-how-to-vote#What_s_not_allowed";
const THREAD_HREF = "/posts/q6C23rxvyHX2ZxNNS/donation-election-discussion-thread"; // TODO update, see full checklist: https://docs.google.com/document/d/1Y_guOnL78yV6PbmjL1fpFsMq9LSc39tCwpIuuYY1sYs/edit?tab=t.0
const COMMENT_POST_ID = isProduction ? "q6C23rxvyHX2ZxNNS" : "TKPz7FSTd6siveswn"; // TODO update, see full checklist: https://docs.google.com/document/d/1Y_guOnL78yV6PbmjL1fpFsMq9LSc39tCwpIuuYY1sYs/edit?tab=t.0

const styles = (theme: ThemeType) => ({
  root: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100vw",
    minHeight: "100vh",
    background: theme.palette.givingSeason.votingPortalBackground,
    display: "flex",
    justifyContent: "center",
    fontFamily: theme.palette.fonts.sansSerifStack,
    color: theme.palette.givingSeason.votingPortalPrimary,
    marginBottom: 0,
    fontWeight: 500,
    "& a": {
      textDecoration: "underline",
    },
    "& sup": {
      fontSize: 10,
      verticalAlign: "top",
      position: "relative",
      top: "-0.5em",
    },
    [theme.breakpoints.down("sm")]: {
      alignItems: "flex-start",
      paddingTop: MOBILE_HEADER_HEIGHT,
    },
  },
  rootAlignCentered: {
    alignItems: "center",
  },
  rootSplashImage: {
    backgroundImage: `url(${BACKGROUND_HREF})`,
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover",
    backgroundPosition: "center",
  },
  rootAlignTop: {
    alignItems: "flex-start",
    paddingTop: 70,
  },
  welcomeRoot: {
    // On large screen, make the welcome box sit in the bottom left
    [theme.breakpoints.up("md")]: {
      display: "flex",
      flex: 1,
      margin: 100,
      maxWidth: 1350,
      alignSelf: 'stretch',
      maxHeight: 'calc(50vh + 250px)',
      alignItems: 'flex-end',
    }
  },
  welcomeContent: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    maxWidth: 600,
    height: 'fit-content',
    padding: 24,
  },
  welcomeTitle: {
    fontSize: 50,
    fontWeight: 700,
    [theme.breakpoints.down("sm")]: {
      fontSize: 40,
    },
  },
  welcomeDescription: {
    fontSize: 18,
    lineHeight: "150%",
    marginBottom: 8,
    [theme.breakpoints.down("sm")]: {
      fontSize: 16,
    },
  },
  welcomeButtons: {
    display: "flex",
    gap: "12px",
    [theme.breakpoints.down("xs")]: {
      flexDirection: "column",
    },
  },
  welcomeButton: {
    width: "100%",
    padding: "16px 24px",
    fontSize: 16,
    fontWeight: 600,
    lineHeight: "120%",
    textDecoration: "none !important",
    "&:hover": {
      opacity: 0.8,
      textDecoration: 'none'
    },
  },
  welcomeButtonPrimary: {
    color: theme.palette.givingSeason.votingPortalSecondary,
    background: theme.palette.givingSeason.votingPortalPrimary,
    "&:hover": {
      background: theme.palette.givingSeason.votingPortalPrimary,
    },
  },
  welcomeButtonSecondary: {
    color: theme.palette.givingSeason.votingPortalPrimary,
    background: theme.palette.givingSeason.votingPortalSecondary,
    border: `1px solid ${theme.palette.givingSeason.votingPortalPrimary}`,
    "&:hover": {
      background: theme.palette.givingSeason.votingPortalSecondary,
    },
  },
  welcomeButtonDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
    "&:hover": {
      opacity: 0.6,
    },
  },
  welcomeFootnote: {
    fontSize: 14,
    lineHeight: "140%",
    opacity: 0.7,
  },
  rankingRoot: {
    maxWidth: 680,
    padding: 24,
    [theme.breakpoints.down("sm")]: {
      padding: 16,
    },
  },
  rankingInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  rankingTitle: {
    fontSize: 40,
    fontWeight: 700,
    [theme.breakpoints.down("sm")]: {
      fontSize: 28,
    },
  },
  rankingDescription: {
    fontSize: 16,
    lineHeight: "150%",
    [theme.breakpoints.down("sm")]: {
      fontSize: 14,
    },
  },
  rankingSubDescription: {
    fontSize: 16,
    lineHeight: "150%",
    opacity: 0.7,
    [theme.breakpoints.down("sm")]: {
      fontSize: 13,
    },
  },
  rankingCandidates: {
    marginTop: 32,
    marginBottom: 150
  },
  candidate: {
    display: "flex",
    alignItems: "center",
    borderRadius: theme.borderRadius.default,
    border: `1px solid ${theme.palette.givingSeason.candidateBorder}`,
    padding: "8px 12px",
    marginBottom: 4,
  },
  candidateUnordered: {
    background: theme.palette.givingSeason.votingPortalPrimaryTranslucent1,
    "&:hover": {
      opacity: 0.9,
    },
  },
  candidateOrdered: {
    background: theme.palette.givingSeason.votingPortalPrimary,
    color: theme.palette.givingSeason.votingPortalSecondary,
  },
  candidateHandle: {
    marginRight: 8,
  },
  candidateHandleIcon: {
    marginTop: 4,
  },
  candidateOrder: {
    background: theme.palette.text.alwaysWhite,
    color: theme.palette.givingSeason.votingPortalSecondary,
    width: 20,
    height: 20,
    borderRadius: theme.borderRadius.small,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  candidateImage: {
    width: 44,
    height: 44,
    minWidth: 44,
    minHeight: 44,
    borderRadius: theme.borderRadius.small,
    backgroundColor: theme.palette.text.alwaysWhite,
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundSize: "contain",
    marginRight: 16,
    [theme.breakpoints.down("sm")]: {
      width: 30,
      height: 30,
    },
  },
  candidateInfo: {
    flexGrow: 1,
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  candidateName: {
    fontSize: 16,
    fontWeight: 600,
    letterSpacing: "-0.16px",
    [theme.breakpoints.down("sm")]: {
      fontSize: 14,
    },
  },
  candidateClear: {
    cursor: "pointer",
    opacity: 0.7,
    fontSize: 14,
    letterSpacing: "-0.14px",
    fontWeight: 600,
    "&:hover": {
      opacity: 1,
    },
  },
  commentRoot: {
    maxWidth: 680,
    padding: 24,
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    [theme.breakpoints.down("sm")]: {
      padding: 16,
      paddingBottom: 150,
    },
  },
  commentTitle: {
    fontSize: 40,
    fontWeight: 700,
    [theme.breakpoints.down("sm")]: {
      fontSize: 28,
    },
  },
  commentExplanation: {
    fontSize: 16,
    lineHeight: "140%",
    marginBottom: 16,
  },
  commentDescription: {
    fontSize: 16,
    fontWeight: 700,
    lineHeight: "150%",
    [theme.breakpoints.down("sm")]: {
      fontSize: 16,
    },
  },
  commentSecondaryText: {
    opacity: 0.7,
  },
  commentTertiaryText: {
    fontSize: 14,
    fontWeight: 600,
  },
  commentFormContainer: {
    display: "flex",
    alignItems: "flex-start",
    gap: "16px",
  },
  commentForm: {
    flexGrow: 1,
    background: theme.palette.text.alwaysWhite,
    borderRadius: theme.borderRadius.default,
    "& .EditorTypeSelect-select": {
      display: "none",
    },
    "& #new-comment-submit, & .CommentsSubmitDropdown-buttonWrapper, & .CommentsSubmitDropdown-button": {
      backgroundColor: theme.palette.givingSeason.votingPortalPrimary,
      color: theme.palette.givingSeason.votingPortalSecondary,
      fontSize: 14,
      fontWeight: 600,
      "& .CommentsSubmitDropdown-dropdownIcon": {
        color: theme.palette.givingSeason.votingPortalSecondary,
      },
      "& .CommentsSubmitDropdown-divider" : {
        backgroundColor: theme.palette.givingSeason.votingPortalSecondary,
      },
      "&:hover": {
        background: theme.palette.givingSeason.votingPortalPrimary,
        color: theme.palette.givingSeason.votingPortalSecondary,
        opacity: 0.8,
      },
    },
    "& .form-input": {
      marginBottom: 0,
    },
    "& .ck-placeholder::before": {
      fontStyle: "italic",
      opacity: 0.7,
    },
  },
  thankYouRoot: {
    maxWidth: 680,
    padding: 24,
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  thankYouTitle: {
    fontSize: 52,
    fontWeight: 700,
    lineHeight: "120%",
    letterSpacing: "-1px",
    textAlign: "center",
    marginBottom: 16,
    [theme.breakpoints.down("sm")]: {
      fontSize: 32,
    },
  },
  thankYouSubtitle: {
    fontSize: 16,
    fontWeight: 600,
  },
  thankYouBox: {
    background: theme.palette.givingSeason.votingPortalPrimaryTranslucent1,
    borderRadius: theme.borderRadius.default,
    padding: 16,
    flexBasis: 0,
    flexGrow: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    gap: "12px",
  },
  thankYouRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  thankYouFlairInfo: {
    flexGrow: 1,
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  thankYouSecondaryText: {
    fontSize: 13,
    fontWeight: 500,
    opacity: 0.7,
  },
  thankYouPostInfo: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    opacity: 0.7,
    fontSize: 13,
    fontWeight: 500,
    "& *": {
      textDecoration: "none !important",
    },
  },
  thankYouCommentContainer: {
    display: "flex",
    alignItems: "center",
    gap: "2px",
  },
  thankYouCommentIcon: {
    width: 16,
    height: 16,
  },
  thankYouGrid: {
    display: "flex",
    flexDirection: "row",
    gap: "16px",
    [theme.breakpoints.down("sm")]: {
      flexDirection: "column",
    },
  },
  thankYouBoxButton: {
    background: theme.palette.givingSeason.votingPortalPrimaryTranslucent2,
    color: theme.palette.givingSeason.votingPortalPrimary,
    textDecoration: "none !important",
    padding: "12px 24px",
    fontSize: 14,
    fontWeight: 600,
    "&:hover": {
      background: theme.palette.givingSeason.votingPortalPrimaryTranslucent2,
      opacity: 0.8,
    },
  },
  thankYouButton: {
    padding: 16,
    fontSize: 14,
    fontWeight: 600,
    color: theme.palette.givingSeason.votingPortalSecondary,
    background: theme.palette.givingSeason.votingPortalPrimary,
    "&:hover": {
      background: theme.palette.givingSeason.votingPortalPrimary,
      opacity: 0.8,
    }
  },
  thankYouBarContainer: {
    width: "100%",
    height: 12,
    marginBottom: 20,
    background: theme.palette.givingSeason.votingPortalPrimaryTranslucent1,
    borderRadius: theme.borderRadius.small,
    overflow: "hidden",
  },
  thankYouBar: {
    height: "100%",
    background: theme.palette.givingSeason.votingPortalPrimary,
    transition: "width 0.5s ease",
  },
  thankYouToggle: {
    background: theme.palette.givingSeason.votingPortalPrimaryTranslucent2,
    "& .ToggleSwitch-switchOff": {
      background: theme.palette.givingSeason.votingPortalPrimaryTranslucent2,
    },
    "& .ToggleSwitch-switchOn": {
      background: theme.palette.givingSeason.votingPortalPrimary,
    },
  },
  footer: {
    position: "fixed",
    bottom: 0,
    left: 0,
    width: "100vw",
    minHeight: 100,
    background: theme.palette.givingSeason.votingPortalPrimary,
    color: theme.palette.givingSeason.votingPortalSecondary,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 0,
    [theme.breakpoints.down("sm")]: {
      minHeight: 82,
      paddingBottom: 16,
    },
  },
  footerContainer: {
    width: 750,
    maxWidth: "100vw",
    padding: 8,
    paddingBottom: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
    fontSize: 14,
    fontWeight: 600,
    [theme.breakpoints.down("sm")]: {
      padding: 16,
      paddingBottom: 0,
    },
  },
  footerBackContainer: {
    flexGrow: 1,
  },
  footerBackButton: {
    cursor: "pointer",
    textDecoration: "none !important",
    whiteSpace: "nowrap",
    "&:hover": {
      opacity: 0.8,
    },
  },
  footerButton: {
    background: theme.palette.givingSeason.votingPortalSecondary,
    color: theme.palette.text.alwaysWhite,
    padding: "16px 40px",
    fontWeight: 600,
    whiteSpace: "nowrap",
    "&:hover": {
      background: theme.palette.givingSeason.votingPortalSecondary,
      opacity: 0.8
    },
    [theme.breakpoints.down("sm")]: {
      padding: 16,
    },
  },
  footerButtonDisabled: {
    opacity: 0.5,
  },
  footerUnderText: {
    width: "100%",
    "& > *": {
      display: "block",
      width: "100%",
      textAlign: "right",
      paddingRight: 16,
      paddingTop: 8,
    },
  },
  noMobile: {
    [theme.breakpoints.down("sm")]: {
      display: "none",
    },
  },
  onlyMobile: {
    [theme.breakpoints.up("md")]: {
      display: "none",
    },
  },
  commentFlash: {
    color: theme.palette.text.normal,
    "& a": {
      color: theme.palette.primary.dark,
    },
  },
});

const WelcomeScreen = ({onNext, currentUser, classes}: {
  onNext: () => void,
  currentUser: UsersCurrent | null,
  classes: ClassesType<typeof styles>,
}) => {
  const now = useCurrentTime();
  const { allowed, reason } = userIsAllowedToVoteInDonationElection(currentUser, now);

  return (
    <div className={classes.welcomeRoot}>
      <div className={classes.welcomeContent}>
        <div className={classes.welcomeTitle}>
          Vote in the Donation Election 2025
        </div>
        <div className={classes.welcomeDescription}>
          The <Link to={ELECTION_DONATE_HREF}>Donation Election Fund</Link> will be
          distributed to the top 3 candidates<sup>1</sup>. We&apos;re
          using <Link to={VOTING_HREF}>ranked-choice voting</Link>. You can change
          your vote<sup>2</sup> as many times as you like until the deadline.
        </div>
        <div className={classes.welcomeButtons}>
          <EAButton
            onClick={allowed ? onNext : undefined}
            className={classNames(classes.welcomeButton, classes.welcomeButtonPrimary, {
              [classes.welcomeButtonDisabled]: !allowed,
            })}
          >
            {allowed ? "Vote in the Election ->" : reason}
          </EAButton>
          <EAButton
            href={CANDIDATES_HREF}
            className={classNames(classes.welcomeButton, classes.welcomeButtonSecondary)}
          >
            Meet the candidates
          </EAButton>
        </div>
        <div>
          <div className={classes.welcomeFootnote}>
            1. The Forum team reserves the right to revoke candidacy for any
            reason.
          </div>
          <div className={classes.welcomeFootnote}>
            2. Your vote is anonymous. If we have reason to believe you've
            committed <Link to={FRAUD_HREF}>voter fraud</Link>, for example by
            voting from more than one account, you could be banned from the Forum.
          </div>
        </div>
      </div>
    </div>
  );
}

type CandidateItem = {
  id: string,
  content: ElectionCandidateBasicInfo,
  ordered: boolean,
}

const reorder = (list: CandidateItem[], startIndex: number, endIndex: number) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  for (let i = 0; i <= endIndex; i++) {
    result[i].ordered = true;
  }
  return result;
};

const hrefToPostId = (href: string) => href.match(/.+posts\/(.+)\//)?.[1];

const RankingScreen = ({items, setItems, classes}: {
  items: CandidateItem[],
  setItems: Dispatch<SetStateAction<CandidateItem[]>>,
  classes: ClassesType<typeof styles>,
}) => {
  const onDragEnd = useCallback(({source, destination}: DropResult<string>) => {
    if (destination) {
      setItems((items) => reorder(items, source.index, destination.index));
    }
  }, [setItems]);

  const onClick = useCallback((index: number) => {
    setItems((items) => {
      const item = items[index];
      if (item.ordered) {
        return items;
      }
      const result = Array.from(items);
      const ordered = result.filter(({ordered}) => ordered);
      const unordered = result.filter(({ordered, id}) => !ordered && id !== item.id);
      return [...ordered, {...item, ordered: true}, ...unordered];
    });
  }, [setItems]);

  const onClickTitle = useCallback((ev?: MouseEvent<HTMLAnchorElement>) => {
    ev?.stopPropagation();
  }, []);

  const onClear = useCallback((index: number, ev?: MouseEvent<HTMLDivElement>) => {
    ev?.preventDefault();
    ev?.stopPropagation();
    setItems((items) => {
      const result = Array.from(items);
      result[index].ordered = false;
      const ordered = result.filter(({ordered}) => ordered);
      const unordered = result.filter(({ordered}) => !ordered);
      return [...ordered, ...unordered];
    });
  }, [setItems]);

  return (
    <div className={classes.rankingRoot}>
      <div className={classes.rankingInfo}>
        <div className={classes.rankingTitle}>
          Rank the candidates
        </div>
        <div className={classes.rankingDescription}>
          Click a candidate to rank it, drag to reorder. Unranked get no
          points. <Link to={VOTING_HREF}>Learn more</Link>.
        </div>
        <div className={classes.rankingSubDescription}>
          If you’re unsure about your ranking: vote, read more, and change your
          vote.
        </div>
      </div>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="droppable">
          {({droppableProps, innerRef, placeholder}) => (
            <div
              {...droppableProps}
              ref={innerRef}
              className={classes.rankingCandidates}
            >
              {items.map((
                {id, content: {name, logoSrc, href}, ordered},
                index,
              ) => (
                <Draggable key={id} draggableId={id} index={index}>
                  {({innerRef, draggableProps, dragHandleProps}) => (
                    <div
                      className={classNames(
                        classes.candidate,
                        !ordered && classes.candidateUnordered,
                        ordered && classes.candidateOrdered,
                      )}
                      ref={innerRef}
                      {...draggableProps}
                      {...dragHandleProps}
                      onClick={onClick.bind(null, index)}
                    >
                      <div className={classes.candidateHandle}>
                        {ordered
                          ? (
                            <div className={classes.candidateOrder}>
                              {index + 1}
                            </div>
                          )
                          : (
                            <ForumIcon
                              icon="ChevronUpDown"
                              className={classes.candidateHandleIcon}
                            />
                          )
                        }
                      </div>
                      <div
                        style={{backgroundImage: `url(${logoSrc})`}}
                        className={classes.candidateImage}
                      />
                      <div className={classes.candidateInfo}>
                        <div className={classes.candidateName}>
                          <PostsTooltip postId={hrefToPostId(href)}>
                            <Link
                              to={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={onClickTitle}
                            >
                              {name}
                            </Link>
                          </PostsTooltip>
                        </div>
                      </div>
                      {ordered &&
                        <div
                          className={classes.candidateClear}
                          onClick={onClear.bind(null, index)}
                        >
                          Clear
                        </div>
                      }
                    </div>
                  )}
                </Draggable>
              ))}
              {placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}

const CommentScreen = ({currentUser, commentsPost, classes}: {
  currentUser: UsersCurrent | null,
  commentsPost?: PostsMinimumInfo,
  classes: ClassesType<typeof styles>,
}) => {
  const {flash} = useMessages();

  const onSuccess = useCallback((comment: CommentsList) => {
    const commentLink = commentGetPageUrlFromIds({
      commentId: comment._id,
      postId: comment.postId,
    });

    flash({
      type: "success",
      messageString: (
        <div className={classes.commentFlash}>
          Comment created. <a href={commentLink} target="_blank" rel="noopener noreferrer">View comment</a>.
        </div>
      ),
    });
  }, [flash, classes.commentFlash]);

  return (
    <div className={classes.commentRoot}>
      <div className={classes.commentTitle}>
        Post a comment about your vote
      </div>
      <div className={classes.commentExplanation}>
        This will be posted in the{" "}
        <Link to={THREAD_HREF}>Donation Election discussion thread</Link>{" "}
       with your user name, but your vote will remain anonymous.
      </div>
      <div className={classes.commentDescription}>
        What made you vote the way you did?{" "}
        <span className={classes.commentSecondaryText}>(Optional)</span>
      </div>
      <div className={classes.commentFormContainer}>
        <UsersProfileImage user={currentUser} size={40} />
        <CommentsNewForm
          overrideHintText="Consider sharing why you picked the candidates you selected, writing a note about your experience with the Donation Election, etc."
          interactionType="comment"
          post={commentsPost}
          successCallback={onSuccess}
          className={classes.commentForm}
        />
      </div>
    </div>
  );
}

const ThankYouScreen = ({
  commentsPost,
  onEditVote,
  amountRaised,
  amountTarget,
  classes,
}: {
  commentsPost?: PostsList,
  onEditVote: () => void,
  amountRaised: number,
  amountTarget: number,
  classes: ClassesType<typeof styles>,
}) => {
  const updateCurrentUser = useUpdateCurrentUser();
  const {captureEvent} = useTracking();
  const [addFlair, setAddFlair] = useState(
    false,
  );
  const [confetti, setConfetti] = useState(true);
  const {width, height} = useWindowSize();

  const onConfettiComplete = useCallback(() => {
    setConfetti(false);
  }, []);

  const onToggleFlair = useCallback(async (newValue: boolean) => {
    setAddFlair(newValue);
    void updateCurrentUser({
      givingSeason2025VotedFlair: newValue,
    });
    captureEvent("setGivingSeasonVotedFlair", {value: newValue, year: 2025});
  }, [updateCurrentUser, captureEvent]);

  const fundPercent = Math.round((amountRaised / amountTarget) * 100);

  return (
    <div className={classes.thankYouRoot}>
      {confetti &&
        <ReactConfetti
          width={width}
          height={height}
          numberOfPieces={1200}
          tweenDuration={20000}
          colors={["#A82D22", "#9BBB99", "#FFAF58", "#FAA2A2", "#90CEE9"]}
          recycle={false}
          onConfettiComplete={onConfettiComplete}
        />
      }
      <div className={classes.thankYouTitle}>
        Thank you for voting in the EA Forum Donation Election 2025
      </div>
      <div className={classNames(classes.thankYouBox, classes.thankYouRow)}>
        <ForumIcon icon="Voted" />
        <div className={classes.thankYouFlairInfo}>
          <div className={classes.thankYouSubtitle}>
            Display “I voted” icon on your profile
          </div>
          <div className={classes.thankYouSecondaryText}>
            The icon appears next to your user name
          </div>
        </div>
        <ToggleSwitch
          value={addFlair}
          setValue={onToggleFlair}
          className={classes.thankYouToggle}
        />
      </div>
      <div className={classes.thankYouGrid}>
        <div className={classes.thankYouBox}>
          <div className={classes.thankYouSubtitle}>
            Donation Election Discussion Thread
          </div>
          <div className={classes.thankYouPostInfo}>
            <UsersName user={commentsPost?.user} />
            <FormatDate date={commentsPost?.postedAt ?? new Date()} includeAgo />
            <div className={classes.thankYouCommentContainer}>
              <ForumIcon icon="Comment" className={classes.thankYouCommentIcon} />
              {commentsPost?.commentCount}
            </div>
          </div>
          <EAButton href={THREAD_HREF} className={classes.thankYouBoxButton}>
            Read discussion
          </EAButton>
        </div>
        <div className={classes.thankYouBox}>
          <div className={classes.thankYouSubtitle}>
            ${formatStat(Math.round(amountRaised))}
          </div>
          <div className={classes.thankYouBarContainer}>
            <div
              style={{width: `${fundPercent}%`}}
              className={classes.thankYouBar}
            />
          </div>
          <EAButton
            href={ELECTION_DONATE_HREF}
            className={classes.thankYouBoxButton}
          >
            Donate to the Election Fund
          </EAButton>
        </div>
      </div>
      <EAButton onClick={onEditVote} className={classes.thankYouButton}>
        Edit your vote&nbsp;{""}
        <span className={classes.thankYouSecondaryText}>(until {DONATION_ELECTION_APPROX_CLOSING_DATE})</span>
      </EAButton>
    </div>
  );
}

const Footer = ({
  onBack,
  onNext,
  infoText,
  continueText,
  underText,
  disableContinue,
  classes,
}: {
  onBack: () => void,
  onNext: () => void,
  infoText: ReactNode,
  continueText: ReactNode,
  underText?: ReactNode,
  disableContinue?: boolean,
  classes: ClassesType<typeof styles>,
}) => {
  const onContinue = useCallback(() => {
    if (!disableContinue) {
      onNext();
    }
  }, [onNext, disableContinue]);

  return (
    <div className={classes.footer}>
      <div className={classes.footerContainer}>
        <div className={classes.footerBackContainer}>
          <Link to="#" onClick={onBack} className={classes.footerBackButton}>
            <span>&lt;- Back</span>
          </Link>
        </div>
        <div>
          {infoText}
        </div>
        <div>
          <EAButton
            onClick={onContinue}
            className={classNames(
              classes.footerButton,
              disableContinue && classes.footerButtonDisabled,
            )}
          >
            {continueText} -&gt;
          </EAButton>
        </div>
      </div>
      <div className={classes.footerUnderText}>
        {underText}
      </div>
    </div>
  );
}

const SCREENS = ["welcome", "ranking", "comment", "thank-you"];

type Screen = typeof SCREENS[number];

const candidatesToListItems = (
  candidates: ElectionCandidateBasicInfo[],
  existingVote: Record<string, number>,
): CandidateItem[] => {
  const orderedCandidates = sortBy(candidates, (candidate) => {
    return existingVote[candidate._id] ?? 1000;
  });
  return orderedCandidates.map((candidate) => ({
    id: candidate._id,
    content: candidate,
    ordered: !!existingVote[candidate._id],
  }));
}

const VotingPortalPage = ({classes}: {classes: ClassesType<typeof styles>}) => {
  const currentUser = useCurrentUser();
  const {onLogin} = useLoginPopoverContext();
  const {amountRaised, amountTarget} = useGivingSeason();
  const [screen, setScreen] = useState<Screen>("welcome");
  const initializedRef = useRef(false);
  const {data: existingVoteData} = useQuery(gql`
    query GivingSeason2025MyVote {
      GivingSeason2025MyVote
    }
  `, {fetchPolicy: "cache-first", nextFetchPolicy: "cache-only"});
  const existingVote = useMemo(
    () => existingVoteData?.GivingSeason2025MyVote ?? {},
    [existingVoteData],
  );
  const {results: candidates = []} = useElectionCandidates();
  const [items, setItems] = useState(
    candidatesToListItems.bind(null, candidates, existingVote),
  );
  const voteCount = useMemo(
    () => items.filter(({ordered}) => ordered).length,
    [items],
  );

  const {document: commentsPost} = useSingle({
    collectionName: "Posts",
    fragmentName: "PostsList",
    documentId: COMMENT_POST_ID,
  });

  useEffect(() => {
    if (!initializedRef.current && candidates.length && existingVote) {
      initializedRef.current = true;
      setItems(candidatesToListItems(candidates, existingVote));
    }
  }, [candidates, existingVote]);

  const [saveVote] = useMutation(gql`
    mutation GivingSeason2025Vote($vote: JSON!) {
      GivingSeason2025Vote(vote: $vote)
    }
  `);

  const onBack = useCallback((ev?: Event) => {
    ev?.preventDefault();
    setScreen((currentScreen) => SCREENS[SCREENS.indexOf(currentScreen) - 1]);
  }, []);

  const onNext = useCallback(() => {
    if (currentUser) {
      setScreen((currentScreen) => SCREENS[SCREENS.indexOf(currentScreen) + 1]);
    } else {
      onLogin();
    }
  }, [currentUser, onLogin]);

  const onEditVote = useCallback(() => {
    setScreen("ranking");
  }, []);

  const onSubmitVote = useCallback(async () => {
    const vote: Record<string, number> = {};
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.ordered) {
        break;
      }
      vote[item.id] = i + 1;
    }
    void saveVote({variables: {vote}});
    onNext();
  }, [onNext, saveVote, items]);

  const isCenterAligned = screen === "welcome" || screen === "thank-you";

  return (
    <AnalyticsContext pageContext="votingPortal" pageSectionContext={screen}>
      <div className={classNames(classes.root, {
        [classes.rootSplashImage]: screen === "welcome",
        [classes.rootAlignCentered]: isCenterAligned,
        [classes.rootAlignTop]: !isCenterAligned,
      })}>
        {screen === "welcome" &&
          <WelcomeScreen
            onNext={onNext}
            currentUser={currentUser}
            classes={classes}
          />
        }
        {screen === "ranking" &&
          <>
            <RankingScreen items={items} setItems={setItems} classes={classes} />
            <Footer
              onBack={onBack}
              onNext={onNext}
              infoText={
                <>
                  <span className={classes.noMobile}>You voted for </span>
                  <span>{voteCount}/{items.length}</span>
                  <span className={classes.noMobile}> candidates</span>
                </>
              }
              continueText="Continue"
              disableContinue={voteCount < 1}
              classes={classes}
            />
          </>
        }
        {screen === "comment" &&
          <>
            <CommentScreen
              currentUser={currentUser}
              commentsPost={commentsPost}
              classes={classes}
            />
            <Footer
              onBack={onBack}
              onNext={onSubmitVote}
              infoText={
                <span className={classNames(
                  classes.commentTertiaryText,
                  classes.noMobile,
                )}>
                  You can change your vote until {DONATION_ELECTION_APPROX_CLOSING_DATE}
                </span>
              }
              underText={
                <span className={classNames(
                  classes.commentTertiaryText,
                  classes.onlyMobile,
                )}>
                  You can change your vote until {DONATION_ELECTION_APPROX_CLOSING_DATE}
                </span>
              }
              continueText="Submit your vote"
              classes={classes}
            />
          </>
        }
        {screen === "thank-you" && currentUser &&
          <ThankYouScreen
            commentsPost={commentsPost}
            onEditVote={onEditVote}
            amountRaised={amountRaised}
            amountTarget={amountTarget}
            classes={classes}
          />
        }
      </div>
    </AnalyticsContext>
  );
}

export default registerComponent(
  "VotingPortalPage",
  VotingPortalPage,
  {styles},
);

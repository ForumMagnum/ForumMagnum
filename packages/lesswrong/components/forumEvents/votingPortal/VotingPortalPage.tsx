import React, {
  Dispatch,
  ReactNode,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { Link } from "@/lib/reactRouterWrapper";
import { useSingle } from "@/lib/crud/withSingle";
import { useLoginPopoverContext } from "@/components/hooks/useLoginPopoverContext";
import { gql, useMutation, useQuery } from "@apollo/client";
import { isProduction } from "@/lib/executionEnvironment";
import { AnalyticsContext, useTracking } from "@/lib/analyticsEvents";
import { useCurrentUser } from "@/components/common/withUser";
import { useUpdateCurrentUser } from "@/components/hooks/useUpdateCurrentUser";
import { useWindowSize } from "@/components/hooks/useScreenWidth";
import { MOBILE_HEADER_HEIGHT } from "@/components/common/Header";
import { useElectionCandidates } from "./hooks";
import { getDonateLink, useGivingSeasonEvents } from "../useGivingSeasonEvents";
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

const BACKGROUND_HREF = "https://res.cloudinary.com/cea/image/upload/v1731504237/Rectangle_5032.jpg";
const FUND_HREF = "https://www.every.org/effective-ventures-foundation-usa-inc-for-the-ea-forum-donation-election-fund-2024";
const VOTING_HREF = "#";
const CANDIDATES_HREF = "#";
const FRAUD_HREF = "#";
const RANKING_HREF = "#";
const THREAD_HREF = "#";
const COMMENT_POST_ID = isProduction ? "TODO" : "TKPz7FSTd6siveswn";

const styles = (theme: ThemeType) => ({
  root: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100vw",
    minHeight: "100vh",
    backgroundImage: `url(${BACKGROUND_HREF})`,
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: theme.palette.fonts.sansSerifStack,
    color: theme.palette.text.alwaysWhite,
    marginBottom: 0,
    fontWeight: 500,
    "& a": {
      textDecoration: "underline",
    },
    [theme.breakpoints.down("sm")]: {
      alignItems: "flex-start",
      paddingTop: MOBILE_HEADER_HEIGHT,
    },
  },
  welcomeRoot: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    maxWidth: 600,
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
  welcomeButton: {
    width: "100%",
    padding: "16px 24px",
    fontSize: 16,
    fontWeight: 600,
    lineHeight: "120%",
    color: theme.palette.givingSeason.portalPrimary,
    background: theme.palette.text.alwaysWhite,
    "&:hover": {
      background: theme.palette.text.alwaysWhite,
      opacity: 0.8,
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
    boxShadow: `0px 2px 4px 0px ${theme.palette.givingSeason.candidateShadow}`,
    border: `1px solid ${theme.palette.givingSeason.candidateBorder}`,
    padding: "8px 12px",
    marginBottom: 4,
  },
  candidateUnordered: {
    background: theme.palette.givingSeason.candidateBackground,
  },
  candidateOrdered: {
    background: theme.palette.text.alwaysWhite,
    color: theme.palette.text.alwaysBlack,
  },
  candidateHandle: {
    marginRight: 8,
  },
  candidateHandleIcon: {
    marginTop: 4,
  },
  candidateOrder: {
    background: theme.palette.givingSeason.candidateOrder,
    color: theme.palette.text.alwaysWhite,
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
    borderRadius: theme.borderRadius.small,
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover",
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
    fontSize: 14,
    lineHeight: "140%",
    marginBottom: 16,
  },
  commentDescription: {
    fontSize: 16,
    fontWeight: 600,
    lineHeight: "150%",
    [theme.breakpoints.down("sm")]: {
      fontSize: 14,
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
    background: theme.palette.givingSeason.electionFundBackgroundHeavy,
    borderRadius: theme.borderRadius.default,
    "& .EditorTypeSelect-select": {
      display: "none",
    },
    "& #new-comment-submit": {
      background: theme.palette.givingSeason.portalPrimary,
      fontSize: 14,
      fontWeight: 600,
      "&:hover": {
        background: theme.palette.givingSeason.primary,
      },
    },
    "& .form-input": {
      marginBottom: 0,
    },
    "& .ck-placeholder::before": {
      color: `${theme.palette.text.alwaysWhite} !important`,
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
    background: theme.palette.givingSeason.electionFundBackground,
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
    fontWeigh: 500,
    opacity: 0.7,
  },
  thankYouPostInfo: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
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
    background: theme.palette.givingSeason.electionFundBackground,
    textDecoration: "none !important",
    padding: "12px 24px",
    fontSize: 14,
    fontWeight: 600,
    "&:hover": {
      background: theme.palette.givingSeason.electionFundBackgroundHeavy,
    },
  },
  thankYouButton: {
    padding: 16,
    fontSize: 14,
    fontWeight: 600,
    color: theme.palette.givingSeason.portalPrimary,
    background: theme.palette.text.alwaysWhite,
    "&:hover": {
      background: theme.palette.text.alwaysWhite,
      opacity: 0.8,
    }
  },
  thankYouBarContainer: {
    width: "100%",
    height: 12,
    marginBottom: 20,
    background: theme.palette.givingSeason.electionFundBackground,
    borderRadius: theme.borderRadius.small,
    overflow: "hidden",
  },
  thankYouBar: {
    height: "100%",
    background: theme.palette.text.alwaysWhite,
    transition: "width 0.5s ease",
  },
  thankYouToggle: {
    background: theme.palette.givingSeason.electionFundBackground,
    "& .ToggleSwitch-switchOff": {
      background: theme.palette.givingSeason.electionFundBackground,
    },
    "& .ToggleSwitch-switchOn": {
      background: theme.palette.givingSeason.primary,
    },
  },
  footer: {
    position: "fixed",
    bottom: 0,
    left: 0,
    width: "100vw",
    minHeight: 128,
    background: theme.palette.text.alwaysWhite,
    color: theme.palette.givingSeason.portalPrimary,
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
      opacity: 1,
      color: theme.palette.givingSeason.primary,
    },
  },
  footerButton: {
    background: theme.palette.givingSeason.portalPrimary,
    color: theme.palette.text.alwaysWhite,
    padding: "16px 64px",
    fontWeight: 600,
    whiteSpace: "nowrap",
    "&:hover": {
      background: theme.palette.givingSeason.primary,
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
});

const WelcomeScreen = ({onNext, classes}: {
  onNext: () => void,
  classes: ClassesType<typeof styles>,
}) => {
  const {EAButton} = Components;
  return (
    <div className={classes.welcomeRoot}>
      <div className={classes.welcomeTitle}>
        Vote in the Donation Election 2024
      </div>
      <div className={classes.welcomeDescription}>
        The <Link to={FUND_HREF}>Donation Election Fund</Link> will be
        distributed to the top 3 candidates<sup>1</sup>. This year we&apos;re
        using <Link to={VOTING_HREF}>ranked-choice voting</Link>. You can change
        your vote<sup>2</sup> as many times as you like until the deadline. Find
        out more about the candidates <Link to={CANDIDATES_HREF}>here</Link>.
      </div>
      <EAButton onClick={onNext} className={classes.welcomeButton}>
        Vote in the Election -&gt;
      </EAButton>
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

  const onClear = useCallback((index: number) => {
    setItems((items) => {
      const result = Array.from(items);
      result[index].ordered = false;
      const ordered = result.filter(({ordered}) => ordered);
      const unordered = result.filter(({ordered}) => !ordered);
      return [...ordered, ...unordered];
    });
  }, [setItems]);

  const {ForumIcon} = Components;
  return (
    <div className={classes.rankingRoot}>
      <div className={classes.rankingInfo}>
        <div className={classes.rankingTitle}>
          Rank the candidates
        </div>
        <div className={classes.rankingDescription}>
          Rank the candidates in descending order with your favourite at the
          top. Click on candidates to rank them, drag to change order. Unranked
          candidates get no points. Find out more{" "}
          <Link to={RANKING_HREF}>here</Link>.
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
                    >
                      <div className={classes.candidateHandle} {...dragHandleProps}>
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
                          <Link to={href}>
                            {name}
                          </Link>
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
  const {UsersProfileImage, CommentsNewForm} = Components;
  return (
    <div className={classes.commentRoot}>
      <div className={classes.commentTitle}>
        Post a comment about your vote
      </div>
      <div className={classes.commentExplanation}>
        You comment will be published in the{" "}
        <Link to={THREAD_HREF}>Donation Election discussion thread</Link>.&nbsp;
        <span className={classes.commentSecondaryText}>
          It will be posted with your user name, but your vote will remain
          anonymous.
        </span>
      </div>
      <div className={classes.commentDescription}>
        Why did you vote the way you did?{" "}
        <span className={classes.commentSecondaryText}>(not required)</span>
      </div>
      <div className={classes.commentFormContainer}>
        <UsersProfileImage user={currentUser} size={40} />
        <CommentsNewForm
          overrideHintText="Consider sharing why you picked the candidates you selected, writing a note about your experience with the Donation Election, etc."
          type="submit"
          post={commentsPost}
          className={classes.commentForm}
        />
      </div>
    </div>
  );
}

const ThankYouScreen = ({
  currentUser,
  commentsPost,
  onEditVote,
  amountRaised,
  amountTarget,
  classes,
}: {
  currentUser: UsersCurrent,
  commentsPost?: PostsList,
  onEditVote: () => void,
  amountRaised: number,
  amountTarget: number,
  classes: ClassesType<typeof styles>,
}) => {
  const updateCurrentUser = useUpdateCurrentUser();
  const {captureEvent} = useTracking();
  const [addFlair, setAddFlair] = useState(
    currentUser.givingSeason2024VotedFlair ?? false,
  );
  const [confetti, setConfetti] = useState(true);
  const {width, height} = useWindowSize();

  const onConfettiComplete = useCallback(() => {
    setConfetti(false);
  }, []);

  const onToggleFlair = useCallback(async (newValue: boolean) => {
    setAddFlair(newValue);
    void updateCurrentUser({
      givingSeason2024VotedFlair: newValue,
    });
    captureEvent("setGivingSeasonVotedFlair", {value: newValue, year: 2024});
  }, [updateCurrentUser, captureEvent]);

  const amountRaisedPlusMatched = amountRaised + Math.min(amountRaised, 5000);
  const fundPercent = Math.round((amountRaisedPlusMatched / amountTarget) * 100);

  const {ForumIcon, EAButton, ToggleSwitch, UsersName, FormatDate} = Components;
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
        Thank you for voting in the EA Forum Donation Election 2024
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
            ${formatStat(Math.round(amountRaisedPlusMatched))}
          </div>
          <div className={classes.thankYouBarContainer}>
            <div
              style={{width: `${fundPercent}%`}}
              className={classes.thankYouBar}
            />
          </div>
          <EAButton
            href={getDonateLink(currentUser)}
            className={classes.thankYouBoxButton}
          >
            Donate to the Election Fund
          </EAButton>
        </div>
      </div>
      <EAButton onClick={onEditVote} className={classes.thankYouButton}>
        Edit your vote&nbsp;{""}
        <span className={classes.thankYouSecondaryText}>(until Dec 2)</span>
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
  const {EAButton} = Components;
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
  const {amountRaised, amountTarget} = useGivingSeasonEvents();
  const [screen, setScreen] = useState<Screen>("welcome");
  const initializedRef = useRef(false);
  const {data: existingVoteData} = useQuery(gql`
    query GivingSeason2024MyVote {
      GivingSeason2024MyVote
    }
  `, {fetchPolicy: "cache-first", nextFetchPolicy: "cache-only"});
  const existingVote = useMemo(
    () => existingVoteData?.GivingSeason2024MyVote ?? {},
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
    mutation GivingSeason2024Vote($vote: JSON!) {
      GivingSeason2024Vote(vote: $vote)
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

  return (
    <AnalyticsContext pageContext="votingPortal2024" pageSectionContext={screen}>
      <div className={classes.root}>
        {screen === "welcome" &&
          <WelcomeScreen onNext={onNext} classes={classes} />
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
                  You can change your vote until Dec 2
                </span>
              }
              underText={
                <span className={classNames(
                  classes.commentTertiaryText,
                  classes.onlyMobile,
                )}>
                  You can change your vote until Dec 2
                </span>
              }
              continueText="Submit your vote"
              classes={classes}
            />
          </>
        }
        {screen === "thank-you" && currentUser &&
          <ThankYouScreen
            currentUser={currentUser}
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

const VotingPortalPageComponent = registerComponent(
  "VotingPortalPage",
  VotingPortalPage,
  {styles},
);

declare global {
  interface ComponentTypes {
    VotingPortalPage: typeof VotingPortalPageComponent
  }
}

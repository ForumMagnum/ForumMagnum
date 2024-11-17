import React, { Dispatch, SetStateAction, useCallback, useEffect, useState } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { Link } from "@/lib/reactRouterWrapper";
import { MOBILE_HEADER_HEIGHT } from "@/components/common/Header";
import { useElectionCandidates } from "./hooks";
import { AnalyticsContext } from "@/lib/analyticsEvents";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import classNames from "classnames";

const BACKGROUND_HREF = "https://res.cloudinary.com/cea/image/upload/v1731504237/Rectangle_5032.jpg";
const FUND_HREF = "https://www.every.org/effective-ventures-foundation-usa-inc-for-the-ea-forum-donation-election-fund-2024";
const VOTING_HREF = "#";
const CANDIDATES_HREF = "#";
const FRAUD_HREF = "#";
const RANKING_HREF = "#";

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
    [theme.breakpoints.down(400)]: {
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
  },
  welcomeDescription: {
    fontSize: 18,
    lineHeight: "150%",
    marginBottom: 8,
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
  },
  rankingInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  rankingTitle: {
    fontSize: 40,
    fontWeight: 700,
  },
  rankingDescription: {
    fontSize: 16,
    lineHeight: "150%",
  },
  rankingSubDescription: {
    fontSize: 16,
    lineHeight: "150%",
    opacity: 0.7,
  },
  rankingCandidates: {
    marginTop: 32,
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  candidate: {
    display: "flex",
    alignItems: "center",
    borderRadius: theme.borderRadius.default,
    boxShadow: `0px 2px 4px 0px ${theme.palette.givingSeason.candidateShadow}`,
    border: `1px solid ${theme.palette.givingSeason.candidateBorder}`,
    padding: "8px 12px",
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
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover",
    marginRight: 16,
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
  },
  candidatePostCount: {
    fontSize: 14,
    letterSpacing: "-0.14px",
    opacity: 0.7,
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
  },
  thankYouRoot: {
  },
  footer: {
    position: "fixed",
    bottom: 0,
    left: 0,
    width: "100vw",
    height: 128,
    background: theme.palette.text.alwaysWhite,
    color: theme.palette.givingSeason.portalPrimary,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  footerContainer: {
    width: 750,
    maxWidth: "100vw",
    padding: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "48px",
    fontSize: 14,
    fontWeight: 600,
  },
  footerBackContainer: {
    flexGrow: 1,
  },
  footerBackButton: {
    cursor: "pointer",
    textDecoration: "none !important",
    "&:hover": {
      opacity: 1,
      color: theme.palette.givingSeason.primary,
    },
  },
  footerButton: {
    background: theme.palette.givingSeason.primary,
    color: theme.palette.text.alwaysWhite,
    padding: "16px 64px",
    "&:hover": {
      background: theme.palette.givingSeason.portalPrimary,
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
        <div className={classes.rankingTitle}>Rank the candidates</div>
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
                {id, content: {name, tag, logoSrc, href}, ordered},
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
                        <div className={classes.candidatePostCount}>
                          {tag?.postCount ?? 0} post{tag?.postCount === 1 ? "" : "s"}
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

const CommentScreen = ({classes}: {
  onNext: () => void,
  classes: ClassesType<typeof styles>,
}) => {
  return (
    <div className={classes.commentRoot}>
      Comment
    </div>
  );
}

const ThankYouScreen = ({classes}: {
  onNext: () => void,
  classes: ClassesType<typeof styles>,
}) => {
  return (
    <div className={classes.thankYouRoot}>
      Thank you
    </div>
  );
}

const Footer = ({onBack, onNext, infoText, continueText, classes}: {
  onBack: () => void,
  onNext: () => void,
  infoText: string,
  continueText: string,
  classes: ClassesType<typeof styles>,
}) => {
  const {EAButton} = Components;
  return (
    <div className={classes.footer}>
      <div className={classes.footerContainer}>
        <div className={classes.footerBackContainer}>
          <Link to="#" onClick={onBack} className={classes.footerBackButton}>
            &lt;- Go back
          </Link>
        </div>
        <div>
          {infoText}
        </div>
        <div>
          <EAButton onClick={onNext} className={classes.footerButton}>
            {continueText} -&gt;
          </EAButton>
        </div>
      </div>
    </div>
  );
}

const SCREENS = ["welcome", "ranking", "comment", "thank-you"];

type Screen = typeof SCREENS[number];

const candidatesToListItems = (
  candidates: ElectionCandidateBasicInfo[],
): CandidateItem[] => {
  return candidates.map((candidate) => ({
    id: candidate._id,
    content: candidate,
    ordered: false,
  }));
}

const VotingPortalPage = ({classes}: {classes: ClassesType<typeof styles>}) => {
  const [screen, setScreen] = useState<Screen>("welcome");
  const {results: candidates = []} = useElectionCandidates();
  const [items, setItems] = useState(candidatesToListItems.bind(null, candidates));
  const voteCount = items.filter(({ordered}) => ordered).length;

  useEffect(() => {
    setItems(candidatesToListItems(candidates));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidates.length]);

  const onBack = useCallback((ev?: Event) => {
    ev?.preventDefault();
    setScreen((currentScreen) => SCREENS[SCREENS.indexOf(currentScreen) - 1]);
  }, []);

  const onNext = useCallback(() => {
    setScreen((currentScreen) => SCREENS[SCREENS.indexOf(currentScreen) + 1]);
  }, []);

  return (
    <AnalyticsContext pageContext="votingPortal" pageSectionContext={screen}>
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
              infoText={`You voted for ${voteCount}/${items.length} candidates`}
              continueText="Continue"
              classes={classes}
            />
          </>
        }
        {screen === "comment" &&
          <>
            <CommentScreen onNext={onNext} classes={classes} />
            <Footer
              onBack={onBack}
              onNext={onNext}
              infoText="You can change your vote until Dec 2"
              continueText="Submit your vote"
              classes={classes}
            />
          </>
        }
        {screen === "thank-you" &&
          <ThankYouScreen onNext={onNext} classes={classes} />
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

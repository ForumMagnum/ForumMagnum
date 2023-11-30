import React, { useCallback, useRef, useState } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { votingPortalStyles } from "./styles";
import { isAdmin } from "../../../lib/vulcan-users";
import { useCurrentUser } from "../../common/withUser";
import { Link, useNavigate } from "../../../lib/reactRouterWrapper";
import { useElectionVote } from "./hooks";
import { useElectionCandidates } from "../giving-portal/hooks";
import classNames from "classnames";
import { CompareStateUI, convertCompareStateToVote, getCompareKey, getInitialCompareState, validateCompareState } from "../../../lib/collections/electionVotes/helpers";
import { useMessages } from "../../common/withMessages";

const styles = (theme: ThemeType) => ({
  ...votingPortalStyles(theme),
  compareRow: {
    margin: "8px 0",
  },
  comparisonSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    border: theme.palette.border.grey300,
    borderRadius: theme.borderRadius.default,
    width: "100%",
    maxWidth: 520,
    margin: "6px auto",
    padding: 20,
    fontWeight: 500,
    fontSize: 14,
    gap: "16px"
  },
  controls: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: '16px',
    [theme.breakpoints.down("xs")]: {
      flexDirection: "column",
      alignItems: "flex-end",
      padding: '16px 8px'
    },
  },
  controlsTopRow: {
    flex: 1,
    display: "flex",
    fontSize: 16,
    color: theme.palette.givingPortal[1000],
    width: "100%",
  },
  hide: {
    display: "none !important",
  },
  backLink: {
    gap: "6px",
    display: "flex",
    alignItems: "center",
    fontSize: 16,
    color: theme.palette.givingPortal[1000],
    cursor: "pointer",
    userSelect: "none",
    "&:hover": {
      opacity: 0.8,
    },
  },
  pairCounter: {
    marginLeft: "auto"
  },
  arrowIcon: {
    fontSize: 18,
  },
  arrowLeft: {
    transform: "rotate(180deg)",
  },
  nextButton: {
    flex: 1,
    width: "100%",
    maxWidth: 129,
    height: 43,
    alignSelf: "flex-end",
  },
  tooltipPopper: {
    marginBottom: 6,
  },
});

const EAVotingPortalComparePageLoader = ({ classes }: { classes: ClassesType }) => {
  const { electionVote, updateVote } = useElectionVote("givingSeason23");
  const { results } = useElectionCandidates("random");

  if (!electionVote?.vote || Object.keys(electionVote.vote).length < 2 || !results) return null;

  const vote = electionVote.vote;

  const selectedResults = results?.filter((candidate) => vote[candidate._id] !== undefined);
  // Get n - 1 pairs of candidates, using the same (random) order as the results
  const pairs = selectedResults?.slice(0, -1).map((candidate, index) =>
    ([candidate, selectedResults[index + 1]])
  );

  return (
    <EAVotingPortalComparePage
      electionVote={electionVote}
      updateVote={updateVote}
      candidatePairs={pairs}
      classes={classes}
    />
  );
};

const EAVotingPortalComparePage = ({
  electionVote,
  updateVote,
  candidatePairs,
  classes,
}: {
  electionVote: ElectionVoteInfo;
  updateVote: (data: NullablePartial<DbElectionVote>) => Promise<void>;
  candidatePairs: ElectionCandidateBasicInfo[][];
  classes: ClassesType<typeof styles>;
}) => {
  const { VotingPortalFooter, ElectionComparePair, ForumIcon, LWTooltip } = Components;
  const navigate = useNavigate();
  const { flash } = useMessages();
  const [compareState, setCompareState] = useState<CompareStateUI>(
    electionVote.compareState ?? getInitialCompareState(candidatePairs)
  );
  const [currentPairIndex, setCurrentPairIndex] = useState(0);

  const reachedEndRef = useRef(false);
  const doneBefore = !!electionVote.compareState;
  const continueMessage = doneBefore ? "Recalculate allocation" : "Continue";

  if (currentPairIndex === candidatePairs.length - 1 && !reachedEndRef.current) {
    reachedEndRef.current = true;
  }

  const [currentA, currentB] = candidatePairs[currentPairIndex];
  const currentPairKey = getCompareKey(currentA, currentB);
  const currentPairState = compareState[currentPairKey];

  const nextDisabled = currentPairIndex === candidatePairs.length - 1;
  const prevDisabled = currentPairIndex === 0;

  const setCurrentPairState = useCallback((newState: {multiplier: number | string, AtoB: boolean}) => {
    setCompareState((prev) => ({...prev, [currentPairKey]: newState}));
  }, [currentPairKey]);

  const saveComparison = useCallback(async () => {
    // Convert all strings to numbers with parseFloat (currently assuming no zeros/nulls TODO handle this properly)
    const newCompareState = Object.fromEntries(
      Object.entries(compareState).map(([key, value]) => [key, { ...value, multiplier: parseFloat(value.multiplier as string) }])
    );

    try {
      validateCompareState({ data: { compareState: newCompareState }});
      const newVote = convertCompareStateToVote(newCompareState);

      await updateVote({
        vote: newVote,
        compareState: newCompareState,
      })
    } catch (e) {
      // If any of the multipliers are 0 or empty , give that as the error message
      if (Object.values(newCompareState).some((value) => !value.multiplier)) {
        flash("Error: all values must be filled in and non-zero. You can remove a candidate in the previous step if needed.");
        return;
      }
      flash(e.message);
      return;
    }

    navigate({ pathname: "/voting-portal/allocate-votes" });
  }, [compareState, flash, navigate, updateVote]);

  // TODO un-admin-gate when the voting portal is ready
  const currentUser = useCurrentUser();
  if (!isAdmin(currentUser)) return null;

  return (
    <AnalyticsContext pageContext="eaVotingPortalCompare">
      <div className={classes.root}>
        <div className={classes.content} id="top">
          <div className={classes.h2}>2. Compare projects</div>
          <div className={classes.subtitle}>
            Use pairwise comparisons to get an initial allocation of your votes. You can still change the allocation
            manually in the next step.
          </div>
          <div className={classes.comparisonSection}>
            <ElectionComparePair
              candidateA={currentA}
              candidateB={currentB}
              value={currentPairState}
              setValue={setCurrentPairState}
            />
            <div className={classes.controls}>
              <div className={classes.controlsTopRow}>
                <div
                  className={classNames(classes.backLink, {
                    [classes.hide]: prevDisabled,
                  })}
                  onClick={() => {
                    if (prevDisabled) return;
                    setCurrentPairIndex((prev) => prev - 1);
                  }}
                >
                  <ForumIcon icon="ArrowRight" className={classNames(classes.arrowIcon, classes.arrowLeft)} /> Back
                </div>
                <div className={classes.pairCounter}>
                  Pair {currentPairIndex + 1}/{candidatePairs.length}
                </div>
              </div>
              <LWTooltip
                  title={`Click "${continueMessage}" below to continue to the next step`}
                  placement="top"
                  disabled={!nextDisabled}
                  popperClassName={classes.tooltipPopper}
                >
                <button
                  className={classNames(classes.button, classes.nextButton, {
                    [classes.buttonDisabled]: nextDisabled,
                  })}
                  onClick={() => {
                    if (nextDisabled) return;
                    setCurrentPairIndex((prev) => prev + 1);
                  }}
                >
                  Next pair <ForumIcon icon="ArrowRight" className={classes.arrowIcon} />
                </button>
              </LWTooltip>
            </div>
          </div>
        </div>
        <VotingPortalFooter
          leftHref="/voting-portal/select-candidates"
          middleNode={<Link to="/voting-portal/allocate-votes">Skip this step and allocate votes manually</Link>}
          buttonText={doneBefore ? "Recalculate allocation" : "Continue"}
          buttonProps={{
            onClick: saveComparison,
            disabled: (!reachedEndRef.current && !doneBefore) || !!electionVote.submittedAt,
          }}
        />
      </div>
    </AnalyticsContext>
  );
};

const EAVotingPortalComparePageComponent = registerComponent(
  "EAVotingPortalComparePage",
  EAVotingPortalComparePageLoader,
  {styles},
);

declare global {
  interface ComponentTypes {
    EAVotingPortalComparePage: typeof EAVotingPortalComparePageComponent;
  }
}


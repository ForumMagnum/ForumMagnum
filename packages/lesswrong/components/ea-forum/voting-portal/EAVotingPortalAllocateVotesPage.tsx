import React, { useCallback, useState } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { votingPortalStyles } from "./styles";
import { Link, useNavigate } from "../../../lib/reactRouterWrapper";
import { useElectionVote } from "./hooks";
import { useMessages } from "../../common/withMessages";
import { processLink } from "./VotingPortalIntro";
import { useCurrentUser } from "../../common/withUser";
import { userCanVoteInDonationElection } from "../../../lib/eaGivingSeason";
import classNames from "classnames";

const styles = (theme: ThemeType) => ({
  ...votingPortalStyles(theme),
  mb2: {
    marginBottom: 12,
  },
  tipsBox: {
    position: "absolute",
    top: 48,
    fontSize: 14,
    left: 'min(56vw, 820px)',
    backgroundColor: theme.palette.givingPortal.thankYouBackground,
    borderRadius: theme.borderRadius.default,
    color: theme.palette.givingPortal[1000],
    width: "100%",
    maxWidth: 300,
    padding: 16,
    fontWeight: 500,
    marginBottom: 20,
    '& ul': {
      paddingInlineStart: "20px",
    },
    '& li': {
      marginBottom: 8,
      '&:last-child': {
        marginBottom: 0,
      },
    },
    [theme.breakpoints.down("lg")]: {
      marginTop: -6,
      position: "relative",
      top: 0,
      left: 0,
      maxWidth: 600,
      marginLeft: "auto",
      marginRight: "auto",
    }
  }
})

const EAVotingPortalAllocateVotesPageLoader = ({ classes }: { classes: ClassesType }) => {
  const { electionVote, updateVote } = useElectionVote("givingSeason23");

  const currentUser = useCurrentUser();
  const { LoginForm } = Components;

  if (!currentUser) {
    return (
      <div className={classes.noPermissionFallback}>
        <LoginForm />
      </div>
    );
  }
  if (!userCanVoteInDonationElection(currentUser)) {
    return (
      <p className={classes.noPermissionFallback}>
        You are not eligible to vote as your account was created after 22nd Oct 2023
      </p>
    );
  }

  if (!electionVote?.vote) return null;

  return (
    <EAVotingPortalAllocateVotesPage
      electionVote={electionVote}
      updateVote={updateVote}
      classes={classes}
    />
  );
};

const EAVotingPortalAllocateVotesPage = ({
  electionVote,
  updateVote,
  classes,
}: {
  electionVote: ElectionVoteInfo;
  updateVote: (data: NullablePartial<DbElectionVote>) => Promise<void>;
  classes: ClassesType<typeof styles>;
}) => {
  const { VotingPortalFooter, ElectionAllocateVote } = Components;
  const navigate = useNavigate();
  const { flash } = useMessages();

  const didCompareStep = !!electionVote.compareState;
  const subtitleStart = didCompareStep ? "Edit the suggested point allocation (auto-generated from your answers in the previous step)." : "Add a numerical score for each candidate listed here.";

  // Note: strings are allowed here because to allow the user to type we need to differentiate between
  // e.g. "0" and "0.". These are converted to numbers in saveAllocation
  const [voteState, setVoteState] = useState<Record<string, number | string | null>>(electionVote.vote);

  const selectedCandidateIds = Object.keys(voteState);
  const allocatedCandidateIds = selectedCandidateIds.filter((id) => voteState[id] !== null);

  const saveAllocation = useCallback(async () => {
    try {
      // Convert all strings to numbers with parseFloat
      const newVote = Object.fromEntries(
        // Treate 0, "0", null etc all as null
        Object.entries(voteState).map(([id, value]) => [id, value ? parseFloat(value as string) : null])
      );
      await updateVote({vote: newVote});
    } catch (e) {
      flash(e.message);
      return;
    }

    navigate({ pathname: "/voting-portal/submit" });
  }, [flash, navigate, updateVote, voteState]);

  return (
    <AnalyticsContext pageContext="eaVotingPortalAllocateVotes">
      <div className={classes.root}>
        <div className={classes.content} id="top">
          <div className={classes.h2}>3. Allocate your votes</div>
          <div className={classNames(classes.subtitle, classes.mb2)}>
            <div className={classes.subtitleParagraph}>
              {subtitleStart}{" "}
              <b>
                This point distribution should basically represent how you’d personally allocate the Donation Election
                Fund between the candidates.
              </b>
            </div>
            <div>
              As a reminder,{" "}
              <Link to={processLink} target="_blank" rel="noopener noreferrer">
                this post
              </Link>{" "}
              describes how we’ll use the scores to determine the winners in the Donation Election.
            </div>
          </div>
          <ElectionAllocateVote voteState={voteState} setVoteState={setVoteState} />
        </div>
        <VotingPortalFooter
          leftHref={selectedCandidateIds.length > 1 ? "/voting-portal/compare" : "/voting-portal/select-candidates"}
          middleNode={
            <div>
              Allocated to {allocatedCandidateIds.length}/{selectedCandidateIds.length} projects
            </div>
          }
          buttonProps={{
            onClick: saveAllocation,
            disabled: allocatedCandidateIds.length === 0,
          }}
          electionVote={electionVote}
          updateVote={updateVote}
        />
      </div>
    </AnalyticsContext>
  );
};

const EAVotingPortalAllocateVotesPageComponent = registerComponent(
  "EAVotingPortalAllocateVotesPage",
  EAVotingPortalAllocateVotesPageLoader,
  {styles},
);

declare global {
  interface ComponentTypes {
    EAVotingPortalAllocateVotesPage: typeof EAVotingPortalAllocateVotesPageComponent;
  }
}


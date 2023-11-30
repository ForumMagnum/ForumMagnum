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

const styles = (theme: ThemeType) => ({
  ...votingPortalStyles(theme),
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
          <div className={classes.h2}>3. Finalize point allocation</div>
          <div className={classes.subtitle}>
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


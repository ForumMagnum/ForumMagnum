import React, { useCallback, useState } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { votingPortalStyles } from "./styles";
import { useNavigate } from "../../../lib/reactRouterWrapper";
import { useElectionVote } from "./hooks";
import { useMessages } from "../../common/withMessages";

const styles = (theme: ThemeType) => ({
  ...votingPortalStyles(theme),
});

const EAVotingPortalAllocateVotesPageLoader = ({ classes }: { classes: ClassesType }) => {
  const { electionVote, updateVote } = useElectionVote("givingSeason23");

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
  classes: ClassesType;
}) => {
  const { VotingPortalFooter, ElectionAllocateVote } = Components;
  const navigate = useNavigate();
  const { flash } = useMessages();

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
          <div className={classes.subtitle}>
            Add numbers based on how you would allocate funding between these projects.{" "}
            <b>Don’t worry about the total vote count</b>, but make sure the relative vote counts are reasonable to you.
          </div>
          <ElectionAllocateVote
            voteState={voteState}
            setVoteState={setVoteState}
          />
        </div>
        <VotingPortalFooter
          leftHref={selectedCandidateIds.length > 1 ? "/voting-portal/compare" : "/voting-portal/select-candidates"}
          middleNode={<div>Allocated to {allocatedCandidateIds.length}/{selectedCandidateIds.length} projects</div>}
          buttonProps={{
            onClick: saveAllocation,
            disabled: allocatedCandidateIds.length === 0 || !!electionVote.submittedAt,
          }}
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


import React, { useCallback, useState } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { votingPortalStyles } from "./styles";
import { useCurrentUser } from "../../common/withUser";
import { isAdmin } from "../../../lib/vulcan-users";
import { Link, useNavigate } from "../../../lib/reactRouterWrapper";
import { useElectionVote } from "./hooks";
import difference from "lodash/difference";

const styles = (theme: ThemeType) => ({
  ...votingPortalStyles(theme),
});

const EAVotingPortalSelectCandidatesPageLoader = ({ classes }: { classes: ClassesType }) => {
  const { electionVote, updateVote } = useElectionVote("givingSeason23");

  if (!electionVote) return null;

  const selectedCandidateIds = Object.keys(electionVote.vote);

  return (
    <EAVotingPortalSelectCandidatesPage
      selectedCandidateIds={selectedCandidateIds}
      electionVote={electionVote}
      updateVote={updateVote}
      classes={classes}
    />
  );
};

const EAVotingPortalSelectCandidatesPage = ({
  selectedCandidateIds,
  electionVote,
  updateVote,
  classes,
}: {
  selectedCandidateIds: string[];
  electionVote: ElectionVoteInfo;
  updateVote: (newVote: NullablePartial<DbElectionVote>) => Promise<void>;
  classes: ClassesType;
}) => {
  const { ElectionCandidatesList, VotingPortalFooter } = Components;
  const [selectedIds, setSelectedCandidateIds] = useState<string[]>(selectedCandidateIds);
  const [totalCount, setTotalCount] = useState<number>(0);
  const navigate = useNavigate();

  const saveSelection = useCallback(async () => {
    const newVote = selectedIds.reduce((acc, id) => ({ ...acc, [id]: electionVote.vote[id] ?? null }), {})
    await updateVote({vote: newVote});
  }, [electionVote, selectedIds, updateVote]);

  const onSelect = useCallback((candidateIds: string[]) => {
    setSelectedCandidateIds((prev) => {
      const newIds = difference(candidateIds, prev);
      const carriedIds = difference(prev, candidateIds);

      return [...newIds, ...carriedIds];
    });
  }, []);

  // TODO un-admin-gate when the voting portal is ready
  const currentUser = useCurrentUser();
  if (!isAdmin(currentUser)) return null;

  return (
    <AnalyticsContext pageContext="eaVotingPortalSelectCandidates">
      <div className={classes.root}>
        <div className={classes.content}>
          <div className={classes.h2}>1. Select projects you want to vote for</div>
          <div className={classes.subtitle}>
            You'll allocate votes to these projects in the next step.{" "}
            <Link to="/posts/dYhKfsNuQX2sznfxe/donation-election-how-voting-will-work">
              See what we'll do for projects you don't vote on.
            </Link>
          </div>
          <ElectionCandidatesList
            type="select"
            selectedCandidateIds={selectedIds}
            onSelect={onSelect}
            setTotalCount={setTotalCount}
          />
        </div>
        <VotingPortalFooter
          leftText="Go back"
          leftHref="/voting-portal"
          middleNode={<div>Selected {selectedIds.length}/{totalCount} candidates</div>}
          buttonProps={{
            onClick: async () => {
              await saveSelection();
              navigate({ pathname: "/voting-portal/compare" });
            },
            disabled: selectedIds.length === 0
          }}
        />
      </div>
    </AnalyticsContext>
  );
};

const EAVotingPortalSelectCandidatesPageComponent = registerComponent(
  "EAVotingPortalSelectCandidatesPage",
  EAVotingPortalSelectCandidatesPageLoader,
  { styles }
);

declare global {
  interface ComponentTypes {
    EAVotingPortalSelectCandidatesPage: typeof EAVotingPortalSelectCandidatesPageComponent;
  }
}

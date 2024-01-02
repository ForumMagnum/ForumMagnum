import React, { useCallback, useState } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { votingPortalStyles } from "./styles";
import { Link, useNavigate } from "../../../lib/reactRouterWrapper";
import { useElectionVote } from "./hooks";
import difference from "lodash/difference";
import { useMessages } from "../../common/withMessages";
import { candidatesLink, processLink } from "./VotingPortalIntro";
import { useCurrentUser } from "../../common/withUser";
import { eaGivingSeason23ElectionName, userCanVoteInDonationElection } from "../../../lib/eaGivingSeason";

const styles = (theme: ThemeType) => ({
  ...votingPortalStyles(theme),
});

const EAVotingPortalSelectCandidatesPageLoader = ({ classes }: { classes: ClassesType }) => {
  const { electionVote, updateVote } = useElectionVote(eaGivingSeason23ElectionName);

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
    <EAVotingPortalSelectCandidatesPage
      electionVote={electionVote}
      updateVote={updateVote}
      classes={classes}
    />
  );
};

const EAVotingPortalSelectCandidatesPage = ({
  electionVote,
  updateVote,
  classes,
}: {
  electionVote: ElectionVoteInfo;
  updateVote: (newVote: NullablePartial<DbElectionVote>) => Promise<void>;
  classes: ClassesType;
}) => {
  const { ElectionCandidatesList, VotingPortalFooter } = Components;
  const [selectedIds, setSelectedCandidateIds] = useState<string[]>(Object.keys(electionVote.vote));
  const [totalCount, setTotalCount] = useState<number>(0);
  const navigate = useNavigate();
  const { flash } = useMessages();

  const saveSelection = useCallback(async () => {
    if (selectedIds.length === 0) {
      flash("You must select at least one candidate");
      return;
    }
    const isSingleCandidate = selectedIds.length === 1;

    try {
      const newVote = isSingleCandidate
        ? { [selectedIds[0]]: 1 } // If there is only one candidate, give them all the votes
        : selectedIds.reduce((acc, id) => ({ ...acc, [id]: electionVote.vote[id] ?? null }), {});
      // In case they are redoing this step, clear the compare state
      await updateVote({vote: newVote, compareState: null});
    } catch (e) {
      flash(e.message);
      return;
    }

    const nextStep = isSingleCandidate ? "/voting-portal/submit" : "/voting-portal/compare";
    navigate({ pathname: nextStep });
  }, [electionVote.vote, flash, navigate, selectedIds, updateVote]);

  const onSelect = useCallback((candidateIds: string[]) => {
    setSelectedCandidateIds((prev) => {
      const newIds = difference(candidateIds, prev);
      const carriedIds = difference(prev, candidateIds);

      return [...newIds, ...carriedIds];
    });
  }, []);

  return (
    <AnalyticsContext pageContext="eaVotingPortalSelectCandidates">
      <div className={classes.root}>
        <div className={classes.content}>
          <div className={classes.h2}>1. Select candidates you want to give points to</div>
          <div className={classes.subtitle}>
            <div className={classes.subtitleParagraph}>You'll assign points in the next steps.
            For information about how voting works, check{" "}
              <Link to={processLink} target="_blank" rel="noopener noreferrer">
                this post
              </Link>
              .
            </div>
            <div>
              <Link to={candidatesLink} target="_blank" rel="noopener noreferrer">
                Read about the candidates
              </Link>{" "}
              (and what they would do with more funding).
            </div>
          </div>
          <ElectionCandidatesList
            type="select"
            selectedCandidateIds={selectedIds}
            onSelect={onSelect}
            setTotalCount={setTotalCount}
          />
        </div>
        <VotingPortalFooter
          leftText={electionVote.submittedAt ? "Go back to start" : "Go back"}
          leftHref={electionVote.submittedAt ? "/voting-portal?thankyou=false" : "/voting-portal"}
          middleNode={
            <div>
              Selected {selectedIds.length}/{totalCount} candidates
            </div>
          }
          buttonProps={{
            onClick: saveSelection,
            disabled: selectedIds.length === 0,
          }}
          electionVote={electionVote}
          updateVote={updateVote}
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

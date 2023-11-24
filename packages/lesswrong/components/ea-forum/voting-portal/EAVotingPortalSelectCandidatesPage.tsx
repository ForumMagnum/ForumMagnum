import React, { useCallback, useState } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { votingPortalStyles } from "./styles";
import { useCurrentUser } from "../../common/withUser";
import { isAdmin } from "../../../lib/vulcan-users";
import { Link } from "../../../lib/reactRouterWrapper";

const styles = (theme: ThemeType) => ({
  ...votingPortalStyles(theme),
});

// TODO: implement
const EAVotingPortalSelectCandidatesPage = ({classes}: {classes: ClassesType}) => {
  const { ElectionCandidatesList } = Components;

  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const onSelect = useCallback((candidateId: string) => {
    setSelectedCandidateIds((prev) => {
      if (prev.includes(candidateId)) {
        return prev.filter((id) => id !== candidateId);
      } else {
        return [...prev, candidateId];
      }
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
            selectedCandidateIds={selectedCandidateIds}
            onSelect={onSelect}
            className={classes.electionCandidates}
          />
        </div>
      </div>
    </AnalyticsContext>
  );
}

const EAVotingPortalSelectCandidatesPageComponent = registerComponent(
  "EAVotingPortalSelectCandidatesPage",
  EAVotingPortalSelectCandidatesPage,
  {styles},
);

declare global {
  interface ComponentTypes {
    EAVotingPortalSelectCandidatesPage: typeof EAVotingPortalSelectCandidatesPageComponent;
  }
}


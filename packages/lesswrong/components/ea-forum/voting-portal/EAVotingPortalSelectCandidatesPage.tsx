import React, { useCallback, useRef, useState } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { votingPortalStyles } from "./styles";
import { useCurrentUser } from "../../common/withUser";
import { isAdmin } from "../../../lib/vulcan-users";
import { Link, useNavigate } from "../../../lib/reactRouterWrapper";
import { useElectionVote } from "./hooks";
import classNames from "classnames";
import difference from "lodash/difference";

const styles = (theme: ThemeType) => ({
  ...votingPortalStyles(theme),
  continueButton: {
    flex: 1,
    width: "100%",
    maxWidth: 244,
    height: 51,
    alignSelf: "flex-end",
  },
  backLink: {
    gap: "6px",
    display: "flex",
    alignItems: "center",
  },
  arrowIcon: {
    fontSize: 18,
  },
  arrowLeft: {
    transform: "rotate(180deg)",
  },
});

const EAVotingPortalSelectCandidatesPageLoader = ({classes}: {classes: ClassesType}) => {
  const { electionVote, updateVote } = useElectionVote('givingSeason23');

  if (!electionVote) return null;

  const selectedCandidateIds = Object.keys(electionVote);

  return (
    <EAVotingPortalSelectCandidatesPage
      selectedCandidateIds={selectedCandidateIds}
      electionVote={electionVote}
      updateVote={updateVote}
      classes={classes}
    />
  );
}

const EAVotingPortalSelectCandidatesPage = ({
  selectedCandidateIds,
  electionVote,
  updateVote,
  classes,
}: {
  selectedCandidateIds: string[];
  electionVote: Record<string, number | null>;
  updateVote: (newVote: Record<string, number | null>) => Promise<void>;
  classes: ClassesType;
}) => {
  const { ElectionCandidatesList, ForumIcon } = Components;
  const [selectedIds, setSelectedCandidateIds] = useState<string[]>(selectedCandidateIds);
  const [totalCount, setTotalCount] = useState<number>(0);
  const navigate = useNavigate();

  const saveSelection = useCallback(async () => {
    await updateVote(selectedIds.reduce((acc, id) => ({ ...acc, [id]: electionVote[id] || null }), {}));
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
            className={classes.electionCandidates}
          />
        </div>
        <div className={classes.footer}>
          <div className={classes.footerInner}>
            <div className={classes.footerTopRow}>
              <Link to="/voting-portal" className={classes.backLink}>
                <ForumIcon icon="ArrowRight" className={classNames(classes.arrowIcon, classes.arrowLeft)} /> Go back
              </Link>
              <div>
                Selected {selectedIds.length}/{totalCount} candidates
              </div>
            </div>
            <button
              onClick={async () => {
                await saveSelection();
                navigate({ pathname: "/voting-portal/compare" });
              }}
              className={classNames(classes.button, classes.continueButton, {
                [classes.buttonDisabled]: selectedIds.length === 0,
              })}
              disabled={selectedIds.length === 0}
            >
              Continue <ForumIcon icon="ArrowRight" className={classes.arrowIcon} />
            </button>
          </div>
        </div>
      </div>
    </AnalyticsContext>
  );
};

const EAVotingPortalSelectCandidatesPageComponent = registerComponent(
  "EAVotingPortalSelectCandidatesPage",
  EAVotingPortalSelectCandidatesPageLoader,
  {styles},
);

declare global {
  interface ComponentTypes {
    EAVotingPortalSelectCandidatesPage: typeof EAVotingPortalSelectCandidatesPageComponent;
  }
}


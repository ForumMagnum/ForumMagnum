import React, { useCallback } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { useLocation } from "../../../lib/routeUtil";
import { useCurrentUser } from "../../common/withUser";
import type { VotingProps } from "../../votes/votingProps";

const styles = (theme: ThemeType) => ({
  icon: {
    cursor: "pointer",
    color: theme.palette.givingPortal[0],
    fontSize: 20,
    "&:hover": {
      opacity: 0.5,
    },
  },
});

type PreVoteProps = VotingProps<ElectionCandidateBasicInfo>;

const PreVoteButton = ({vote, document, className, classes}: PreVoteProps & {
  className?: string,
  classes: ClassesType,
}) => {
  const {pathname} = useLocation();
  const currentUser = useCurrentUser();

  const hasVoted = !!document.currentUserExtendedVote?.preVote;
  const icon = hasVoted ? "Heart" : "HeartOutline";
  const tooltip = hasVoted ? "Remove pre-vote" : "Pre-vote";

  const onVote = useCallback(() => {
    if (currentUser) {
      vote({
        document,
        voteType: null,
        extendedVote: {preVote: !hasVoted},
        currentUser,
      });
    } else {
      window.location.href = `/auth/auth0?returnTo=${pathname}`;
    }
  }, [vote, currentUser, hasVoted, document, pathname]);

  const {LWTooltip, ForumIcon} = Components;
  return (
    <LWTooltip title={tooltip} placement="bottom" className={className}>
      <ForumIcon
        onClick={onVote}
        icon={icon}
        className={classes.icon}
      />
    </LWTooltip>
  );
}

const PreVoteButtonComponent = registerComponent(
  "PreVoteButton",
  PreVoteButton,
  {styles},
);

declare global {
  interface ComponentTypes {
    PreVoteButton: typeof PreVoteButtonComponent;
  }
}

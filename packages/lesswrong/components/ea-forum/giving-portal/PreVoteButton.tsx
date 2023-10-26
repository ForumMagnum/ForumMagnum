import React, { useCallback } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { useLocation } from "../../../lib/routeUtil";
import { useCurrentUser } from "../../common/withUser";
import { useHover } from "../../common/withHover";
import type { VotingProps } from "../../votes/votingProps";
import classNames from "classnames";

const styles = (theme: ThemeType) => ({
  root: {
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
  const {hover, everHovered, anchorEl, eventHandlers} = useHover();
  const {pathname} = useLocation();
  const currentUser = useCurrentUser();

  const hasVoted = !!document.currentUserExtendedVote?.preVote;
  const icon = hasVoted || hover ? "Heart" : "HeartOutline";
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

  const {LWPopper, ForumIcon} = Components;
  return (
    <>
      {everHovered &&
        <LWPopper
          placement="bottom"
          open={hover}
          anchorEl={anchorEl}
          hideOnTouchScreens
          tooltip
        >
          {tooltip}
        </LWPopper>
      }
      <ForumIcon
        {...eventHandlers}
        onClick={onVote}
        icon={icon}
        className={classNames(classes.root, className)}
      />
    </>
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

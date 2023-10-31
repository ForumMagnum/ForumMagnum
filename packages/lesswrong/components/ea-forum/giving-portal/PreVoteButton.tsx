import React, { useCallback } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { useDialog } from "../../common/withDialog";
import { useCurrentUser } from "../../common/withUser";
import { useHover } from "../../common/withHover";
import type { VotingProps } from "../../votes/votingProps";
import classNames from "classnames";

const styles = (theme: ThemeType) => ({
  root: {
    cursor: "pointer",
    color: theme.palette.givingPortal[1000],
    fontSize: 20,
    "&:hover": {
      opacity: 0.5,
    },
  },
  tooltip: {
    background: `${theme.palette.panelBackground.tooltipBackground2} !important}`,
  },
});

type PreVoteProps = VotingProps<ElectionCandidateBasicInfo>;

const PreVoteButton = ({vote, document, className, classes}: PreVoteProps & {
  className?: string,
  classes: ClassesType,
}) => {
  const {hover, everHovered, anchorEl, eventHandlers} = useHover();
  const {openDialog} = useDialog();
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
      openDialog({
        componentName: "LoginPopup",
        componentProps: {},
      });
    }
  }, [vote, currentUser, hasVoted, document, openDialog]);

  const {LWPopper, ForumIcon} = Components;
  return (
    <>
      {everHovered &&
        <LWPopper
          placement="bottom"
          open={hover}
          anchorEl={anchorEl}
          className={classes.tooltip}
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

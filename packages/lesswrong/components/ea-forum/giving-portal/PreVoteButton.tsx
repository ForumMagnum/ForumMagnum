import React, { useCallback } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { useDialog } from "../../common/withDialog";
import { useMessages } from "../../common/withMessages";
import { useCurrentUser } from "../../common/withUser";
import { useHover } from "../../common/withHover";
import type { VotingProps } from "../../votes/votingProps";
import classNames from "classnames";
import { useTracking } from "../../../lib/analyticsEvents";
import { isMobile } from "../../../lib/utils/isMobile";

const styles = (theme: ThemeType) => ({
  root: {
    cursor: "pointer",
    color: theme.palette.givingPortal[1000],
    fontSize: 28,
    padding: 4,
    // Translate to offset the padding
    transform: "translate(4px, -4px)",
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
  const {flash} = useMessages();
  const currentUser = useCurrentUser();
  const { captureEvent } = useTracking();

  const hasVoted = !!document.currentUserExtendedVote?.preVote;
  const icon = hasVoted || (hover && !isMobile()) ? "Heart" : "HeartOutline";
  const tooltip = hasVoted ? "Remove pre-vote" : "Pre-vote";

  const onVote = useCallback(async () => {
    if (currentUser) {
      captureEvent('preVote', {documentId: document._id, preVote: !hasVoted});
      try {
        await vote({
          document,
          voteType: null,
          extendedVote: {preVote: !hasVoted},
          currentUser,
        });
      } catch (e) {
        flash(e.message);
      }
    } else {
      openDialog({
        componentName: "LoginPopup",
        componentProps: {},
      });
    }
  }, [currentUser, captureEvent, document, hasVoted, vote, flash, openDialog]);

  const {LWPopper, ForumIcon} = Components;
  return (
    <>
      {/* {everHovered &&
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
      } */}
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

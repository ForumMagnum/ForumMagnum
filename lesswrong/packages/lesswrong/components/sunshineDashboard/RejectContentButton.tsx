import React, {useState} from 'react';
import {Components, registerComponent} from '../../lib/vulcan-lib';
import RejectedIcon from "@material-ui/icons/NotInterested";
import { useHover } from "../common/withHover";
import { useRejectContent, RejectContentParams } from "../hooks/useRejectContent";
import ReplayIcon from '@material-ui/icons/Replay';

const styles = (theme: ThemeType) => ({
  root: {
    padding: 4
  },
  button: {
    color: theme.palette.grey[500],
    cursor: "pointer",
    '&:hover': {
      opacity: .5
    },
    display: "flex",
    alignItems: "center"
  },
  icon: {
    height: 18,
    width: 18,
    marginRight: 6
  }
});

export const RejectContentButton = ({contentWrapper, classes}: {
  contentWrapper: RejectContentParams,
  classes: ClassesType<typeof styles>,
}) => {
  const { eventHandlers, anchorEl } = useHover();
  const { rejectContent, unrejectContent } = useRejectContent(contentWrapper);
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const { LWPopper, LWClickAwayListener, RejectContentDialog, LWTooltip, MetaInfo } = Components;
  const { content } = contentWrapper;

  const handleRejectContent = (reason: string) => {
    setShowRejectionDialog(false);
    rejectContent(reason);
  };

  return <span {...eventHandlers}>
    {content.rejected && <span >
        <LWTooltip title="Undo rejection">
          <ReplayIcon className={classes.icon} onClick={unrejectContent}/>
        </LWTooltip>
    </span>}
    {!content.rejected && content.authorIsUnreviewed && <span className={classes.button} onClick={() => setShowRejectionDialog(true)}>
      <RejectedIcon className={classes.icon}/> <MetaInfo>Reject</MetaInfo>
    </span>}
    <LWPopper
      open={showRejectionDialog}
      anchorEl={anchorEl}
      clickable={true}
      allowOverflow={true}
      placement={"right"}
    >
      <LWClickAwayListener onClickAway={() => setShowRejectionDialog(false)}>
        <RejectContentDialog rejectContent={handleRejectContent}/>
      </LWClickAwayListener>
    </LWPopper>
  </span>
}

const RejectContentButtonComponent = registerComponent('RejectContentButton', RejectContentButton, {styles});

declare global {
  interface ComponentTypes {
    RejectContentButton: typeof RejectContentButtonComponent
  }
}


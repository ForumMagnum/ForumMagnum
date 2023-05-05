import React, {useState} from 'react';
import {Components, registerComponent} from '../../lib/vulcan-lib';
import RejectedIcon from "@material-ui/icons/NotInterested";
import ClickAwayListener from "@material-ui/core/ClickAwayListener";
import { useHover } from "../common/withHover";
import { useRejectContent, RejectContentParams } from "../hooks/useRejectContent";
import ReplayIcon from '@material-ui/icons/Replay';

const styles = (theme: ThemeType): JssStyles => ({
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
  classes: ClassesType,
}) => {
  
  const { eventHandlers, anchorEl } = useHover();
  const { rejectContent, unrejectContent } = useRejectContent(contentWrapper);
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const { LWPopper, ContentRejectionDialog, LWTooltip, MetaInfo } = Components;
  const { content } = contentWrapper;

  const handleRejectContent = (reason: string) => {
    setShowRejectionDialog(false);
    rejectContent(reason);
  };
  
  return <span className={classes.rejectedIcon} {...eventHandlers}>
    {content.rejected && <span className={classes.rejectedButton} >
        <LWTooltip title="Undo rejection">
          <ReplayIcon className={classes.icon} onClick={unrejectContent}/>
        </LWTooltip>
    </span>}
    {!content.rejected && content.authorIsUnreviewed && <span className={classes.button}>
      <RejectedIcon className={classes.icon} onClick={() => setShowRejectionDialog(true)}/> <MetaInfo>Reject</MetaInfo>
    </span>}
    {showRejectionDialog && <ClickAwayListener onClickAway={() => setShowRejectionDialog(false)}>
      <LWPopper
        open={showRejectionDialog}
        anchorEl={anchorEl}
        className={classes.popper}
        clickable={true}
        allowOverflow={true}
        placement={"bottom-start"}
      >
        <ContentRejectionDialog rejectContent={handleRejectContent}/>
      </LWPopper>
    </ClickAwayListener>}
  </span>
}

const RejectContentButtonComponent = registerComponent('RejectContentButton', RejectContentButton, {styles});

declare global {
  interface ComponentTypes {
    RejectContentButton: typeof RejectContentButtonComponent
  }
}


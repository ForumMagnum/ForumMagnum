import React, {useState} from 'react';
import {Components, registerComponent} from '../../lib/vulcan-lib';
import RejectedIcon from "@material-ui/icons/NotInterested";
import ClickAwayListener from "@material-ui/core/ClickAwayListener";
import { useHover } from "../common/withHover";
import {useUpdate} from "../../lib/crud/withUpdate";
import { useRejectContent, RejectContentParams } from "../hooks/useRejectContent";

const styles = (theme: ThemeType): JssStyles => ({
  root: {}
});

export const RejectContentButton = ({contentWrapper, classes}: {
  contentWrapper: RejectContentParams
  classes: ClassesType,
}) => {
  
  const { eventHandlers, anchorEl } = useHover();
  const { rejectContent, unrejectContent } = useRejectContent(contentWrapper);
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const { LWPopper, ContentRejectionDialog } = Components;
  const { content } = contentWrapper;
  
  return <span className={classes.rejectedIcon} {...eventHandlers}>
    {content.rejected && <span className={classes.rejectedLabel} onClick={unrejectContent}>
      [Rejected]
    </span>}
    {!content.rejected && content.authorIsUnreviewed && <span className={classes.rejectedIcon}>
      <RejectedIcon onClick={() => setShowRejectionDialog(true)}/>
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
        <ContentRejectionDialog rejectContent={rejectContent}/>
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


import React, {useState} from 'react';
import {Components, registerComponent} from '../../lib/vulcan-lib';
import RejectedIcon from "@material-ui/icons/NotInterested";
import ClickAwayListener from "@material-ui/core/ClickAwayListener";
import { useHover } from "../common/withHover";
import { useRejectContent, RejectContentParams } from "../hooks/useRejectContent";

const styles = (theme: ThemeType): JssStyles => ({
  root: {}
});

export const RejectContentButton = ({contentWrapper, classNames}: {
  contentWrapper: RejectContentParams,
  classNames: ClassesType,
}) => {
  
  const { eventHandlers, anchorEl } = useHover();
  const { rejectContent, unrejectContent } = useRejectContent(contentWrapper);
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const { LWPopper, ContentRejectionDialog } = Components;
  const { content } = contentWrapper;

  const handleRejectContent = (reason: string) => {
    setShowRejectionDialog(false);
    rejectContent(reason);
  };
  
  return <span className={classNames.rejectedIcon} {...eventHandlers}>
    {content.rejected && <span className={classNames.rejectedLabel} onClick={unrejectContent}>
      [Rejected]
    </span>}
    {!content.rejected && content.authorIsUnreviewed && <span className={classNames.rejectedIcon}>
      <RejectedIcon onClick={() => setShowRejectionDialog(true)}/>
    </span>}
    {showRejectionDialog && <ClickAwayListener onClickAway={() => setShowRejectionDialog(false)}>
      <LWPopper
        open={showRejectionDialog}
        anchorEl={anchorEl}
        className={classNames.popper}
        clickable={true}
        allowOverflow={true}
        placement={"bottom-start"}
      >
        <ContentRejectionDialog rejectContent={handleRejectContent}/>
      </LWPopper>
    </ClickAwayListener>}
  </span>
}

const RejectContentButtonComponent = registerComponent('RejectContentButton', RejectContentButton);

declare global {
  interface ComponentTypes {
    RejectContentButton: typeof RejectContentButtonComponent
  }
}


import React, {useState} from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import RejectedIcon from "@/lib/vendor/@material-ui/icons/src/NotInterested";
import { useHover } from "../common/withHover";
import { useRejectContent, RejectContentParams } from "../hooks/useRejectContent";
import ReplayIcon from '@/lib/vendor/@material-ui/icons/src/Replay';
import LWPopper from "../common/LWPopper";
import LWClickAwayListener from "../common/LWClickAwayListener";
import RejectContentDialog from "./RejectContentDialog";
import LWTooltip from "../common/LWTooltip";
import MetaInfo from "../common/MetaInfo";

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

export default registerComponent('RejectContentButton', RejectContentButton, {styles});




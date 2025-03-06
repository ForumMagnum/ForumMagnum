import React, {useState} from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import RejectedIcon from "@material-ui/icons/NotInterested";
import { useHover } from "../common/withHover";
import { useRejectContent, RejectContentParams } from "../hooks/useRejectContent";
import ReplayIcon from '@material-ui/icons/Replay';
import LWPopper from "@/components/common/LWPopper";
import LWClickAwayListener from "@/components/common/LWClickAwayListener";
import RejectContentDialog from "@/components/sunshineDashboard/RejectContentDialog";
import LWTooltip from "@/components/common/LWTooltip";
import MetaInfo from "@/components/common/MetaInfo";

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

const RejectContentButtonComponent = registerComponent('RejectContentButton', RejectContentButton, {styles});

declare global {
  interface ComponentTypes {
    RejectContentButton: typeof RejectContentButtonComponent
  }
}

export default RejectContentButtonComponent;


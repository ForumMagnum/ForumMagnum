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
import { useDialog } from '../common/withDialog';

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
  const { rejectContent, unrejectContent, rejectionTemplates } = useRejectContent();
  const { openDialog } = useDialog();
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const { document } = contentWrapper;

  const handleRejectContent = (reason: string) => {
    setShowRejectionDialog(false);
    rejectContent({ reason, ...contentWrapper });
  };

  const openRejectionDialog = () => {
    openDialog({
      name: 'RejectContentDialog',
      contents: ({ onClose }) => (
        <RejectContentDialog
          rejectionTemplates={rejectionTemplates}
          rejectContent={handleRejectContent}
          onClose={onClose}
        />
      ),
    });
  };

  return <span {...eventHandlers}>
    {document.rejected && <span>
      <LWTooltip title="Undo rejection">
        <ReplayIcon className={classes.icon} onClick={() => unrejectContent({ ...contentWrapper })}/>
      </LWTooltip>
    </span>}
    {!document.rejected && document.authorIsUnreviewed && <span className={classes.button} onClick={openRejectionDialog}>
      <RejectedIcon className={classes.icon}/> <MetaInfo>Reject</MetaInfo>
    </span>}
    <LWPopper
      open={showRejectionDialog}
      anchorEl={anchorEl}
      clickable={true}
      allowOverflow={true}
      placement={"right-start"}
    >
      <LWClickAwayListener onClickAway={() => setShowRejectionDialog(false)}>
        <RejectContentDialog rejectionTemplates={rejectionTemplates} rejectContent={handleRejectContent}/>
      </LWClickAwayListener>
    </LWPopper>
  </span>
}

export default registerComponent('RejectContentButton', RejectContentButton, {styles});




import React from 'react';
import RejectedIcon from "@/lib/vendor/@material-ui/icons/src/NotInterested";
import { useRejectContent, RejectContentParams } from "../hooks/useRejectContent";
import ReplayIcon from '@/lib/vendor/@material-ui/icons/src/Replay';
import LWTooltip from "../common/LWTooltip";
import MetaInfo from "../common/MetaInfo";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('RejectContentButton', (theme: ThemeType) => ({
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
}));

export const RejectContentButton = ({contentWrapper, onReject}: {
  contentWrapper: RejectContentParams,
  /** Rejection UI to open. Without it, only the undo-rejection button is shown. */
  onReject?: () => void,
}) => {
  const classes = useStyles(styles);
  const { unrejectContent } = useRejectContent();
  const { document } = contentWrapper;

  return <span>
    {document.rejected && <span>
      <LWTooltip title="Undo rejection">
        <ReplayIcon className={classes.icon} onClick={() => unrejectContent({ ...contentWrapper })}/>
      </LWTooltip>
    </span>}
    {onReject && !document.rejected && document.authorIsUnreviewed && <span className={classes.button} onClick={onReject}>
      <RejectedIcon className={classes.icon}/> <MetaInfo>Reject</MetaInfo>
    </span>}
  </span>
}

export default RejectContentButton

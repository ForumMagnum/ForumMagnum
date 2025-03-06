import React from 'react';
import { Components, registerComponent } from '@/lib/vulcan-lib/components';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import DialogContent from '@material-ui/core/DialogContent';
import LWDialog from "@/components/common/LWDialog";

const styles = defineStyles("ArbitalImportRevisionDetails", (theme) => ({
  title: {
    marginTop: 0,
  },
  noticeBlock: {
    fontStyle: "italic",
    marginBottom: 16,
  },
  originalMarkdown: {
    whiteSpace: "pre-line",
  },
}));

const ArbitalImportRevisionDetails = ({onClose, revision}: {
  onClose: () => void,
  revision: RevisionHistoryEntry
}) => {
  const classes = useStyles(styles);

  return <LWDialog open={true} onClose={onClose}>
    <DialogContent>
      <h1 className={classes.title}>Imported from Arbital</h1>
      <div className={classes.noticeBlock}>
        This revision was imported from Arbital, where it was originally written in Markdown, shown below.
      </div>
      <div className={classes.originalMarkdown}>
        {revision.legacyData?.arbitalMarkdown}
      </div>
    </DialogContent>
  </LWDialog>
}

const ArbitalImportRevisionDetailsComponent = registerComponent('ArbitalImportRevisionDetails', ArbitalImportRevisionDetails);

declare global {
  interface ComponentTypes {
    ArbitalImportRevisionDetails: typeof ArbitalImportRevisionDetailsComponent
  }
}

export default ArbitalImportRevisionDetailsComponent;


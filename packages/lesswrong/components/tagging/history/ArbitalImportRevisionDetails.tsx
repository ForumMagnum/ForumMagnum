import React from 'react';
import { registerComponent } from '@/lib/vulcan-lib/components';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { DialogContent } from "@/components/widgets/DialogContent";
import { LWDialog } from "../../common/LWDialog";

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

const ArbitalImportRevisionDetailsInner = ({onClose, revision}: {
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

export const ArbitalImportRevisionDetails = registerComponent('ArbitalImportRevisionDetails', ArbitalImportRevisionDetailsInner);

declare global {
  interface ComponentTypes {
    ArbitalImportRevisionDetails: typeof ArbitalImportRevisionDetails
  }
}


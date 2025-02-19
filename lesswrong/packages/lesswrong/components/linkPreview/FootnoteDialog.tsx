import React from 'react';
import { Components, registerComponent } from '@/lib/vulcan-lib/components';

const styles = (theme: ThemeType) => ({
  dialogPaper: {
    marginTop: 48,
    marginBottom: 100,
    marginLeft: 18,
    marginRight: 18,
  },
  content: {
    margin: 16,
    
    "& .footnote-content": {
      width: "auto",
    },
    "& .footnote-back-link": {
      display: "none",
    },
  },
})

const FootnoteDialog = ({ footnoteHTML, onClose, classes }: {
  footnoteHTML: string,
  onClose: () => void,
  classes: ClassesType<typeof styles>
}) => {
  const { ContentStyles, LWDialog } = Components;

  return <LWDialog open onClose={onClose} dialogClasses={{ paper: classes.dialogPaper }}>
    <ContentStyles contentType="postHighlight" className={classes.content}>
      <div dangerouslySetInnerHTML={{__html: footnoteHTML || ""}} />
    </ContentStyles>
  </LWDialog>
}


const FootnoteDialogComponent = registerComponent('FootnoteDialog', FootnoteDialog, {styles});

declare global {
  interface ComponentTypes {
    FootnoteDialog: typeof FootnoteDialogComponent
  }
}


import React from 'react';
import { registerComponent } from '@/lib/vulcan-lib/components';
import ContentStyles from "../common/ContentStyles";
import LWDialog from "../common/LWDialog";

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
  return <LWDialog open onClose={onClose} paperClassName={classes.dialogPaper}>
    <ContentStyles contentType="postHighlight" className={classes.content}>
      <div dangerouslySetInnerHTML={{__html: footnoteHTML || ""}} />
    </ContentStyles>
  </LWDialog>
}


export default registerComponent('FootnoteDialog', FootnoteDialog, {styles});




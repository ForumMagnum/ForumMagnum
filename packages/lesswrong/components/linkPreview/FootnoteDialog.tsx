import React from 'react';
import ContentStyles from "../common/ContentStyles";
import LWDialog from "../common/LWDialog";
import { defineStyles } from '../hooks/defineStyles';
import { useStyles } from '../hooks/useStyles';

const styles = defineStyles("FootnoteDialog", (theme: ThemeType) => ({
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
}))

const FootnoteDialog = ({ footnoteHTML, onClose }: {
  footnoteHTML: string,
  onClose: () => void,
}) => {
  const classes = useStyles(styles);
  return <LWDialog open onClose={onClose} paperClassName={classes.dialogPaper}>
    <ContentStyles contentType="postHighlight" className={classes.content}>
      <div dangerouslySetInnerHTML={{__html: footnoteHTML || ""}} />
    </ContentStyles>
  </LWDialog>
}


export default FootnoteDialog;




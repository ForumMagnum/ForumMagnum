import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import Card from "@material-ui/core/Card";
import { useTagBySlug } from './useTag';
import { commentBodyStyles } from '../../themes/stylePiping';

const styles = (theme: ThemeType): JssStyles => ({
  dialog: {
    zIndex: theme.zIndexes.tagCTAPopup
  },
  body: {
    ...commentBodyStyles(theme),
  },
  popupCard: {
    padding: "20px",
    display: "flex",
    flexDirection: "column"
  }
});

// Makes its child a link (wrapping it in an <a> tag) which opens a login
// dialog.
const TagCTAPopup = ({onClose, classes}) => {
  const { ContentItemBody, LWDialog } = Components
  const { tag } = useTagBySlug("tag-cta-popup", "TagFragment")
  
  return (
    <LWDialog
      open={true}
      onClose={onClose}
      className={classes.dialog}
      dialogClasses={{
        paper: classes.paper
      }}
    >
      <Card className={classes.popupCard}>
        <ContentItemBody
          className={classes.body}
          dangerouslySetInnerHTML={{__html: tag?.description?.html || ""}}
          description={`tag ${tag?.name}`}
        />
      </Card>
    </LWDialog>
  );
}

const TagCTAPopupComponent = registerComponent('TagCTAPopup', TagCTAPopup, {styles});

declare global {
  interface ComponentTypes {
    TagCTAPopup: typeof TagCTAPopupComponent
  }
}

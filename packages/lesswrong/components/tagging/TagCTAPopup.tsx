import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import Dialog from '@material-ui/core/Dialog';
import Card from "@material-ui/core/Card";
import { useTagBySlug } from './useTag';
import Button from '@material-ui/core/Button';
import DialogActions from "@material-ui/core/DialogActions";
import {useCurrentUser} from "../common/withUser";
import {useUpdate} from "../../lib/crud/withUpdate";

const styles = (theme: ThemeType): JssStyles => ({
  dialog: {
    zIndex: theme.zIndexes.tagCTAPopup
  },
  paper: {
  },
  popupCard: {
    ...theme.typography.commentStyle,
    fontSize: "1.4rem",
    padding: "20px",
    display: "flex",
    flexDirection: "column"
    
  },
  dismissButton: {
    color: theme.palette.cancelButton,
    fontSize: "1.2rem",
    justifyContent: "flex-end"
  }
});

// Makes its child a link (wrapping it in an <a> tag) which opens a login
// dialog.
const TagCTAPopup = ({onClose, classes}) => {
  const { ContentItemBody } = Components
  const currentUser = useCurrentUser();
  const { mutate: updateUser } = useUpdate({
    collectionName: "Users",
    fragmentName: 'UsersCurrent',
  })
  const { tag } = useTagBySlug("tag-cta-popup", "TagFragment")
  
  return (
    <Dialog
      open={true}
      onClose={onClose}
      className={classes.dialog}
      classes={{
        paper: classes.paper
      }}
    >
      <Card className={classes.popupCard}>
        <ContentItemBody
          dangerouslySetInnerHTML={{__html: tag?.description?.html || ""}}
          description={`tag ${tag?.name}`}
        />
        {/*<Button */}
        {/*  className={classes.dismissButton}*/}
        {/*  onClick={async () => {*/}
        {/*    if (currentUser) {*/}
        {/*      void updateUser({*/}
        {/*        selector: {_id: currentUser._id},*/}
        {/*        data: {*/}
        {/*          ctaPopupDismissed: true*/}
        {/*        }*/}
        {/*      })*/}
        {/*    }*/}
        {/*    onClose*/}
        {/*  }}>*/}
        {/*  Don't show me again*/}
        {/*</Button>*/}
    </Card>
    </Dialog>
  );
}

const TagCTAPopupComponent = registerComponent('TagCTAPopup', TagCTAPopup, {styles});

declare global {
  interface ComponentTypes {
    TagCTAPopup: typeof TagCTAPopupComponent
  }
}

import { Components, registerComponent } from '../../lib/vulcan-lib';
import React, { useState } from 'react';
import Card from "@material-ui/core/Card";
import { useTagBySlug } from '../tagging/useTag';
import { commentBodyStyles } from '../../themes/stylePiping';
import { useUpdateCurrentUser } from '../hooks/useUpdateCurrentUser';
import { useMessages } from '../common/withMessages';
import Button from '@material-ui/core/Button'

const styles = (theme: ThemeType): JssStyles => ({
  dialog: {
    zIndex: theme.zIndexes.afNonMemberPopup
  },
  body: {
    ...commentBodyStyles(theme),
  },
  popupCard: {
    padding: 30,
    display: "flex",
    flexDirection: "column",
  },
  buttonContainer: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: 16
  },
  understandConfirmationButton: {
    fontSize: "1rem"
  }
});

// Makes its child a link (wrapping it in an <a> tag) which opens a login
// dialog.
const AFNonMemberInitialPopup = ({onClose, classes}: {
  onClose: ()=>void,
  classes: ClassesType,
}) => {
  const updateCurrentUser = useUpdateCurrentUser();
  const { flash } = useMessages();
  const [open, setOpen] = useState(true)
  const { ContentItemBody, LWDialog } = Components
  const { tag } = useTagBySlug("af-non-member-popup-first", "TagFragment")
  
  const handleClose = () => {
    setOpen(false)
    onClose()
  };

  return (
    <LWDialog
      open={open}
      onClose={handleClose}
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
        <div className={classes.buttonContainer}>
          <Button className={classes.understandConfirmationButton} color="primary" onClick={() => {
            void updateCurrentUser({hideAFNonMemberInitialWarning: true}) 
            flash({messageString: "Alignment Forum posting policy acknowledged"});
            handleClose()
          }}>
            I understand (don't show again)
          </Button>
        </div>
      </Card>
    </LWDialog>
  );
}

const AFNonMemberInitialPopupComponent = registerComponent('AFNonMemberInitialPopup', AFNonMemberInitialPopup, {styles});

declare global {
  interface ComponentTypes {
    AFNonMemberInitialPopup: typeof AFNonMemberInitialPopupComponent
  }
}

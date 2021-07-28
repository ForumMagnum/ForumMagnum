
import { Components, registerComponent } from '../../lib/vulcan-lib';
import React, { useState } from 'react';
import Card from "@material-ui/core/Card";
import { useTagBySlug } from '../tagging/useTag';
import { commentBodyStyles } from '../../themes/stylePiping';
import { useUpdateCurrentUser } from '../hooks/useUpdateCurrentUser';
import { useMessages } from '../common/withMessages';

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
const AFNonMemberSuccessPopup = ({_id, postId, onClose, classes}: {
  _id: string,
  postId: string | null,
  onClose: ()=>void,
  classes: ClassesType,
}) => {
  const updateCurrentUser = useUpdateCurrentUser();
  const { flash } = useMessages();
  const [open, setOpen] = useState(true)
  const { ContentItemBody, LWDialog, Button } = Components
  const { tag } = useTagBySlug("af-non-member-submission-success", "TagFragment")
  
  const handleClose = () => {
    setOpen(false)
    onClose()
  };
  
  
  const submissionIsComment = !!postId 
  
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
        <Button className={classes.goToLW}>
          <a href={submissionIsComment ? `https://www.lesswrong.com/${postId}#${_id}`: `https://www.lesswrong.com/${_id}`}>
            {`Take me to my ${submissionIsComment ? "comment" : "post"} on LessWrong.`}
          </a>
        </Button>
        <Button className={classes.stayHere} onClick={() => {
          handleClose()
        }}>
          <strong>No thanks, I'll stay here.</strong>
        </Button>
      </Card>
    </LWDialog>
  );
}

const AFNonMemberSuccessPopupComponent = registerComponent('AFNonMemberSuccessPopup', AFNonMemberSuccessPopup, {styles});

declare global {
  interface ComponentTypes {
    AFNonMemberSuccessPopup: typeof AFNonMemberSuccessPopupComponent
  }
}

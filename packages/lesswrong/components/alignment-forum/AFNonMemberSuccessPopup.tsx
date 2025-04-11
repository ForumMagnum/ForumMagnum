import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import React, { useState } from 'react';
import { Card } from "@/components/widgets/Paper";
import { useTagBySlug } from '../tagging/useTag';
import Button  from '@/lib/vendor/@material-ui/core/src/Button'

const styles = (theme: ThemeType) => ({
  dialog: {
    zIndex: theme.zIndexes.afNonMemberPopup
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
  goToLWButton: {
    color: theme.palette.secondary.main,
  },
  stayHereButton: {
   color: theme.palette.grey[600]
  }
});

// Makes its child a link (wrapping it in an <a> tag) which opens a login
// dialog.
const AFNonMemberSuccessPopup = ({_id, postId, onClose, classes}: {
  _id: string,
  postId?: string,
  onClose?: () => void,
  classes: ClassesType<typeof styles>,
}) => {
  const [open, setOpen] = useState(true)
  const { ContentItemBody, LWDialog, ContentStyles } = Components
  const { tag } = useTagBySlug("af-non-member-submission-success", "TagFragment")
  
  const handleClose = () => {
    setOpen(false)
    if (onClose)
      onClose();
  };
  
  
  const submissionIsComment = !!postId 
  
  return (
    <LWDialog
      open={open}
      onClose={handleClose}
      className={classes.dialog}
    >
      <Card className={classes.popupCard}>
        <ContentStyles contentType="comment">
          <ContentItemBody
            dangerouslySetInnerHTML={{__html: tag?.description?.html || ""}}
            description={`tag ${tag?.name}`}
          />
        </ContentStyles>
        <div className={classes.buttonContainer}>
          <Button className={classes.stayHereButton} onClick={() => {
            handleClose()
          }}>
            I'll stay here
          </Button>
          <Button color="primary">
            <a href={submissionIsComment ? `https://www.lesswrong.com/posts/${postId}#${_id}`: `https://www.lesswrong.com/posts/${_id}`}>
              {`Take me to my ${submissionIsComment ? "comment" : "post"} on LessWrong`}
            </a>
          </Button>
        </div>
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

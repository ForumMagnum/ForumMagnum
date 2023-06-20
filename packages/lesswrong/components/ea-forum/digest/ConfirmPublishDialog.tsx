import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import DialogContent from '@material-ui/core/DialogContent';
import Button from '@material-ui/core/Button';
import DialogActions from '@material-ui/core/DialogActions';
import { useUpdate } from '../../../lib/crud/withUpdate';


const styles = (theme: ThemeType): JssStyles => ({
  root: {
    padding: '10px 20px 20px 10px'
  },
  text: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    lineHeight: '24px',
  },
  heading: {
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 14
  },
  btn: {
    fontSize: 14,
    textTransform: 'none',
    boxShadow: 'none'
  },
})

const ConfirmPublishDialog = ({ digest, onClose, classes }: {
  digest: DigestsMinimumInfo,
  onClose?: () => void,
  classes: ClassesType,
}) => {
  const { mutate: updateDigest } = useUpdate({
    collectionName: 'Digests',
    fragmentName: 'DigestsMinimumInfo',
  })

  const handlePublish = () => {
    // this dialog should only appear if the digest has never been published,
    // so we need to set its endDate as well
    const now = new Date()
    void updateDigest({
      selector: {_id: digest._id},
      data: {
        publishedDate: now,
        endDate: now
      }
    })
    onClose?.()
  }

  return (
    <Components.LWDialog open onClose={onClose} dialogClasses={{paper: classes.root}}>
      <DialogContent className={classes.text}>
        <div className={classes.heading}>
          Are you sure you want to publish this digest?
        </div>
        <div>
          That will set the cut-off date for this digest and automatically set up the next one.
          You can still add / remove posts from this digest after it's published.
        </div>
      </DialogContent>
      <DialogActions>
        <Button
          variant="outlined"
          color="primary"
          onClick={onClose}
          className={classes.btn}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handlePublish}
          className={classes.btn}
        >
          Publish
        </Button>
      </DialogActions>
    </Components.LWDialog>
  )
}

const ConfirmPublishDialogComponent = registerComponent('ConfirmPublishDialog', ConfirmPublishDialog, {styles});

declare global {
  interface ComponentTypes {
    ConfirmPublishDialog: typeof ConfirmPublishDialogComponent
  }
}

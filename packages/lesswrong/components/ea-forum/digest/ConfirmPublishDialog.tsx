import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import DialogContent from '@material-ui/core/DialogContent';
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
  textSection: {
    marginTop: 12
  }
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
    // Set the publishedDate, and also set the endDate if it doesn't have one yet
    const now = new Date()
    void updateDigest({
      selector: {_id: digest._id},
      data: {
        publishedDate: now,
        endDate: !digest.endDate ? now : undefined
      }
    })
    onClose?.()
  }
  
  const { LWDialog, EAButton } = Components

  return (
    <LWDialog open onClose={onClose} dialogClasses={{paper: classes.root}}>
      <DialogContent className={classes.text}>
        <div className={classes.heading}>
          Are you sure you want to publish this digest?
        </div>
        <div>
          That will make this week's on-site digest publicly accessible.
          You can still select / unselect posts from the table after publishing.
        </div>
        {!digest.endDate && <div className={classes.textSection}>
          It will also set the cut-off date for this digest and automatically set up the next one.
        </div>}
      </DialogContent>
      <DialogActions>
        <EAButton variant="outlined" onClick={onClose}>
          Cancel
        </EAButton>
        <EAButton onClick={handlePublish}>
          Publish
        </EAButton>
      </DialogActions>
    </LWDialog>
  )
}

const ConfirmPublishDialogComponent = registerComponent('ConfirmPublishDialog', ConfirmPublishDialog, {styles});

declare global {
  interface ComponentTypes {
    ConfirmPublishDialog: typeof ConfirmPublishDialogComponent
  }
}

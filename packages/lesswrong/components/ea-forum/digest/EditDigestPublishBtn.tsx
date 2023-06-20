import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib';
import { useUpdate } from '../../../lib/crud/withUpdate';
import Button from '@material-ui/core/Button';
import { useDialog } from '../../common/withDialog';

const styles = (theme: ThemeType): JssStyles => ({
  publishBtn: {
    fontSize: 14,
    textTransform: 'none',
    boxShadow: 'none'
  },
})


const EditDigestPublishBtn = ({digest, classes} : {
  digest: DigestsMinimumInfo,
  classes: ClassesType
}) => {
  const { openDialog } = useDialog()
  const isPublished = !!digest.publishedDate
  
  const { mutate: updateDigest } = useUpdate({
    collectionName: 'Digests',
    fragmentName: 'DigestsMinimumInfo',
  })
  
  /**
   * If the digest has been published before, set or unset the publishedDate.
   * Otherwise, open the publish confirmation dialog.
   */
  const handleBtnClick = () => {
    // if the digest has an endDate set, then we know it's already been published
    if (digest.endDate) {
      void updateDigest({
        selector: {_id: digest._id},
        data: {
          publishedDate: isPublished ? null : new Date()
        }
      })
    } else {
      openDialog({
        componentName: 'ConfirmPublishDialog',
        componentProps: {digest}
      })
    }
  }

  return (
    <Button
      variant={isPublished ? 'outlined' : 'contained'}
      color="primary"
      onClick={handleBtnClick}
      className={classes.publishBtn}
    >
      {isPublished ? 'Unpublish' : 'Publish'}
    </Button>
  )
}

const EditDigestPublishBtnComponent = registerComponent('EditDigestPublishBtn', EditDigestPublishBtn, {styles});

declare global {
  interface ComponentTypes {
    EditDigestPublishBtn: typeof EditDigestPublishBtnComponent
  }
}

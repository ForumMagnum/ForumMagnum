import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { useUpdate } from '../../../lib/crud/withUpdate';
import { useDialog } from '../../common/withDialog';

const styles = (theme: ThemeType): JssStyles => ({
  tooltipSection: {
    marginTop: 8
  }
})


const EditDigestActionButtons = ({digest, classes}: {
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
   * Set the end date for this digest. A callback will automatically create the next digest.
   */
  const handleStartNewWeek = () => {
    void updateDigest({
      selector: {_id: digest._id},
      data: {
        endDate: new Date()
      }
    })
  }
  
  /**
   * If the digest is published, unset the publishedDate.
   * Otherwise, open the publish confirmation dialog.
   */
  const handlePublish = () => {
    if (isPublished) {
      void updateDigest({
        selector: {_id: digest._id},
        data: {
          publishedDate: null
        }
      })
    } else {
      openDialog({
        componentName: 'ConfirmPublishDialog',
        componentProps: {digest}
      })
    }
  }
  
  const { EAButton, LWTooltip } = Components

  return <>
    {!digest.endDate && <LWTooltip
      title="This sets the cut-off date for this digest and automatically sets up the next digest."
    >
      <EAButton variant='outlined' onClick={handleStartNewWeek}>
        Start new week
      </EAButton>
    </LWTooltip>}

    <LWTooltip
      title={!isPublished ? <>
        <div>
          Click when you're ready for this week's on-site digest to be public.
        </div>
        <div className={classes.tooltipSection}>
          You can still change which posts are in the digest, even after publishing.
          You can also un-publish and later re-publish a digest.
        </div>
      </> : 'Click to unpublish the on-site digest.'}
    >
      <EAButton variant={isPublished ? 'outlined' : 'contained'} onClick={handlePublish}>
        {isPublished ? 'Unpublish' : 'Publish'}
      </EAButton>
    </LWTooltip>
  </>
}

const EditDigestActionButtonsComponent = registerComponent('EditDigestActionButtons', EditDigestActionButtons, {styles});

declare global {
  interface ComponentTypes {
    EditDigestActionButtons: typeof EditDigestActionButtonsComponent
  }
}

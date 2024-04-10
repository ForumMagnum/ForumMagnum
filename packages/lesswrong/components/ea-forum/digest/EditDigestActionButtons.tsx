import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { useUpdate } from '../../../lib/crud/withUpdate';
import { useDialog } from '../../common/withDialog';

const styles = (theme: ThemeType): JssStyles => ({
  questionMark: {
    alignSelf: 'center',
    color: theme.palette.grey[600]
  },
  questionMarkIcon: {
    fontSize: 20
  },
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
   * If the digest has been published before, set or unset the publishedDate.
   * Otherwise, open the publish confirmation dialog.
   */
  const handlePublish = () => {
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
  
  const { EAButton, LWTooltip, ForumIcon } = Components

  return <>
    {!digest.endDate && <LWTooltip title="This sets the cut-off date for this digest and automatically sets up the next digest.">
      <EAButton variant='outlined' onClick={handleStartNewWeek}>
        Start new week
      </EAButton>
    </LWTooltip>}
  
    {/* TODO: Update this if/when we add an on-site version of the digest
    <EAButton variant={isPublished ? 'outlined' : 'contained'} onClick={handlePublish}>
      {isPublished ? 'Unpublish' : 'Publish'}
    </EAButton>

    <LWTooltip
      title={<>
        <div>
          Don't worry, it's totally safe to click the "Publish" button!
        </div>
        <div className={classes.tooltipSection}>
          If the digest has never been published, clicking the button will bring up a confirmation modal.
          Clicking "Publish" in there sets the cut-off date for this digest
          (which determines which posts are eligible to appear in the table),
          and automatically sets up the next digest.
        </div>
        <div className={classes.tooltipSection}>
          Both unpublishing and re-publishing do nothing. You can always change whether or not
          the posts in this table are in the digest, even after publishing.
        </div>
      </>}
      className={classes.questionMark}
    >
      <ForumIcon icon="QuestionMarkCircle" className={classes.questionMarkIcon} />
    </LWTooltip> */}
  </>
}

const EditDigestActionButtonsComponent = registerComponent('EditDigestActionButtons', EditDigestActionButtons, {styles});

declare global {
  interface ComponentTypes {
    EditDigestActionButtons: typeof EditDigestActionButtonsComponent
  }
}

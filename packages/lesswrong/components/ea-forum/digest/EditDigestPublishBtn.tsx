import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib';
import { useUpdate } from '../../../lib/crud/withUpdate';
import Button from '@material-ui/core/Button';

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
  const { mutate: updateDigest } = useUpdate({
    collectionName: 'Digests',
    fragmentName: 'DigestsMinimumInfo',
  })
  
  /**
   * Set or unset the digest's publish date
   */
  const handlePublish = () => {
    // if we're publishing the digest and it has no end date,
    // set the end date as well
    const now = new Date()
    void updateDigest({
      selector: {_id: digest._id},
      data: {
        publishedDate: digest.publishedDate ? null : now,
        ...(!digest.publishedDate && !digest.endDate && {endDate: now})
      }
    })
  }
  
  // TODO: warning on publish

  return (
    <Button
      variant={digest.publishedDate ? 'outlined' : 'contained'}
      color="primary"
      onClick={handlePublish}
      className={classes.publishBtn}
    >
      {digest.publishedDate ? 'Unpublish' : 'Publish'}
    </Button>
  )
}

const EditDigestPublishBtnComponent = registerComponent('EditDigestPublishBtn', EditDigestPublishBtn, {styles});

declare global {
  interface ComponentTypes {
    EditDigestPublishBtn: typeof EditDigestPublishBtnComponent
  }
}

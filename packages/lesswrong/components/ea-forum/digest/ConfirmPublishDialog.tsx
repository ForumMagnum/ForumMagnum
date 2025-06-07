import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import { DialogActions } from '@/components/widgets/DialogActions';
import { DialogContent } from '../../widgets/DialogContent';
import LWDialog from "../../common/LWDialog";
import EAButton from "../EAButton";
import { useMutation } from "@apollo/client";
import { gql } from "@/lib/crud/wrapGql";

const DigestsMinimumInfoUpdateMutation = gql(`
  mutation updateDigestConfirmPublishDialog($selector: SelectorInput!, $data: UpdateDigestDataInput!) {
    updateDigest(selector: $selector, data: $data) {
      data {
        ...DigestsMinimumInfo
      }
    }
  }
`);

const styles = (theme: ThemeType) => ({
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
})

const ConfirmPublishDialog = ({ digest, onClose, classes }: {
  digest: DigestsMinimumInfo,
  onClose?: () => void,
  classes: ClassesType<typeof styles>,
}) => {
  const [updateDigest] = useMutation(DigestsMinimumInfoUpdateMutation);

  const handlePublish = () => {
    // this dialog should only appear if the digest has never been published,
    // so we need to set its endDate as well
    const now = new Date()
    void updateDigest({
      variables: {
        selector: { _id: digest._id },
        data: {
          publishedDate: now,
          endDate: now
        }
      }
    })
    onClose?.()
  }
  return (
    <LWDialog open onClose={onClose} paperClassName={classes.root}>
      <DialogContent className={classes.text}>
        <div className={classes.heading}>
          Are you sure you want to publish this digest?
        </div>
        <div>
          That will set the cut-off date for this digest and automatically set up the next one.
          You can still select / unselect posts from the table after publishing.
        </div>
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

export default registerComponent('ConfirmPublishDialog', ConfirmPublishDialog, {styles});



import { useMessages } from '../common/withMessages';
import React from 'react';
import { useCurrentUser } from '../common/withUser';
import DialogContent from '@material-ui/core/DialogContent';
import { useNavigate } from '../../lib/routeUtil';
import { Components, registerComponent } from "../../lib/vulcan-lib/components";


const styles = (theme: ThemeType) => ({
  localGroupForm: {
    "& div": {
      fontFamily: theme.typography.fontFamily,
    },
    "& .editor": {
      minHeight: 50,
      fontSize: "1.1rem",
      position: "relative",
    },
    "& .form-submit": {
      marginTop: 10,
      textAlign: "right",
    },
    "& .form-component-select": {
      "& .col-sm-9": {
        width: "100%",
        padding: 0,
      },
      "& label": {
        display: "none",
      },
      "& .form-component-clear": {
        display: "none"
      },
    },
  },
});

const GroupFormDialog =  ({ onClose, classes, documentId, isOnline }: {
  onClose: () => void,
  classes: ClassesType<typeof styles>,
  documentId?: string,
  isOnline?: boolean
}) => {
  const {WrappedSmartForm, LWDialog, GroupFormSubmit} = Components;
  const currentUser = useCurrentUser();
  const { flash } = useMessages();
  const navigate = useNavigate();
  return <LWDialog
    open={true}
    onClose={onClose}
  >
    <DialogContent className={classes.localGroupForm}>
      <WrappedSmartForm
        collectionName="Localgroups"
        documentId={documentId}
        queryFragmentName={'localGroupsEdit'}
        mutationFragmentName={'localGroupsHomeFragment'}
        formComponents={{
          FormSubmit: GroupFormSubmit
        }}
        prefilledProps={documentId ? {} : {organizerIds: [currentUser!._id], isOnline: isOnline}} // If edit form, do not prefill any data
        successCallback={(group: any) => {
          onClose();
          if (documentId) {
            flash({messageString: "Successfully edited local group " + group.name});
          } else {
            flash({messageString: "Successfully created new local group " + group.name})
            navigate({pathname: '/groups/' + group._id});
          }
        }}
      />
    </DialogContent>
  </LWDialog>
}

const GroupFormDialogComponent = registerComponent('GroupFormDialog', GroupFormDialog, {styles});

declare global {
  interface ComponentTypes {
    GroupFormDialog: typeof GroupFormDialogComponent
  }
}


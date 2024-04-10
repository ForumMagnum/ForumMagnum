import { Components, registerComponent, getFragment } from '../../lib/vulcan-lib';
import { useMessages } from '../common/withMessages';
import React from 'react';
import { useCurrentUser } from '../common/withUser';
import DialogContent from '@material-ui/core/DialogContent';
import { withStyles, createStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Tooltip from '@material-ui/core/Tooltip';
import classNames from 'classnames';
import { useNavigate } from '../../lib/reactRouterWrapper';

const styles = createStyles((theme: ThemeType): JssStyles => ({
  root: {
    display: 'flex',
    marginTop: 20
  },
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
  inactiveButton: {
    '&&': {
      color: theme.palette.error.main,
    }
  },
  submit: {
    '&&': {
      marginLeft: 'auto'
    }
  },
  formButton: {
    paddingBottom: "2px",
    fontSize: "16px",
    marginLeft: "5px",
    "&:hover": {
      background: theme.palette.panelBackground.darken05,
    },
    color: theme.palette.lwTertiary.main
  },
}))

const SubmitComponent = withStyles(styles, {name: "GroupFormLinkSubmit"})(({submitLabel = "Submit", classes, updateCurrentValues, document, formType}: {
  submitLabel?: string,
  classes: ClassesType,
  updateCurrentValues: any,
  document: any,
  formType: string,
}) => 
{
  return <div className={classes.root}>
    {formType === 'edit' && <Tooltip title={document.inactive ? "Display the group on maps and lists again" : "This will hide the group from all maps and lists"}>
      <Button
        type="submit"
        onClick={() => updateCurrentValues({inactive: !document.inactive})}
        className={classNames(classes.formButton, classes.inactiveButton)}
      >
       {document.inactive ? "Reactivate group" : "Mark group as inactive"} 
      </Button>
    </Tooltip>}
    
    <Button
      type="submit"
      className={classNames(classes.formButton, classes.submit)}
    >
      {submitLabel}
    </Button>
  </div>
})

const GroupFormDialog =  ({ onClose, classes, documentId, isOnline }: {
  onClose: () => void,
  classes: ClassesType,
  documentId?: string,
  isOnline?: boolean
}) => {
  const { WrappedSmartForm, LWDialog } = Components
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
        queryFragment={getFragment('localGroupsEdit')}
        mutationFragment={getFragment('localGroupsHomeFragment')}
        formComponents={{
          FormSubmit: SubmitComponent
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


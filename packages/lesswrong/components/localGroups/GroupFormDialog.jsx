import { Components, registerComponent, getFragment, withMessages } from 'meteor/vulcan:core';
import React from 'react';
import { Localgroups } from '../../lib/index.js';
import { withNavigation } from '../../lib/routeUtil'
import withUser from '../common/withUser';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Tooltip from '@material-ui/core/Tooltip';
import classNames from 'classnames';
import withDialog from '../common/withDialog'

const styles = theme => ({
  root: {
    display: 'flex',
    marginTop: 20
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
      background: "rgba(0,0,0, 0.05)",
    },
    color: theme.palette.lwTertiary.main
  },
})

const SubmitComponent = withStyles(styles, {name: "GroupFormLinkSubmit"})(({submitLabel = "Submit", classes, updateCurrentValues, document, formType}) => 
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

const GroupFormDialog =  ({ onClose, currentUser, classes, documentId, history, flash }) => {
  const { WrappedSmartForm } = Components
  return <Dialog
    open={true}
    modal={false}
    onClose={onClose}
  >
    <DialogContent className="local-group-form">
      <WrappedSmartForm
        collection={Localgroups}
        documentId={documentId}
        queryFragment={getFragment('localGroupsEdit')}
        mutationFragment={getFragment('localGroupsHomeFragment')}
        formComponents={{
          FormSubmit: SubmitComponent
        }}
        prefilledProps={documentId ? {} : {organizerIds: [currentUser._id]}} // If edit form, do not prefill organizerIds
        successCallback={group => {
          onClose();
          if (documentId) {
            flash({messageString: "Successfully edited local group " + group.name});
          } else {
            flash({messageString: "Successfully created new local group " + group.name})
            history.push({pathname: '/groups/' + group._id});
          }
        }}
      />
    </DialogContent>
  </Dialog>
}

registerComponent('GroupFormDialog', GroupFormDialog, withUser, withMessages, withNavigation, withDialog);

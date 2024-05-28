import { Components, registerComponent, getFragment } from '../../lib/vulcan-lib';
import React from 'react';
import classNames from 'classnames';

export const styles = (theme: ThemeType): JssStyles => ({
  newOrEditForm: {
    maxWidth: 695,
    marginLeft: "auto",
    marginRight: 90,
    padding: 15,
    borderRadius: 2,
    marginBottom: "2em",
  
    "& form": {
      clear: "both",
      overflow: "auto",
    },
    "& .form-submit": {
      float: "right",
    },
    "& h3": {
      fontSize: "2em",
      marginBottom: "1em",
    },
    "& label.control-label": {
      display: "none",
    },
    "& .col-sm-9": {
      padding: 0,
    },
    "& .input-title input": {
      fontSize: "2em",
    },
  },
  editForm: {
    width: 700,
    marginLeft: "auto",
    marginRight: 75,
  },
  newForm: {
    border: theme.palette.border.normal,
  },
});

const CollectionsEditForm = ({documentId, successCallback, cancelCallback, classes}: {
  documentId: string,
  successCallback: any,
  cancelCallback: any,
  classes: ClassesType,
}) => {
  return (
    <div className={classNames(classes.newOrEditForm,classes.editForm)}>
      <Components.WrappedSmartForm
        collectionName="Collections"
        documentId={documentId}
        successCallback={successCallback}
        cancelCallback={cancelCallback}
        showRemove={true}
        queryFragment={getFragment('CollectionsEditFragment')}
        mutationFragment={getFragment('CollectionsPageFragment')}
      />
    </div>
  )
}

const CollectionsEditFormComponent = registerComponent('CollectionsEditForm', CollectionsEditForm, {styles});

declare global {
  interface ComponentTypes {
    CollectionsEditForm: typeof CollectionsEditFormComponent
  }
}


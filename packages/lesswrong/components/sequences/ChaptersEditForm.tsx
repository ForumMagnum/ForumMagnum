import { Components, registerComponent, getFragment } from '../../lib/vulcan-lib';
import React from 'react';
import Chapters from '../../lib/collections/chapters/collection';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    padding: theme.spacing.unit
  },
  title: {
    ...theme.typography.display1,
    ...theme.typography.commentStyle
  }
})
//TODO: Manage chapter removal to remove the reference from all parent-sequences

const ChaptersEditForm = ({classes, documentId, successCallback, cancelCallback}: {
  classes: ClassesType,
  documentId: string,
  successCallback: any,
  cancelCallback: any,
}) => {
  return (
    <div className={classes.root}>
      <h3 className={classes.title}>Add/Remove Posts</h3>
      <Components.WrappedSmartForm
        collection={Chapters}
        documentId={documentId}
        successCallback={successCallback}
        cancelCallback={cancelCallback}
        showRemove={true}
        queryFragment={getFragment('ChaptersEdit')}
        mutationFragment={getFragment('ChaptersEdit')}
      />
    </div>
  )
}

const ChaptersEditFormComponent = registerComponent('ChaptersEditForm', ChaptersEditForm, {styles});

declare global {
  interface ComponentTypes {
    ChaptersEditForm: typeof ChaptersEditFormComponent
  }
}


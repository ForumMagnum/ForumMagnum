import { Components, registerComponent, getFragment } from '../../lib/vulcan-lib';
import React, { useCallback, useState } from 'react';
import Chapters from '../../lib/collections/chapters/collection';
import { useDialog } from '../common/withDialog';
import Button from '@material-ui/core/Button';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    padding: theme.spacing.unit
  },
  title: {
    ...theme.typography.display1,
    ...theme.typography.commentStyle
  },
  addDraftButton: {
    float: "right",
    position: "relative",
    top: "-2.9em",
    right: "1.1em"
  }
})
//TODO: Manage chapter removal to remove the reference from all parent-sequences

const ChaptersEditForm = ({classes, documentId, postIds, successCallback, cancelCallback}: {
  classes: ClassesType,
  documentId: string,
  postIds: string[],
  successCallback: any,
  cancelCallback: any,
}) => {
  const { openDialog } = useDialog();

  const showAddDraftPostDialog = () => {
    openDialog({
      componentName: "AddDraftPostDialog",
      componentProps: {
        documentId: documentId,
        postIds: postIds,
      }
    });
  }

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
      <Button color="primary" className={classes.addDraftButton} onClick={showAddDraftPostDialog}>Add draft post</Button>
    </div>
  )
}

const ChaptersEditFormComponent = registerComponent('ChaptersEditForm', ChaptersEditForm, {styles});

declare global {
  interface ComponentTypes {
    ChaptersEditForm: typeof ChaptersEditFormComponent
  }
}


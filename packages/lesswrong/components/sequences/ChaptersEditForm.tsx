import React, { useCallback, useState } from 'react';
import { useDialog } from '../common/withDialog';
import Button from '@material-ui/core/Button';
import isEqual from 'lodash/isEqual';
import { useMessages } from "../common/withMessages";
import classNames from 'classnames';
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { getFragment } from "../../lib/vulcan-lib/fragments";

const styles = (theme: ThemeType) => ({
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
  },
  disabled: {
    opacity: 0.3,
  }
})
//TODO: Manage chapter removal to remove the reference from all parent-sequences

const ChaptersEditForm = ({classes, documentId, postIds, successCallback, cancelCallback}: {
  classes: ClassesType<typeof styles>,
  documentId: string,
  postIds: string[],
  successCallback: any,
  cancelCallback: any,
}) => {
  const { openDialog } = useDialog();
  const [saved, setSaved] = useState(true);
  const { flash } = useMessages();

  const changeCallback = useCallback((doc: ChaptersFragment) => {
    setSaved(isEqual(doc.postIds, postIds));
  }, [postIds]);


  const showAddDraftPostDialog = () => {
    if (saved) {
      openDialog({
        componentName: "AddDraftPostDialog",
        componentProps: {
          documentId: documentId,
          postIds: postIds,
        }
      });
    } else {
      flash("Save your changes before adding draft posts.")
    }
  }

  return (
    <div className={classes.root}>
      <h3 className={classes.title}>Add/Remove Posts</h3>
      <Components.WrappedSmartForm
        collectionName="Chapters"
        documentId={documentId}
        successCallback={successCallback}
        cancelCallback={cancelCallback}
        changeCallback={changeCallback}
        showRemove={true}
        queryFragment={getFragment('ChaptersEdit')}
        mutationFragment={getFragment('ChaptersEdit')}
      />
      <Button color="primary" className={classNames(
        classes.addDraftButton,
        {[classes.disabled]: !saved}
      )} onClick={showAddDraftPostDialog}>Add draft post</Button>
    </div>
  )
}

const ChaptersEditFormComponent = registerComponent('ChaptersEditForm', ChaptersEditForm, {styles});

declare global {
  interface ComponentTypes {
    ChaptersEditForm: typeof ChaptersEditFormComponent
  }
}


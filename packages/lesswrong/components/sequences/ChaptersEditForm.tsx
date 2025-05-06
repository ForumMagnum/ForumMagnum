import React, { useCallback, useState } from 'react';
import { useDialog } from '../common/withDialog';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import isEqual from 'lodash/isEqual';
import { useMessages } from "../common/withMessages";
import classNames from 'classnames';
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { ChaptersForm } from './ChaptersForm';

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

const ChaptersEditForm = ({classes, chapter, successCallback, cancelCallback}: {
  classes: ClassesType<typeof styles>,
  chapter: ChaptersEdit,
  successCallback: any,
  cancelCallback: any,
}) => {
  const { openDialog } = useDialog();
  const [saved, setSaved] = useState(true);
  const { flash } = useMessages();

  const changeCallback = useCallback((newPostIds: string[]) => {
    setSaved(isEqual(newPostIds, chapter.postIds));
  }, [chapter.postIds]);

  const showAddDraftPostDialog = () => {
    if (saved) {
      openDialog({
        name: "AddDraftPostDialog",
        contents: ({onClose}) => <Components.AddDraftPostDialog
          onClose={onClose}
          documentId={chapter._id}
          postIds={chapter.postIds}
        />
      });
    } else {
      flash("Save your changes before adding draft posts.")
    }
  }

  return (
    <div className={classes.root}>
      <h3 className={classes.title}>Add/Remove Posts</h3>
      <ChaptersForm
        initialData={chapter}
        onSuccess={successCallback}
        onCancel={cancelCallback}
        onPostIdsChanged={changeCallback}
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


import { Components, registerComponent, getFragment } from 'meteor/vulcan:core';
import { withMessages } from '../common/withMessages';
import React from 'react';
import Chapters from '../../lib/collections/chapters/collection';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  root: {
    padding: theme.spacing.unit
  },
  title: {
    ...theme.typography.display1,
    ...theme.typography.commentStyle
  }
})
//TODO: Manage chapter removal to remove the reference from all parent-sequences

const ChaptersEditForm = ({classes, documentId, successCallback, cancelCallback}) => {
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

registerComponent('ChaptersEditForm', ChaptersEditForm, withMessages, withStyles(styles, {name:"ChaptersEditForm"}));

import { Components, registerComponent, withDocument} from 'meteor/vulcan:core';
import Sequences from '../../lib/collections/sequences/collection.js';
import React from 'react';
import DragIcon from '@material-ui/icons/DragHandle';
import RemoveIcon from '@material-ui/icons/Close';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  title: {
    display: "inline",
    marginRight: 10,
    fontVariant: "small-caps",
    fontSize: 20,
    lineHeight: 1.25,
  },
  meta: {
    display: "inline-block",
    color: "rgba(0,0,0,0.5)",
    "& div": {
      display: "inline-block",
      marginRight: 5,
    }
  },
});

const SequencesListEditorItem = ({document, loading, documentId, classes, ...props}) => {
  if (document && !loading) {
    return <div>
      <DragIcon className="drag-handle"/>
      <div className="sequences-list-edit-item-box">
        <div className={classes.title}>
          {document.title || "Undefined Title"}
        </div>
        <div className={classes.meta}>
          <div className="sequences-list-edit-item-author">
            {(document.user && document.user.displayName) || "Undefined Author"}
          </div>
          <div className="sequences-list-edit-item-karma">
            {document.karma || "undefined"} points
          </div>
          <div className="sequences-list-edit-item-comments">
            {document.commentCount || "?"} comments
          </div>
          <div className="sequences-list-edit-item-remove">
            <RemoveIcon className="remove-icon" onClick={() => props.removeItem(documentId)} />
          </div>
        </div>
      </div>
    </div>
  } else {
    return <Components.Loading />
  }
};

const options = {
  collection: Sequences,
  queryName: "SequencesListEditorQuery",
  fragmentName: 'SequencesPageFragment',
};

registerComponent('SequencesListEditorItem', SequencesListEditorItem,
  [withDocument, options],
  withStyles(styles, {name: "SequencesListEditorItem"})
);

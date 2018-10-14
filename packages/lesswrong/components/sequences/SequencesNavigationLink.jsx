import { Components, registerComponent, withDocument} from 'meteor/vulcan:core';
import { Posts } from '../../lib/collections/posts';
import IconButton from 'material-ui/IconButton'
import React from 'react';
import { withRouter } from 'react-router';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  normal: {
    "& .material-icons": {
      color: "rgba(0,0,0, 0.5) !important"
    }
  },
  disabled: {
    "& .material-icons": {
      color: "rgba(0,0,0, 0.2) !important"
    }
  },
});

const SequencesNavigationLink = ({
    slug,
    document,
    documentId,
    documentUrl,
    loading,
    direction,
    router,
    classes}
  ) => {
    const post = (slug || documentId) && document
    const disabled = (!slug && !documentId);
    return (
      <IconButton
        className={disabled ? classes.disabled : classes.normal}
        disabled={disabled}
        iconClassName="material-icons"
        tooltip={post && post.title}
        onClick={() => router.push(documentUrl)}>
        { direction === "left" ? "navigate_before" : "navigate_next" }
       </IconButton>
     )
};

const options = {
  collection: Posts,
  queryName: "SequencesPostNavigationLinkQuery",
  fragmentName: 'SequencesPostNavigationLink',
  enableTotal: false,
}

registerComponent('SequencesNavigationLink', SequencesNavigationLink,
  [withDocument, options], withRouter, withStyles(styles, {name: "SequencesNavigationLink"}));

import { Components, registerComponent, withDocument} from 'meteor/vulcan:core';
import { Posts } from '../../lib/collections/posts';
import IconButton from '@material-ui/core/IconButton'
import Tooltip from '@material-ui/core/Tooltip';
import NavigateBefore from '@material-ui/icons/NavigateBefore'
import NavigateNext from '@material-ui/icons/NavigateNext'
import React from 'react';
import { withRouter } from 'react-router';
import { withStyles } from '@material-ui/core/styles';
import classnames from 'classnames';

const styles = theme => ({
  root: {
    padding: 0,
    margin: 12,
  },
  normal: {
    "& svg": {
      color: "rgba(0,0,0, 0.5) !important"
    }
  },
  disabled: {
    "& svg": {
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
  const button = (
    <IconButton
      classes={{
        root: classnames(classes.root, disabled ? classes.disabled : classes.normal)
      }}
      disabled={disabled}
      onClick={() => router.push(documentUrl)}>
      { direction === "left" ? <NavigateBefore/> : <NavigateNext/> }
     </IconButton>
   )
  if (post && post.title) {
    return <Tooltip title={post.title}>{button}</Tooltip>
  } else {
    return button;
  }
};

const options = {
  collection: Posts,
  queryName: "SequencesPostNavigationLinkQuery",
  fragmentName: 'SequencesPostNavigationLink',
  enableTotal: false,
}

registerComponent('SequencesNavigationLink', SequencesNavigationLink,
  [withDocument, options], withRouter, withStyles(styles, {name: "SequencesNavigationLink"}));

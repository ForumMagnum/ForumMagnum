import { registerComponent, withDocument} from 'meteor/vulcan:core';
import { Posts } from '../../lib/collections/posts';
import IconButton from '@material-ui/core/IconButton'
import Tooltip from '@material-ui/core/Tooltip';
import NavigateBefore from '@material-ui/icons/NavigateBefore'
import NavigateNext from '@material-ui/icons/NavigateNext'
import React from 'react';
import { withRouter, Link } from 'react-router';
import { withStyles } from '@material-ui/core/styles';
import classnames from 'classnames';

// Shared with SequencesNavigationLinkDisabled
export const styles = theme => ({
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
  document,
  documentUrl,
  loading,
  direction,
  router,
  classes}
) => {
  const button = (
    <Link to={documentUrl}>
      <IconButton classes={{root: classnames(classes.root, classes.normal)}}>
        { direction === "left" ? <NavigateBefore/> : <NavigateNext/> }
      </IconButton>
    </Link>
  )
  if (document && document.title) {
    return <Tooltip title={document.title}>{button}</Tooltip>
  } else {
    return button;
  }
};

const options = {
  collection: Posts,
  queryName: "SequencesPostNavigationLinkQuery",
  fragmentName: 'SequencesPostNavigationLink',
  enableTotal: false,
  ssr: true
}

registerComponent('SequencesNavigationLink', SequencesNavigationLink,
  [withDocument, options], withRouter, withStyles(styles, {name: "SequencesNavigationLink"}));

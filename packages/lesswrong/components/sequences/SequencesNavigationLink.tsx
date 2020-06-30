import { registerComponent } from '../../lib/vulcan-lib';
import { Posts } from '../../lib/collections/posts';
import IconButton from '@material-ui/core/IconButton'
import Tooltip from '@material-ui/core/Tooltip';
import NavigateBefore from '@material-ui/icons/NavigateBefore'
import NavigateNext from '@material-ui/icons/NavigateNext'
import React from 'react';
import { useNavigation } from '../../lib/routeUtil';
import { useUpdateContinueReading } from './useUpdateContinueReading';
import classnames from 'classnames';
import { Link } from '../../lib/reactRouterWrapper';

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

const SequencesNavigationLink = ({ post, direction, classes }: {
  post: PostSequenceNavigation_nextPost|PostSequenceNavigation_prevPost,
  direction: "left"|"right",
  classes: ClassesType,
}) => {
  const { history } = useNavigation();
  const updateContinueReading = useUpdateContinueReading(post?._id, post?.sequence?._id);
  const url = Posts.getPageUrl(post, false, post.sequence?._id);
  
  const icon = (
    <IconButton classes={{root: classnames(classes.root, {
      [classes.disabled]: !post,
      [classes.normal]: !!post,
    })}}>
      { (direction === "left") ? <NavigateBefore/> : <NavigateNext/> }
    </IconButton>
  );
  
  if (post) {
    const button = (
      <Link onClick={() => updateContinueReading()} to={url}>
        {icon}
      </Link>
    )
    if (post.title) {
      return <Tooltip title={post.title}>{button}</Tooltip>
    } else {
      return button;
    }
  } else {
    return icon;
  }
};

const SequencesNavigationLinkComponent = registerComponent('SequencesNavigationLink', SequencesNavigationLink, {styles});

declare global {
  interface ComponentTypes {
    SequencesNavigationLink: typeof SequencesNavigationLinkComponent
  }
}


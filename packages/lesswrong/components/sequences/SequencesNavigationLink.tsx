import { registerComponent } from '../../lib/vulcan-lib';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import IconButton from '@material-ui/core/IconButton'
import Tooltip from '@material-ui/core/Tooltip';
import NavigateBefore from '@material-ui/icons/NavigateBefore'
import NavigateNext from '@material-ui/icons/NavigateNext'
import React from 'react';
import { useUpdateContinueReading } from './useUpdateContinueReading';
import classnames from 'classnames';
import { Link } from '../../lib/reactRouterWrapper';

// Shared with SequencesNavigationLinkDisabled
export const styles = (theme: ThemeType): JssStyles => ({
  root: {
    padding: 0,
    margin: 12,
  },
  normal: {
    "& svg": {
      color: `${theme.palette.icon.dim} !important`,
    }
  },
  disabled: {
    "& svg": {
      color: `${theme.palette.icon.dim6} !important`,
    }
  },
});

const SequencesNavigationLink = ({ post, direction, classes }: {
  post: PostSequenceNavigation_nextPost|PostSequenceNavigation_prevPost|null,
  direction: "left"|"right",
  classes: ClassesType,
}) => {
  const updateContinueReading = useUpdateContinueReading(post?._id, post?.sequence?._id);
  
  const icon = (
    <IconButton classes={{root: classnames(classes.root, {
      [classes.disabled]: !post,
      [classes.normal]: !!post,
    })}}>
      { (direction === "left") ? <NavigateBefore/> : <NavigateNext/> }
    </IconButton>
  );
  
  if (post) {
    const url = postGetPageUrl(post, false, post.sequence?._id);
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


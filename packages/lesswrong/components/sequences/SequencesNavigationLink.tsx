import { registerComponent } from '../../lib/vulcan-lib/components';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import IconButton from '@/lib/vendor/@material-ui/core/src/IconButton'
import NavigateBefore from '@/lib/vendor/@material-ui/icons/src/NavigateBefore'
import NavigateNext from '@/lib/vendor/@material-ui/icons/src/NavigateNext'
import React from 'react';
import { useUpdateContinueReading } from './useUpdateContinueReading';
import classnames from 'classnames';
import { Link } from '../../lib/reactRouterWrapper';
import { TooltipSpan } from '../common/FMTooltip';

// Shared with SequencesNavigationLinkDisabled
export const styles = (theme: ThemeType) => ({
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
  classes: ClassesType<typeof styles>,
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
      return <TooltipSpan title={post.title} placement="top">{button}</TooltipSpan>
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


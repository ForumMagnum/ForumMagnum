import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { Link } from '../../lib/reactRouterWrapper';
import withHover from '../common/withHover';

export const tagStyle = theme => ({
  marginRight: 4,
  padding: 5,
  paddingLeft: 8,
  paddingRight: 7,
  backgroundColor: 'rgba(0,0,0,0.05)',
  borderRadius: 10,
  cursor: "pointer",
  ...theme.typography.commentStyle,
  "&:hover": {
    opacity: 1
  }
})

const styles = theme => ({
  root: {
    ...tagStyle(theme)
  },
  score: {
    color: 'rgba(0,0,0,0.7)',
  },
  name: {
    display: 'inline-block',
    paddingRight: 5
  },
  hovercard: {
  },
});

interface ExternalProps {
  tagRel: TagRelMinimumFragment,
  tag: TagPreviewFragment,
  hideScore?: boolean
}
interface FooterTagProps extends ExternalProps, WithHoverProps, WithStylesProps {
}

const FooterTag = ({tagRel, tag, hideScore=false, hover, anchorEl, classes}: {
  tagRel: TagRelMinimumFragment,
  tag: TagFragment,
  hideScore?: boolean,
  
  hover: boolean,
  anchorEl: any,
  classes: ClassesType,
}) => {

  const { PopperCard, TagRelCard } = Components

  if (tag.adminOnly) { return null }

  return (<span className={classes.root}>
    <Link to={`/tag/${tag.slug}`}>
      <span className={classes.name}>{tag.name}</span>
      {!hideScore && <span className={classes.score}>{tagRel.baseScore}</span>}
    </Link>
    <PopperCard open={hover} anchorEl={anchorEl}>
      <div className={classes.hovercard}>
        <TagRelCard tagRel={tagRel} />
      </div>
    </PopperCard>
  </span>);
}

const FooterTagComponent = registerComponent<ExternalProps>("FooterTag", FooterTag, {
  styles,
  hocs: [withHover()]
});

declare global {
  interface ComponentTypes {
    FooterTag: typeof FooterTagComponent
  }
}

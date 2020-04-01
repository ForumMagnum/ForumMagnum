import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { Link } from '../../lib/reactRouterWrapper';
import withHover from '../common/withHover';

const styles = theme => ({
  root: {
    marginRight: 4,
    paddingTop: 5,
    paddingBottom: 5,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 10,
    ...theme.typography.commentStyle,
    "&:hover": {
      opacity: 1
    },
  },
  score: {
    color: 'rgba(0,0,0,0.7)',
    paddingTop: 5,
    paddingRight: 7,
    paddingBottom: 5
  },
  name: {
    display: 'inlineBlock',
    paddingTop: 5,
    borderLeft: 'none',
    paddingLeft: 8,
    paddingRight: 5,
    paddingBottom: 5,
  },
  hovercard: {
  },
});

interface ExternalProps {
  tagRel: TagRelMinimumFragment,
  tag: TagRelMinimumFragment_tag,
}
interface FooterTagProps extends ExternalProps, WithHoverProps, WithStylesProps {
}

const FooterTag = ({tagRel, tag, hover, anchorEl, classes}) => {
  return (<span className={classes.root}>
    <Link to={`/tag/${tag.slug}`}>
      <span className={classes.name}>{tag.name}</span>
      <span className={classes.score}>{tagRel.baseScore}</span>
    </Link>
    <Components.PopperCard open={hover} anchorEl={anchorEl}>
      <div className={classes.hovercard}>
        <Components.TagRelCard tagRel={tagRel}/>
      </div>
    </Components.PopperCard>
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

import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { Link } from '../../lib/reactRouterWrapper';
import withHover from '../common/withHover';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { DatabasePublicSetting } from '../../lib/publicSettings';

const useExperimentalTagStyleSetting = new DatabasePublicSetting<boolean>('useExperimentalTagStyle', false)

export const tagStyle = theme => ({
  display: "inline-block",
  marginRight: 3,
  padding: 5,
  paddingLeft: 6,
  paddingRight: 5,
  marginBottom: 8,
  backgroundColor: 'rgba(0,0,0,0.07)',
  borderRadius: 3,
  cursor: "pointer",
  ...theme.typography.commentStyle,
  "&:hover": {
    opacity: 1
  }
})

const newTagStyle = theme => ({
  display: "inline-block",
  marginRight: 4,
  padding: 5,
  paddingLeft: 8,
  paddingRight: 7,
  marginBottom: 8,
  borderRadius: 4,
  cursor: "pointer",
  boxShadow: '1px 2px 5px rgba(0,0,0,.2)',
  ...theme.typography.commentStyle,
  color: theme.palette.primary.main,
  "&:hover": {
    opacity: 1
  },
  fontSize: 15
})

const styles = theme => ({
  root: tagStyle(theme),
  score:  {
    paddingLeft: 5,
    color: 'rgba(0,0,0,0.7)',
  },
  name: {
    display: 'inline-block',
  },
  hovercard: {
  },
});

const experimentalStyles = theme => ({
  root: newTagStyle(theme),
  score: {
    display: "none"
  },
  name: {
    display: 'inline-block',
  },
  hovercard: {
  }
})

interface ExternalProps {
  tagRel?: TagRelMinimumFragment,
  tag: TagPreviewFragment,
  hideScore?: boolean
}
interface FooterTagProps extends ExternalProps, WithHoverProps, WithStylesProps {
}

const FooterTag = ({tagRel, tag, hideScore=false, hover, anchorEl, classes}: {
  tagRel?: TagRelMinimumFragment,
  tag: TagFragment,
  hideScore?: boolean,

  hover: boolean,
  anchorEl: any,
  classes: ClassesType,
}) => {

  const { PopperCard, TagRelCard } = Components

  if (tag.adminOnly) { return null }

  return (<AnalyticsContext tagName={tag.name} tagId={tag._id} tagSlug={tag.slug} pageElementContext="tagItem">
    <span className={classes.root}>
      <Link to={`/tag/${tag.slug}`}>
        <span className={classes.name}>{tag.name}</span>
        {!hideScore && tagRel && <span className={classes.score}>{tagRel.baseScore}</span>}
      </Link>
      {tagRel && <PopperCard open={hover} anchorEl={anchorEl}>
        <div className={classes.hovercard}>
          <TagRelCard tagRel={tagRel} />
        </div>
      </PopperCard>}
    </span>
  </AnalyticsContext>);
}

const FooterTagComponent = registerComponent<ExternalProps>("FooterTag", FooterTag, {
  styles: useExperimentalTagStyleSetting.get() ? experimentalStyles : styles,
  hocs: [withHover({pageElementContext: "tagItem"}, ({tag}:{tag: TagFragment})=>({tagId: tag._id, tagName: tag.name, tagSlug: tag.slug}))]
});

declare global {
  interface ComponentTypes {
    FooterTag: typeof FooterTagComponent
  }
}

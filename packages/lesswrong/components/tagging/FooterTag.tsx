import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { Link } from '../../lib/reactRouterWrapper';
import { useHover } from '../common/withHover';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { DatabasePublicSetting } from '../../lib/publicSettings';
import classNames from 'classnames';

const useExperimentalTagStyleSetting = new DatabasePublicSetting<boolean>('useExperimentalTagStyle', false)

export const tagStyle = (theme: ThemeType): JssStyles => ({
  marginRight: 3,
  padding: 5,
  paddingLeft: 6,
  paddingRight: 6,
  marginBottom: 8,
  backgroundColor: theme.palette.grey[200],
  border: `solid 1px ${theme.palette.grey[200]}`,
  color: 'rgba(0,0,0,.9)',
  borderRadius: 3,
  ...theme.typography.commentStyle,
  cursor: "pointer"
})

const newTagStyle = (theme: ThemeType): JssStyles => ({
  marginRight: 4,
  padding: 5,
  paddingLeft: 8,
  paddingRight: 7,
  marginBottom: 8,
  borderRadius: 4,
  boxShadow: '1px 2px 5px rgba(0,0,0,.2)',
  color: theme.palette.primary.main,
  fontSize: 15
})

export const smallTagTextStyle = (theme: ThemeType): JssStyles => ({
  fontSize: 12,
  paddingTop: 1,
  paddingBottom: 2,
  marginBottom: 0
});

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: "inline-block",
    cursor: "pointer",
    ...theme.typography.commentStyle,
    "&:hover": {
      opacity: 1
    },
    ...(useExperimentalTagStyleSetting.get()
      ? newTagStyle(theme)
      : tagStyle(theme)
    )
  },
  core: {
    backgroundColor: "white",
    border: "solid 1px rgba(0,0,0,.12)",
    color: theme.palette.grey[600],
    
    "& $score": {
      color: 'rgba(0,0,0,0.45)',
    },
  },
  score:  {
    paddingRight: 5,
    color: 'rgba(0,0,0,0.6)',
    fontSize: 10,
  },
  name: {
    display: 'inline-block',
  },
  hovercard: {
  },
  smallText: {
    ...smallTagTextStyle(theme),
  }
});

const FooterTag = ({tagRel, tag, hideScore=false, classes, smallText}: {
  tagRel?: TagRelMinimumFragment,
  tag: TagBasicInfo,
  hideScore?: boolean,
  smallText?: boolean,
  classes: ClassesType,
}) => {
  const { hover, anchorEl, eventHandlers } = useHover({
    pageElementContext: "tagItem",
    tagId: tag._id,
    tagName: tag.name,
    tagSlug: tag.slug
  });
  const { PopperCard, TagRelCard } = Components

  if (tag.adminOnly) { return null }

  return (<AnalyticsContext tagName={tag.name} tagId={tag._id} tagSlug={tag.slug} pageElementContext="tagItem">
    <span {...eventHandlers} className={classNames(classes.root, {[classes.core]: tag.core, [classes.smallText]: smallText})}>
      <Link to={`/tag/${tag.slug}`}>
        {!hideScore && tagRel && <span className={classes.score}>{tagRel.baseScore}</span>}
        <span className={classes.name}>{tag.name}</span>
      </Link>
      {tagRel && <PopperCard open={hover} anchorEl={anchorEl} modifiers={{flip:{enabled:false}}}>
        <div className={classes.hovercard}>
          <TagRelCard tagRel={tagRel} />
        </div>
      </PopperCard>}
    </span>
  </AnalyticsContext>);
}

const FooterTagComponent = registerComponent("FooterTag", FooterTag, {styles});

declare global {
  interface ComponentTypes {
    FooterTag: typeof FooterTagComponent
  }
}

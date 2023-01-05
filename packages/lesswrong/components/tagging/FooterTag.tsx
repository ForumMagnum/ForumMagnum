import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { Link } from '../../lib/reactRouterWrapper';
import { useHover } from '../common/withHover';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { DatabasePublicSetting } from '../../lib/publicSettings';
import classNames from 'classnames';
import { tagGetUrl } from '../../lib/collections/tags/helpers';
import { RobotIcon } from '../icons/RobotIcon';

const useExperimentalTagStyleSetting = new DatabasePublicSetting<boolean>('useExperimentalTagStyle', false)

export const tagStyle = (theme: ThemeType): JssStyles => ({
  marginRight: 3,
  padding: 5,
  paddingLeft: 6,
  paddingRight: 6,
  marginBottom: 8,
  backgroundColor: theme.palette.tag.background,
  border: theme.palette.tag.border,
  color: theme.palette.tag.text,
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
  boxShadow: theme.palette.tag.boxShadow,
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
    backgroundColor: theme.palette.tag.hollowTagBackground,
    border: theme.palette.tag.coreTagBorder,
    color: theme.palette.text.dim3,
  },
  score:  {
    paddingLeft: 5,
    color: theme.palette.text.slightlyDim2,
  },
  name: {
    display: 'inline-block',
  },
  hovercard: {
  },
  smallText: {
    ...smallTagTextStyle(theme),
  },
  topTag: {
    background: theme.palette.primary.main,
    color: theme.palette.text.invertedBackgroundText,
    border: 'none',
    padding: '6px 12px',
    fontWeight: 600,
    '& svg': {
      height: 22,
      width: 20,
      fill: theme.palette.icon.inverted,
      padding: '1px 0px'
    },
    marginBottom: 16,
    [theme.breakpoints.down('sm')]: {
      marginTop: 16,
    },
  },
  flexContainer: {
    display: 'flex',
    alignItems: 'center',
    columnGap: 8,
  }
});

const FooterTag = ({tagRel, tag, hideScore=false, classes, smallText, popperCard, link=true, isTopTag=false, highlightAsAutoApplied=false}: {
  tagRel?: TagRelMinimumFragment,
  tag: TagBasicInfo,
  hideScore?: boolean,
  smallText?: boolean,
  popperCard?: React.ReactNode,
  classes: ClassesType,
  link?: boolean
  isTopTag?: boolean
  highlightAsAutoApplied?: boolean,
}) => {
  const { hover, anchorEl, eventHandlers } = useHover({
    pageElementContext: "tagItem",
    tagId: tag._id,
    tagName: tag.name,
    tagSlug: tag.slug
  });
  const { PopperCard, TagRelCard, TopTagIcon } = Components

  const sectionContextMaybe = isTopTag ? {pageSectionContext: 'topTag'} : {}

  if (tag.adminOnly) { return null }

  const renderedTag = <>
    {!!isTopTag && <TopTagIcon tag={tag} />}
    <span className={classes.name}>{tag.name}</span>
    {!hideScore && tagRel && <span className={classes.score}>{tagRel.baseScore}</span>}
  </>
  
  // Fall back to TagRelCard if no popperCard is provided
  const popperCardToRender = popperCard ?? (tagRel ? <TagRelCard tagRel={tagRel} /> : <></>)

  return (<AnalyticsContext tagName={tag.name} tagId={tag._id} tagSlug={tag.slug} pageElementContext="tagItem" {...sectionContextMaybe}>
    <span {...eventHandlers} className={classNames(classes.root, {
      [classes.topTag]: isTopTag,
      [classes.core]: tag.core,
      [classes.smallText]: smallText,
    })}>
      {link ? <Link to={tagGetUrl(tag)} className={!!isTopTag ? classes.flexContainer : null}>
        {renderedTag}
        {highlightAsAutoApplied && <RobotIcon/>}
      </Link> : renderedTag}
      {<PopperCard open={hover} anchorEl={anchorEl} allowOverflow>
        <div className={classes.hovercard}>
          {popperCardToRender}
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

import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { Link } from '../../lib/reactRouterWrapper';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { DatabasePublicSetting } from '../../lib/publicSettings';
import classNames from 'classnames';
import { tagGetUrl } from '../../lib/collections/tags/helpers';
import { useCurrentUser } from '../common/withUser';
import { coreTagIconMap, CoreTagIcon } from './CoreTagIcon';
import { isBookUI, isFriendlyUI } from '../../themes/forumTheme';
import { TagsTooltipPreviewWrapper, TagsTooltip } from './TagsTooltip';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { ForumIcon } from "../common/ForumIcon";

const useExperimentalTagStyleSetting = new DatabasePublicSetting<boolean>('useExperimentalTagStyle', false)

export const tagStyle = (theme: ThemeType) => ({
  marginRight: isFriendlyUI ? 3 : undefined,
  padding: 5,
  paddingLeft: 6,
  paddingRight: 6,
  marginBottom: isFriendlyUI ? 8 : undefined,
  fontWeight: theme.typography.body1.fontWeight,
  backgroundColor: theme.palette.tag.background,
  border: theme.palette.tag.border,
  color: theme.palette.tag.text,
  borderRadius: 3,
  ...theme.typography.commentStyle,
  cursor: "pointer",
  whiteSpace: isFriendlyUI ? "nowrap": undefined,
})

const newTagStyle = (theme: ThemeType) => ({
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

export const smallTagTextStyle = (theme: ThemeType) => ({
  fontSize: 12,
  paddingTop: 1,
  paddingBottom: 2,
  fontWeight: theme.typography.body1.fontWeight,
  marginBottom: 0
});

export const coreTagStyle = (theme: ThemeType) => ({
  backgroundColor: theme.palette.tag.coreTagBackground,
  border: theme.palette.tag.coreTagBorder,
  color: theme.palette.tag.coreTagText,
  "&:hover": {
    backgroundColor: theme.palette.tag.coreTagBackgroundHover,
    borderColor: theme.palette.tag.coreTagBackgroundHover,
  },
});

const styles = defineStyles("FooterTag", (theme: ThemeType) => ({
  root: {
    display: "inline-block",
    cursor: "pointer",
    ...theme.typography.commentStyle,
    "&:hover": {
      opacity: 1,
      backgroundColor: theme.palette.tag.backgroundHover,
    },
    "& a:hover": isFriendlyUI ? {opacity: 1} : {},
    ...(useExperimentalTagStyleSetting.get() && isBookUI
      ? newTagStyle(theme)
      : tagStyle(theme)
    )
  },
  tooltip: {
    marginTop: isFriendlyUI ? 6 : undefined,
  },
  core: {
    ...coreTagStyle(theme),
  },
  coreIcon: {
    position: "relative",
    display: "inline-block",
    minWidth: 20,
    margin: isFriendlyUI ? "0 3px 0 6px" : undefined,
    "& svg": {
      position: "absolute",
      top: -13,
      left: -4,
      width: 20,
      height: 18,
      fill: theme.palette.tag.coreTagText,
    },
  },
  score:  {
    paddingLeft: 5,
    color: theme.palette.text.slightlyDim2,
  },
  name: {
    display: 'inline-block',
  },
  smallText: {
    ...smallTagTextStyle(theme),
  },
  robotIcon: {
    "& svg": {
      height: 12,
      opacity: 0.7,
      marginLeft: 4,
    },
  },
  noBackground: {
    backgroundColor: "transparent",
    border: 'none',
    paddingTop: 3,
    paddingBottom: 3,
  }
}), {
  stylePriority: -1,
});

/**
 * A visible tag name, which may have a preview on hover. The `hoverable` flag
 * is either false (no hover), true (enforce that the tag uses
 * TagPreviewFragment), or "ifDescriptionPresent" (don't enforce that the tag
 * used TagPreviewFragment, but make it hoverable if you did). This last option
 * exists because FooterTagList and TruncatedTagsList appear inside
 * hover-previews of posts, and they will initially open into a loading state
 * where we have tags' names but don't have their descriptions.
 */
const FooterTagInner = ({
  tagRel,
  tag,
  hideScore=false,
  hideIcon,
  smallText,
  PreviewWrapper,
  link=true,
  highlightAsAutoApplied=false,
  neverCoreStyling=false,
  hideRelatedTags,
  className,
  noBackground = false,
  hoverable,
}: {
  tagRel?: TagRelMinimumFragment,
  hideScore?: boolean,
  hideIcon?: boolean,
  smallText?: boolean,
  PreviewWrapper?: TagsTooltipPreviewWrapper,
  link?: boolean
  highlightAsAutoApplied?: boolean,
  neverCoreStyling?: boolean,
  hideRelatedTags?: boolean,
  className?: string,
  noBackground?: boolean,
} & (
    { hoverable: false, tag: TagBasicInfo }
  | { hoverable: true, tag: TagPreviewFragment }
  | { hoverable: "ifDescriptionPresent", tag: TagBasicInfo|TagPreviewFragment }
)) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();

  if (tag.adminOnly && !currentUser?.isAdmin) { return null }

  const showIcon = Boolean(tag.core && !smallText && coreTagIconMap[tag.slug] && !hideIcon);

  const tagName = isFriendlyUI && smallText
    ? tag.shortName || tag.name
    : tag.name;
  const renderedTag = <>
    {showIcon && <span className={classes.coreIcon}><CoreTagIcon tag={tag} /></span>}
    <span className={classes.name}>{tagName}</span>
    {!hideScore && tagRel && <span className={classes.score}>{tagRel.baseScore}</span>}
  </>
  
  const visibleElement = <span className={classNames(classes.root, className, {
    [classes.core]: !neverCoreStyling && tag.core,
    [classes.smallText]: smallText,
    [classes.noBackground]: noBackground,
  })}>
    {link ? <Link to={tagGetUrl(tag)}>
      {renderedTag}
      {highlightAsAutoApplied && <span className={classes.robotIcon}><ForumIcon icon="Robot" /></span>}
    </Link> : renderedTag}
  </span>
  
  const hasTooltip = (hoverable === true) || (hoverable === "ifDescriptionPresent" && tag && 'description' in tag);

  const withTooltip = hasTooltip
    ? <TagsTooltip
        tag={tag as TagPreviewFragment}
        tagRel={tagRel}
        PreviewWrapper={PreviewWrapper}
        hideRelatedTags={hideRelatedTags}
        popperClassName={classes.tooltip}
      >
        {visibleElement}
      </TagsTooltip>
    : visibleElement

  return (
    <AnalyticsContext tagName={tag.name} tagId={tag._id} tagSlug={tag.slug} pageElementContext="tagItem">
      {withTooltip}
    </AnalyticsContext>
  );
}

export const FooterTag = registerComponent("FooterTag", FooterTagInner);



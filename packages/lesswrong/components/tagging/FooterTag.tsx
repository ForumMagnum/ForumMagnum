import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { Link } from '../../lib/reactRouterWrapper';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { DatabasePublicSetting } from '../../lib/publicSettings';
import classNames from 'classnames';
import { tagGetUrl } from '../../lib/collections/tags/helpers';
import { RobotIcon } from '../icons/RobotIcon';
import { useCurrentUser } from '../common/withUser';
import { coreTagIconMap } from './CoreTagIcon';
import { isBookUI, isFriendlyUI } from '../../themes/forumTheme';
import type { TagsTooltipPreviewWrapper } from './TagsTooltip';

const useExperimentalTagStyleSetting = new DatabasePublicSetting<boolean>('useExperimentalTagStyle', false)

export const tagStyle = (theme: ThemeType): JssStyles => ({
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
  fontWeight: theme.typography.body1.fontWeight,
  marginBottom: 0
});

export const coreTagStyle = (theme: ThemeType): JssStyles => ({
  backgroundColor: theme.palette.tag.coreTagBackground,
  border: theme.palette.tag.coreTagBorder,
  color: theme.palette.tag.coreTagText,
  "&:hover": {
    backgroundColor: theme.palette.tag.coreTagBackgroundHover,
    borderColor: theme.palette.tag.coreTagBackgroundHover,
  },
});

const styles = (theme: ThemeType): JssStyles => ({
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
});

const FooterTag = ({
  tagRel,
  tag,
  hideScore=false,
  smallText,
  PreviewWrapper,
  link=true,
  highlightAsAutoApplied=false,
  neverCoreStyling=false,
  hideRelatedTags,
  className,
  classes,
}: {
  tag: TagPreviewFragment | TagSectionPreviewFragment | TagRecentDiscussion,
  tagRel?: TagRelMinimumFragment,
  hideScore?: boolean,
  smallText?: boolean,
  PreviewWrapper?: TagsTooltipPreviewWrapper,
  link?: boolean
  highlightAsAutoApplied?: boolean,
  neverCoreStyling?: boolean,
  hideRelatedTags?: boolean,
  className?: string,
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();

  if (tag.adminOnly && !currentUser?.isAdmin) { return null }

  const showIcon = Boolean(tag.core && !smallText && coreTagIconMap[tag.slug]);

  const tagName = isFriendlyUI && smallText
    ? tag.shortName || tag.name
    : tag.name;

  const {TagsTooltip, CoreTagIcon} = Components;
  const renderedTag = <>
    {showIcon && <span className={classes.coreIcon}><CoreTagIcon tag={tag} /></span>}
    <span className={classes.name}>{tagName}</span>
    {!hideScore && tagRel && <span className={classes.score}>{tagRel.baseScore}</span>}
  </>

  return (
    <AnalyticsContext tagName={tag.name} tagId={tag._id} tagSlug={tag.slug} pageElementContext="tagItem">
      <TagsTooltip
        tag={tag}
        tagRel={tagRel}
        PreviewWrapper={PreviewWrapper}
        hideRelatedTags={hideRelatedTags}
        popperClassName={classes.tooltip}
      >
        <span className={classNames(classes.root, className, {
          [classes.core]: !neverCoreStyling && tag.core,
          [classes.smallText]: smallText,
        })}>
          {link ? <Link to={tagGetUrl(tag)}>
            {renderedTag}
            {highlightAsAutoApplied && <span className={classes.robotIcon}><RobotIcon/></span>}
          </Link> : renderedTag}
        </span>
      </TagsTooltip>
    </AnalyticsContext>
  );
}

const FooterTagComponent = registerComponent("FooterTag", FooterTag, {
  styles,
  stylePriority: -1,
});

declare global {
  interface ComponentTypes {
    FooterTag: typeof FooterTagComponent
  }
}

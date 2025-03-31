import React, { CSSProperties } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import type { ForumIconName, IconProps } from '@/components/common/ForumIcon';
import classNames from 'classnames';

const styles = defineStyles("PixelyIcon", (theme: ThemeType) => ({
  root: {
    userSelect: "none",
    display: "inline-block",
    flexShrink: 0,
    width: "var(--icon-size, 1em)",
    height: "var(--icon-size, 1em)",
    fontSize: "var(--icon-size, 24px)",
    imageRendering: "pixelated",
  },
}), {
  stylePriority: -2,
})

const pixelyIcons: Partial<Record<ForumIconName, string>> = {
  // Bell: '/pixely/bell.png',
  // BookOpen: '/pixely/book.png',
  // Search: '/pixely/search.png',
  // UserCircle: '/pixely/user.png',
  // Bookmarks: '/pixely/bookmarks.png',
  // Analytics: '/pixely/analytics.png',
  // ListBullet: '/pixely/list.png',
  // Comment: '/pixely/comment.png',
  // Tag: '/pixely/tag.png',
  // Karma: '/pixely/karma.png',
  // Add more icons as needed
} as Partial<Record<ForumIconName, string>>;

export const PixelyIcon = ({icon, noDefaultStyles, className, style, onClick, onMouseDown}: IconProps & {
  icon: ForumIconName,
  noDefaultStyles?: boolean,
  style?: CSSProperties,
}) => {
  const classes = useStyles(styles);
  const path = pixelyIcons[icon];
  return <img
    src={path}
    style={style}
    className={classNames(
      className,
      !noDefaultStyles && classes.root,
    )}
    onClick={onClick}
    onMouseDown={onMouseDown}
  />
}

export const PixelyIconPath = ({path, noDefaultStyles, className, style, onClick, onMouseDown}: IconProps & {
  path: string,
  noDefaultStyles?: boolean,
  style?: CSSProperties,
}) => {
  const classes = useStyles(styles);
  return <img
    src={path}
    style={style}
    className={classNames(
      className,
      !noDefaultStyles && classes.root,
    )}
    onClick={onClick}
    onMouseDown={onMouseDown}
  />
}

export function hasPixelyIcon(icon: ForumIconName): boolean {
  return (icon in pixelyIcons);
} 
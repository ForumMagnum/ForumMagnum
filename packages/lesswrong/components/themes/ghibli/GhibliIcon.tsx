import React, { CSSProperties } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import type { ForumIconName, IconProps } from '@/components/common/ForumIcon';
import classNames from 'classnames';

const styles = defineStyles("GhibliIcon", (theme: ThemeType) => ({
  root: {
    userSelect: "none",
    display: "inline-block",
    flexShrink: 0,
    width: "var(--icon-size, 1em)",
    height: "var(--icon-size, 1em)",
    fontSize: "var(--icon-size, 24px)",

    //filter: "drop-shadow(0 0 5px rgba(255, 255, 0, 0.8)) drop-shadow(0 0 8px rgba(255, 215, 0, 0.6))",
  },
}), {
  stylePriority: -2,
})

const ghibliIcons: Partial<Record<ForumIconName,string>> = {
  Bell: "/ghibli/bell.png",
  BellAlert: "/ghibli/bell.png",
  BellBorder: "/ghibli/bell.png",
  BookOpen: "/ghibli/book.png",
  Search: "/ghibli/magnifyingGlass.png",
  Karma: "/ghibli/star.png",
  KarmaOutline: "/ghibli/star.png",
  Menu: "/ghibli/hamburger.png",
  Settings: "/ghibli/gear.png",
};

export const GhibliIcon = ({icon, noDefaultStyles, className, style, onClick, onMouseDown}: IconProps & {
  icon: ForumIconName,
  noDefaultStyles?: boolean,
  style?: CSSProperties,
}) => {
  const classes = useStyles(styles);
  const path = ghibliIcons[icon];
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

export const GhibliIconPath = ({path, noDefaultStyles, className, style, onClick, onMouseDown}: IconProps & {
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

export function hasGhibliIcon(icon: ForumIconName): boolean {
  return (icon in ghibliIcons);
}

import classNames from 'classnames';
import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { isFriendlyUI } from '../../themes/forumTheme';

export const separatorBulletStyles = (theme: ThemeType) => ({
  '& > *': {
    marginBottom: theme.spacing.unit,
    '&:after': {
      content: '"•"',
      marginLeft: theme.spacing.unit*2,
      marginRight: theme.spacing.unit*2,
    },
    // Each child of the sectionFooter has a bullet divider, except for the last one.
    '&:last-child': {
      '&:after': {
        content: '""',
        margin:0,
      }
    },
  }
})

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: theme.spacing.unit,
    marginBottom: theme.spacing.unit,
    marginRight: theme.spacing.unit/2,
    marginLeft: theme.spacing.unit/2,
    color: theme.palette.lwTertiary.main,
    flexWrap: "wrap",
    ...separatorBulletStyles(theme),
    ...(isFriendlyUI
      ? {
        fontSize: 14,
        fontWeight: 600,
        lineHeight: "24px",
      }
      : {}),
  }
})

const SectionFooter = ({ children, className, classes }: {
  children: React.ReactNode,
  className?: string,
  classes: ClassesType,
}) => {
  return (
    <Components.Typography variant="body2" className={classNames(classes.root, className)}>
      { children }
    </Components.Typography>
  )
}
const SectionFooterComponent = registerComponent('SectionFooter', SectionFooter, {styles})

declare global {
  interface ComponentTypes {
    SectionFooter: typeof SectionFooterComponent
  }
}

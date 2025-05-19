import classNames from 'classnames';
import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { isFriendlyUI } from '../../themes/forumTheme';
import { Typography } from "./Typography";

export const separatorBulletStyles = (theme: ThemeType, spacingMultiplier = 1) => ({
  '& > *': {
    marginBottom: theme.spacing.unit,
    '&:after': {
      content: '"•"',
      marginLeft: (theme.spacing.unit*2)*spacingMultiplier, 
      marginRight: (theme.spacing.unit*2)*spacingMultiplier,
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

const styles = (theme: ThemeType) => ({
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
  classes: ClassesType<typeof styles>,
}) => {
  return (
    <Typography variant="body2" className={classNames(classes.root, className)}>
      { children }
    </Typography>
  )
}
export default registerComponent('SectionFooter', SectionFooter, {styles});



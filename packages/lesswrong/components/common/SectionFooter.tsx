import classNames from 'classnames';
import React from 'react';
import { Typography } from "./Typography";
import { isIfAnyoneBuildsItFrontPage } from '../seasonal/styles';
import { useStyles } from '../hooks/useStyles';
import { defineStyles } from '../hooks/defineStyles';

export const separatorBulletStyles = (theme: ThemeType, spacingMultiplier = 1) => ({
  '& > *': {
    marginBottom: 8,
    '&:after': {
      content: '"•"',
      marginLeft: 16*spacingMultiplier, 
      marginRight: 16*spacingMultiplier,
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

const styles = defineStyles("SectionFooter", (theme: ThemeType) => ({
  root: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 8,
    marginRight: 4,
    marginLeft: 4,
    color: theme.palette.lwTertiary.main,
    ...isIfAnyoneBuildsItFrontPage({
      color: theme.palette.text.bannerAdOverlay,
    }),
    flexWrap: "wrap",
    ...separatorBulletStyles(theme)
  }
}))

const SectionFooter = ({ children, className }: {
  children: React.ReactNode,
  className?: string,
}) => {
  const classes = useStyles(styles);
  return (
    <Typography variant="body2" className={classNames(classes.root, className)}>
      { children }
    </Typography>
  )
}

export default SectionFooter;

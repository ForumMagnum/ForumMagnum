import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import Typography from '@material-ui/core/Typography';

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
    ...separatorBulletStyles(theme)
  }
})

const SectionFooter = ({ children, classes }: {
  children: React.ReactNode,
  classes: ClassesType,
}) => {
  return (
    <Typography variant="body2" className={classes.root}>
      { children }
    </Typography>
  )
}
const SectionFooterComponent = registerComponent('SectionFooter', SectionFooter, {styles})

declare global {
  interface ComponentTypes {
    SectionFooter: typeof SectionFooterComponent
  }
}

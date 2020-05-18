import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import Typography from '@material-ui/core/Typography';
import classNames from 'classnames'

const borderStyle = "solid 2px rgba(0,0,0,.5)"

const styles = (theme) => ({
  root: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: theme.spacing.unit*3,
    marginBottom: 4,
  },
  title: {
    margin:0,
    fontFamily: theme.typography.postStyle.fontFamily,
    fontStyle: "italic"
  },
  leftDivider: {
    borderTop: borderStyle,
    width: theme.spacing.unit*4,
    marginRight: theme.spacing.unit*1.5,
    [theme.breakpoints.down('sm')]: {
      display: 'none'
    },
  },
  rightDivider: {
    flexGrow: 1,
    marginLeft: theme.spacing.unit*1.5,
    borderTop: borderStyle,
    [theme.breakpoints.down('sm')]: {
      display: 'none'
    },
  },
  rightMargin: {
    marginRight: theme.spacing.unit*1.5
  },
  noTitle: {
    marginLeft: 0,
  },
  children: {
    ...theme.typography.commentStyle,
    [theme.breakpoints.down('sm')]: {
      marginRight: 8,
      marginLeft: 16,
    },
  },
  tailDivider: {
    marginLeft: theme.spacing.unit*1.5,
    borderTop: borderStyle,
    width: theme.spacing.unit*4,
    [theme.breakpoints.down('sm')]: {
      display: 'none'
    },
  },
})

const SectionTitle = ({children, classes, className, title, dividers=true}: {
  children?: React.ReactNode,
  classes: ClassesType,
  className?: string,
  title: React.ReactNode,
  dividers?: boolean,
}) => {
  return (
    <div className={classes.root}>
      { dividers && title && <div className={classes.leftDivider}/>}
      <Typography variant='display1' className={classNames(classes.title, className)}>
        {title}
      </Typography>
      { dividers && <div className={classNames(classes.rightDivider, {[classes.noTitle]: !title, [classes.rightMargin]: !!children})}/>}
      <div className={classes.children}>{ children }</div>
      { children && dividers && <div className={classes.tailDivider}/>}
    </div>
  )
}

const SectionTitleComponent = registerComponent('SectionTitle', SectionTitle, {styles});

declare global {
  interface ComponentTypes {
    SectionTitle: typeof SectionTitleComponent
  }
}

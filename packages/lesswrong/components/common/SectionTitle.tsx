import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import Typography from '@material-ui/core/Typography';
import classNames from 'classnames'

export const sectionTitleStyle = theme => ({
  margin:0,
  ...theme.typography.postStyle,
  fontSize: "2.2rem"
})

const styles = (theme) => ({
  root: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: theme.spacing.unit*3,
    paddingBottom: 8
  },
  title: {
    ...sectionTitleStyle(theme)
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
  }
})

const SectionTitle = ({children, classes, className, title }: {
  children?: React.ReactNode,
  classes: ClassesType,
  className?: string,
  title: React.ReactNode
}) => {

  
  return (
    <div className={classes.root}>
      <Typography variant='display1' className={classNames(classes.title, className)}>
        {title}
      </Typography>      
      <div className={classes.children}>{ children }</div>
    </div>
  )
}

const SectionTitleComponent = registerComponent('SectionTitle', SectionTitle, {styles});

declare global {
  interface ComponentTypes {
    SectionTitle: typeof SectionTitleComponent
  }
}

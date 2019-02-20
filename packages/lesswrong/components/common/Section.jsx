import { Components, registerComponent } from 'meteor/vulcan:core';
import { Link } from 'react-router';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import classNames from 'classnames';


const BORDER_TOP_WIDTH = 3

const styles = (theme) => ({
  section: {
    [theme.breakpoints.up('sm')]: {
      marginBottom: theme.spacing.unit * 4,
    }
  },
  root: {
    maxWidth: "100vw",
  },
  sectionTitleContainer: {
    [theme.breakpoints.up('md')]: {
      textAlign: 'right',
      display: 'inline',
      maxWidth: 240,
    },
    [theme.breakpoints.down('sm')]: {
      marginBottom: 20,
      maxWidth: 720,
      marginLeft: "auto",
      marginRight: "auto"
    },
    [theme.breakpoints.down('xs')]: {
      marginBottom: 0,
    },
  },
  sectionTitle: {
    ...theme.typography.headerStyle,
    [theme.breakpoints.down('sm')]: {
      borderTopWidth: BORDER_TOP_WIDTH,
      borderTopStyle: 'solid',
      paddingTop: theme.spacing.unit
    },
    [theme.breakpoints.up('md')]: {
      display: 'inline',
      position: 'relative',
      top: theme.spacing.unit + BORDER_TOP_WIDTH,
      '&:before': {
        top: (theme.spacing.unit - BORDER_TOP_WIDTH) * -1,
        position: 'absolute',
        width: '100%',
        borderTopStyle: 'solid',
        borderTopWidth: BORDER_TOP_WIDTH,
        content: '""'
      }
    }
  },
  sectionTitleTop: {
    [theme.breakpoints.up('md')]: {
      marginBottom: theme.spacing.unit*3
    }
  },
  // left to provide overrides
  sectionTitleBottom: {},
  sectionContent: {
    maxWidth: 739,
    [theme.breakpoints.up('md')]: {
      paddingLeft: 24
    },
    [theme.breakpoints.down('sm')]: {
      marginLeft: "auto",
      marginRight: "auto"
    }
  },
  subscribeWidget: {
  },
  [theme.breakpoints.down('sm')]: {
    heading: {
      display: "inline"
    },
    subscribeWidget: {
      marginBottom: 0,
      display: "inline-block",
      marginLeft: 2 * theme.spacing.unit
    }
  }
})

const Section = ({
  title,
  titleLink,
  titleComponent,
  subscribeLinks = null,
  className = null,
  children,
  classes
}) => {

  return (
    <Components.ErrorBoundary>
      <div className={classNames(className, classes.root)}>
      <Grid container className={classes.section} spacing={0}>
        <Grid item xs={12} md={3} className={classes.sectionTitleContainer}>
          {title && <div className={classes.sectionTitleTop}>
            <Typography variant="display1" className={classes.sectionTitle}>
              {!titleLink ? <span className="heading">{title}</span> : <Link className="heading" to={titleLink}>{title}</Link>}
              { subscribeLinks && <Typography className={classes.subscribeWidget} variant="body2">
                {subscribeLinks}
              </Typography> }
            </Typography>
          </div>}
          {titleComponent && <div className={classes.sectionTitleBottom}>
            {titleComponent}
          </div>}
        </Grid>
        <Grid item xs={12} md={9}>
          <div className={classes.sectionContent}>
            {children}
          </div>
        </Grid>
      </Grid>
      </div>
    </Components.ErrorBoundary>
  )
};

registerComponent('Section', Section, withStyles(styles, { name: 'Section'}));

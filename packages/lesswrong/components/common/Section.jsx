import { Components, registerComponent } from 'meteor/vulcan:core';
import { Link } from 'react-router';
import React from 'react';

import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';


const borderTopWidth = 3

const styles = (theme) => ({
  section: {
    marginBottom: theme.spacing.unit * 4,
  },
  sectionTitleContainer: {
    textAlign: 'right',
    display: 'inline',
  },
  sectionTitle: {
    display: 'inline',
    position: 'relative',
    top: (theme.spacing.unit) + borderTopWidth,
    '&:before': {
      top: ((theme.spacing.unit) - borderTopWidth) * -1,
      position: 'absolute',
      width: '100%',
      borderTopStyle: 'solid',
      borderTopWidth: borderTopWidth,
      content: '""'
    }
  },
  sectionTitleTop: {
    paddingBottom: theme.spacing.unit,
    marginBottom: theme.spacing.unit
  },
  sectionTitleBottom: {
    // TODO: do we need this class?
  },
  sectionContent: {
    // TODO: do we need this class?
  }
})

const Section = ({contentStyle, title, /*titleWidth = 220, contentWidth = 715,*/ titleLink, titleComponent, children, classes}) => {

  return (
    <Grid container className={classes.section}>
      <Grid item md={3} className={classes.sectionTitleContainer}>
        {title && <div className={classes.sectionTitleTop}>
          <Typography variant="display1" className={classes.sectionTitle}>
            {!titleLink && <span>{title}</span>}
            {titleLink && <Link to={titleLink}>{title}</Link>}
          </Typography>
        </div>}
        {titleComponent && <div className={classes.sectionTitleBottom}>
          {titleComponent}
        </div>}
      </Grid>
      <Grid item md={9}>
        <div className={classes.sectionContent}>
          {children}
        </div>
      </Grid>
    </Grid>
  )
};

registerComponent('Section', Section, withStyles(styles, { name: 'Section'}));

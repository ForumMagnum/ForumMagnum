import React, { PureComponent } from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';

const styles = (theme) => ({
  root: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: theme.spacing.unit*1.5,
    marginBottom: theme.spacing.unit,
    marginRight: theme.spacing.unit*1.5,
    marginLeft: theme.spacing.unit,
    color: theme.palette.lwTertiary.main,
    [theme.breakpoints.down('xs')]: {
      flexWrap: "wrap"
    },
    '& > *': {
      [theme.breakpoints.down('xs')]: {
        width: "100%",
        textAlign: "right",
        paddingTop: theme.spacing.unit,
        paddingBottom: theme.spacing.unit
      },
      [theme.breakpoints.up('sm')]: {
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
    }
  }
})

class SectionFooter extends PureComponent {
  render() {
    const {children, classes } = this.props
    return (
      <Typography variant="body1" className={classes.root}>
        { children }
      </Typography>
    )
  }
}
registerComponent( 'SectionFooter', SectionFooter, withStyles(styles, {name: 'SectionFooter'}))

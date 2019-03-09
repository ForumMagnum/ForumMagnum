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
    marginRight: theme.spacing.unit*2,
    color: theme.palette.primary.main,
    '& > *': {
      height: 30,
      '&:before': {
        content: '"•"',
        marginLeft: theme.spacing.unit*2,
        marginRight: theme.spacing.unit*2,
      },
      '&:first-child': {
        '&:before': {
          content: '""'
        }
      }
    }
  }
})

class SectionFooter extends PureComponent {
  render() {
    const {children, classes } = this.props 
    return (
      <Typography variant="body2" className={classes.root}>
        { children }
      </Typography>
    )
  }
}
registerComponent( 'SectionFooter', SectionFooter, withStyles(styles, {name: 'SectionFooter'}))

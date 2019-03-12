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
    marginRight: theme.spacing.unit*3.5,
    marginLeft: theme.spacing.unit,
    color: theme.palette.text.secondary,
    '& > *': {
      height: 30,
      '&:after': {
        content: '"•"',
        marginLeft: theme.spacing.unit*2,
        marginRight: theme.spacing.unit*2,
      },
      '&:last-child': {
        '&:after': {
          content: '""',
          marginLeft:0,
          marginRight:0,
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

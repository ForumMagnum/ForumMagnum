import React, { PureComponent, Component } from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import classNames from 'classnames';

const styles = theme => ({
  root: {
    ...theme.typography.body2,
    ...theme.typography.postStyle,
  },

  // For the highlighted section only, disable the half-opacity-on-hover effect
  // that's otherwise globally applied to <a> tags.
  highlighted: {
    fontWeight: "bold",
    '& $link': {
      color: "black",
    },
    "& a:focus, & a:hover": {
      opacity: "initial",
    }
  },

  link: {
    display: "block",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    paddingTop: 4,
    paddingBottom: 4,
    color: theme.palette.grey[700],
    '&:hover':{
      opacity:1,
      fontWeight:"bold",
    }
  },

  level0: {
    display:"inline-block",
    maxWidth:240,
    '&:first-of-type': {
      marginBottom: theme.spacing.unit,
      paddingBottom: theme.spacing.unit,
      borderBottom: "solid 1px rgba(0,0,0,.2)",
    },
    '&:last-of-type': {
      marginTop: theme.spacing.unit,
      paddingTop: theme.spacing.unit,
      borderTop: "solid 1px rgba(0,0,0,.2)",
    }
  },
  level1: {
    paddingLeft: 0,
  },
  level2: {
    fontSize:"1.05em",
    paddingLeft: 16,

  },
  level3: {
    fontSize:"1.05em",
    color:theme.palette.grey[700],
    paddingLeft: 32,
  },
  level4: {
    fontSize:"1.05em",
    color:theme.palette.grey[700],
    paddingLeft: 48,
  },
});

class TableOfContentsRow extends PureComponent
{
  render() {
    const {indentLevel=0, highlighted=false, href, onClick, children, classes} = this.props;

    return <Typography variant="body2"
      className={classNames(
        classes.root,
        this.levelToClassName(indentLevel),
        { [classes.highlighted]: highlighted }
      )}
    >
      <a href={href} onClick={onClick} className={classes.link}>
        {children}
      </a>
    </Typography>
  }

  levelToClassName = (level) => {
    const { classes } = this.props;
    switch(level) {
      case 0: return classes.level0;
      case 1: return classes.level1;
      case 2: return classes.level2;
      case 3: return classes.level3;
      default: return classes.level4;
    }
  }
}

registerComponent("TableOfContentsRow", TableOfContentsRow,
  withStyles(styles, { name: "TableOfContentsRow" }));

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
    
    "& a:focus, & a:hover": {
      opacity: "initial",
    }
  },
  
  link: {
    display: "block",
    whiteSpace: "nowrap",
    overflowX: "hidden",
    textOverflow: "ellipsis",
    
    paddingTop: 4,
    paddingBottom: 4,
  },
  
  level0: {
    paddingLeft: 0,
    paddingTop: 15,
    paddingBottom: 15,
  },
  level1: {
    paddingLeft: 0,
  },
  level2: {
    paddingLeft: 24,
  },
  level3: {
    paddingLeft: 48,
  },
  level4: {
    paddingLeft: 72,
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

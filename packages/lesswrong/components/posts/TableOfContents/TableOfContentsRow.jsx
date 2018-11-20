import React, { PureComponent, Component } from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import MenuItem from 'material-ui/MenuItem';
import classNames from 'classnames';

const styles = theme => ({
  root: {
    ...theme.typography.postStyle,
  },
  
  highlighted: {
    fontWeight: "bold",
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
  },
  level1: {
    paddingLeft: 24,
  },
  level2: {
    paddingLeft: 48,
  },
  level3: {
    paddingLeft: 72,
  },
  level4: {
    paddingLeft: 96,
  },
});

class TableOfContentsRow extends PureComponent
{
  render() {
    const {indentLevel=0, highlighted=false, href, onClick, children, classes} = this.props;
    
    return <div
      className={classNames(
        classes.root,
        this.levelToClassName(indentLevel),
        { [classes.highlighted]: highlighted }
      )}
    >
      <a href={href} onClick={onClick} className={classes.link}>
        {children}
      </a>
    </div>
  }
  
  levelToClassName(level) {
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

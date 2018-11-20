import React, { PureComponent, Component } from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import MenuItem from 'material-ui/MenuItem';
import classNames from 'classnames';

const styles = theme => ({
  root: {
    // Disable the half-opacity-on-hover effect that's otherwise globally
    // applied to <a> tags
    "& a:hover": {
      opacity: "inherit",
    },
  },
  
  highlighted: {
    fontWeight: "bold",
  },
  
  ellipses: {
    display: "block",
    whiteSpace: "nowrap",
    overflowX: "hidden",
    textOverflow: "ellipsis",
  },
  
  level0: {
  },
  level1: {
    paddingLeft: "24px !important",
  },
  level2: {
    paddingLeft: "48px !important",
  },
  level3: {
    paddingLeft: "72px !important",
  },
  level4: {
    paddingLeft: "96px !important",
  },
});

class TableOfContentsDrawerRow extends PureComponent
{
  render() {
    const {indentLevel=0, highlighted=false, href, onClick, children, classes} = this.props;
    
    return <MenuItem
      className={classNames(
        classes.root,
        this.levelToClassName(indentLevel),
      )}
    >
      <a href={href} onClick={onClick} className={classNames(
        classes.ellipses,
        { [classes.highlighted]: highlighted }
      )}>
        {children}
      </a>
    </MenuItem>
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

registerComponent("TableOfContentsDrawerRow", TableOfContentsDrawerRow,
  withStyles(styles, { name: "TableOfContentsDrawerRow" }));


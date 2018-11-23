import React, { PureComponent, Component } from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import MenuItem from '@material-ui/core/MenuItem';
import classNames from 'classnames';
import grey from '@material-ui/core/colors/grey';

const firstLevelIndent = 16;
const paddingPerIndent = 19;

const styles = theme => ({
  root: {
    // Disable the half-opacity-on-hover effect that's otherwise globally
    // applied to <a> tags
    "& a:hover": {
      opacity: "inherit",
    },
    fontSize: 16,
    ...theme.typography.postStyle,
    color: "rgba(0,0,0, 0.87)",
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
    paddingLeft: firstLevelIndent + paddingPerIndent*1,
  },
  level2: {
    paddingLeft: firstLevelIndent + paddingPerIndent*2,
  },
  level3: {
    paddingLeft: firstLevelIndent + paddingPerIndent*3,
  },
  level4: {
    paddingLeft: firstLevelIndent + paddingPerIndent*4,
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

registerComponent("TableOfContentsDrawerRow", TableOfContentsDrawerRow,
  withStyles(styles, { name: "TableOfContentsDrawerRow" }));


import { registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import SubdirectoryArrowLeft from '@material-ui/icons/SubdirectoryArrowLeft';
import Tooltip from '@material-ui/core/Tooltip';
import classNames from 'classnames';
import { legacyBreakpoints } from '../../lib/modules/utils/theme';

const styles = theme => ({
  root: {
    paddingRight: theme.spacing.unit,
    paddingTop: theme.spacing.unit,
    paddingBottom: theme.spacing.unit,
    cursor: "pointer",
    color: "rgba(0,0,0,.75)",
  },
  active: {
    color: "rgba(0,0,0, .3)",
  },
  icon: {
    fontSize: 12,
    transform: "rotate(90deg)"
  },
  parentComment: {
    background: "white",
    position: "absolute",
    zIndex: 2,
    maxWidth: 650,
    bottom: "100%",
    left: 0,
    boxShadow: "0 0 10px rgba(0,0,0,.2)"
  },
  usernameSpacing: {
    paddingRight: 1,
    color: "rgba(0,0,0,.3)",
    [legacyBreakpoints.maxSmall]: {
      padding: "0 10px",
    }
  }
})

const ShowParentComment = ({ comment, nestingLevel, active, onClick, placeholderIfMissing=false, classes }) => {

  if (!comment) return null;
  
  return (
    <Tooltip title="Show previous comment">
      <span className={classNames(classes.root, {[classes.active]: active})} onClick={onClick}>
        <SubdirectoryArrowLeft className={classes.icon}>
          subdirectory_arrow_left
        </SubdirectoryArrowLeft>
      </span>
    </Tooltip>
  )
};

registerComponent('ShowParentComment', ShowParentComment, withStyles(styles, {name:"ShowParentComment"}));

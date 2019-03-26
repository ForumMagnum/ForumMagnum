import { registerComponent, getSetting } from 'meteor/vulcan:core';
import React, { PureComponent } from 'react';
import Tooltip from '@material-ui/core/Tooltip';
import Icon from '@material-ui/core/Icon';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';

const categoryTooltips = {
  "brightness_1": "Read Status",
  "star": "Curated Content",
  "details": "Meta Post",
  "perm_identity": "Personal Blogpost",
  "supervisor_account": "Frontpage Content",
}

const styles = theme => ({
  popper: {
    // Make the tooltip transparent to the mouse cursor, because otherwise it
    // would mess up the cursor style when you move the mouse down
    pointerEvents: "none"
  },
  icon: {
    fontSize: "20px",
    verticalAlign: "middle",
  },
  read: {
    color: "rgba(0,0,0,0.2)",
  },
  unread: {
    color: theme.palette.secondary.light,
  },
  container: {
    width: 50,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
  
    "&:hover": {
      backgroundColor: "rgba(0,0,0,.05)",
    }
  },
  categoryTooltip: {
    lineHeight: "14px",
    padding: "5px 0",
  },
});

class CategoryDisplay extends PureComponent {
  constructor(props, context) {
    super(props)
    this.state = {
      hover: false,
    }
  }

  render() {
    const { post, read, classes } = this.props;

    const categoryIcon = (getSetting('AlignmentForum', false) && "brightness_1") || (post.curatedDate && "star") || (post.meta && "details") || (!post.frontpageDate && "perm_identity") || (post.frontpageDate && "supervisor_account");

    if (categoryIcon) {
      return (
        <Tooltip
          title={<div className={classes.categoryTooltip}><div>
            {categoryTooltips[categoryIcon]}
          </div></div>}
          placement="bottom-end"
          classes={{
            popper: classes.tooltip
          }}
        >
          <div className={classes.container} onClick={this.props.onClick}>
            <span className="posts-item-category-display">
              <Icon className={classNames("material-icons", classes.icon, read ? classes.read : classes.unread)}>
                {categoryIcon}
              </Icon>
            </span>
          </div>
        </Tooltip>
      )
    } else {
      return null
    }
  }
}

registerComponent('CategoryDisplay', CategoryDisplay, withStyles(styles, {name: "CategoryDisplay"}));

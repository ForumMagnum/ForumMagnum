import { registerComponent, getSetting } from 'meteor/vulcan:core';
import React, { PureComponent } from 'react';
import Tooltip from '@material-ui/core/Tooltip';
import Icon from '@material-ui/core/Icon';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';

const categoryTooltips = {
  "brightness_1": <div className="post-category-tooltip"><div>Read Status</div></div>,
  "star": <div className="post-category-tooltip"><div>Curated Content</div></div>,
  "details": <div className="post-category-tooltip"><div>Meta Post</div></div>,
  "perm_identity": <div className="post-category-tooltip"><div>Personal Blogpost</div></div>,
  "supervisor_account": <div className="post-category-tooltip"><div>Frontpage Content</div></div>,
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
          title={categoryTooltips[categoryIcon]}
          placement="bottom-end"
          classes={{
            popper: classes.tooltip
          }}
        >
          <div className="post-category-display-container" onClick={this.props.onClick}>
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

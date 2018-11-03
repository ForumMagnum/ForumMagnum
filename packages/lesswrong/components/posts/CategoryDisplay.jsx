import { Components, registerComponent, getSetting } from 'meteor/vulcan:core';
import React, { PureComponent } from 'react';
import Tooltip from '@material-ui/core/Tooltip';
import FontIcon from 'material-ui/FontIcon';
import { withTheme, withStyles } from '@material-ui/core/styles';

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
  }
});

class CategoryDisplay extends PureComponent {
  constructor(props, context) {
    super(props)
    this.state = {
      hover: false,
    }
  }

  render() {
    const { post, read, theme, classes } = this.props;

    const categoryIcon = (getSetting('AlignmentForum', false) && "brightness_1") || (post.curatedDate && "star") || (post.meta && "details") || (!post.frontpageDate && "perm_identity") || (post.frontpageDate && "supervisor_account");
    const iconColor = read ? "rgba(0,0,0,.2)" : theme.palette.secondary.light;

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
              <FontIcon style={{fontSize: "20px", color: iconColor, verticalAlign: "middle"}} className="material-icons">
                {categoryIcon}
              </FontIcon>
            </span>
          </div>
        </Tooltip>
      )
    } else {
      return null
    }
  }
}

registerComponent('CategoryDisplay', CategoryDisplay, withTheme(), withStyles(styles, {name: "CategoryDisplay"}));

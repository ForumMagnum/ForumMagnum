import { Components, registerComponent} from 'meteor/vulcan:core';
import React, { PureComponent } from 'react';
import Tooltip from 'material-ui/internal/Tooltip';
import FontIcon from 'material-ui/FontIcon';

const categoryTooltips = {
  "star": <div className="post-category-tooltip"><div>Curated Content</div></div>,
  "details": <div className="post-category-tooltip"><div>Meta Post</div></div>,
  "perm_identity": <div className="post-category-tooltip"><div>Personal Blogpost</div></div>,
  "supervisor_account": <div className="post-category-tooltip"><div>Frontpage Content</div></div>,
}


class CategoryDisplay extends PureComponent {
  constructor(props, context) {
    super(props)
    this.state = {
      hover: false,
    }
  }

  render() {
    const { post, read } = this.props;

    const categoryIcon = (post.curatedDate && "star") || (post.meta && "details") || (!post.frontpageDate && "perm_identity") || (post.frontpageDate && "supervisor_account");
    const iconColor = read ? "rgba(0,0,0,.2)" : "rgba(100, 169, 105, 0.7)";

    if (categoryIcon) {
      return (
      <span className="posts-item-category-display">
        <span style={{position: "relative"}} onMouseEnter={() => this.setState({hover: true})} onMouseLeave={() => this.setState({hover: false})}>
          <FontIcon style={{fontSize: "20px", color: iconColor, verticalAlign: "middle"}} className="material-icons">{categoryIcon}</FontIcon>
          <Tooltip
            show={this.state.hover}
            label={categoryTooltips[categoryIcon]}
            horizontalPosition="center"
            verticalPosition="bottom"
          />
        </span>
      </span>
      )
    } else {
      return null
    }
  }
}

registerComponent('CategoryDisplay', CategoryDisplay);

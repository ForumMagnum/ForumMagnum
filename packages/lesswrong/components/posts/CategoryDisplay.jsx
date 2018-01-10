import { Components, registerComponent} from 'meteor/vulcan:core';
import React, { PureComponent } from 'react';
import Tooltip from 'material-ui/internal/Tooltip';
import FontIcon from 'material-ui/FontIcon';

const categoryTooltips = {
  "star": "best content",
  "details": "discussion about LessWrong",
  "person": "personal blog post",
}


class CategoryDisplay extends PureComponent {
  constructor(props, context) {
    super(props)
    this.state = {
      hover: false,
    }
  }

  render() {
    const { post } = this.props;
    const categoryIcon = (post.featuredPriority > 0 && "star") || (post.meta && "details") || (!post.frontpage && "person");
    if (categoryIcon) {
      return (
      <div className="posts-item-category-display">
        <span style={{position: "relative"}} onMouseEnter={() => this.setState({hover: true})} onMouseLeave={() => this.setState({hover: false})}>
          <FontIcon style={{fontSize: "10px", color: "rgba(0,0,0,0.5)", verticalAlign: "middle", bottom: "1px"}} className="material-icons">{categoryIcon}</FontIcon>
          <Tooltip show={this.state.hover} label={categoryTooltips[categoryIcon]} horizontalPosition="center" verticalPosition="bottom"/>
        </span>
      </div>
      )
    } else {
      return null
    }
  }
}

registerComponent('CategoryDisplay', CategoryDisplay);

import { registerComponent, withMessages } from 'meteor/vulcan:core';
import React, { PureComponent } from 'react';

import FontIcon from 'material-ui/FontIcon';

class Bar extends PureComponent {

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="bar">
        <div className="bar2">
        </div>
      </div>
    )
  }
}

class CommentTest extends PureComponent {

  constructor(props) {
    super(props);
  }

  render() {
    const params = this.props.router.params;
    return (
      <div className="test">
        <div className="test2">
          {params}
          <Bar/>
          <FontIcon className="material-icons comments-item-permalink">
            link
          </FontIcon>
        </div>
      </div>
    )
  }
}

registerComponent('CommentTest', CommentTest, withMessages);
export default CommentTest;

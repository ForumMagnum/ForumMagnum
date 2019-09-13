import React, { PureComponent } from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { withLocation } from '../../lib/routeUtil'

class PostsEditPage extends PureComponent {

  render() {
    const { query } = this.props.location;
    const postId = query.postId;
    const eventForm = !!(query.eventForm === "true");
    
    return <div>
      <Components.PostsEditForm documentId={postId} eventForm={eventForm}/>
    </div>
  }
}

registerComponent('PostsEditPage', PostsEditPage, withLocation);

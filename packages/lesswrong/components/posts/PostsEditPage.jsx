import React, { PureComponent } from 'react';
import { Components, registerComponent, getSetting } from 'meteor/vulcan:core';
import { withRouter } from 'react-router'
import Helmet from 'react-helmet';

class PostsEditPage extends PureComponent {

  render() {
    const postId = this.props.location.query.postId;
    const eventForm = !!(this.props.router.location.query && (this.props.router.location.query.eventForm === "true"));
    const mapsAPIKey = getSetting('googleMaps.apiKey', null);
    
    return <div>
      {eventForm && <Helmet><script src={`https://maps.googleapis.com/maps/api/js?key=${mapsAPIKey}&libraries=places`}/></Helmet>}
      <Components.PostsEditForm documentId={postId} eventForm={eventForm}/>
    </div>
  }
}

registerComponent('PostsEditPage', PostsEditPage, withRouter);

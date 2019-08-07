import React, { PureComponent } from 'react';
import { Components, registerComponent, getSetting } from 'meteor/vulcan:core';
import { withLocation } from '../../lib/routeUtil'
import { Helmet } from 'react-helmet';

class PostsEditPage extends PureComponent {

  render() {
    const { query } = this.props.location;
    const postId = query.postId;
    const eventForm = !!(query.eventForm === "true");
    const mapsAPIKey = getSetting('googleMaps.apiKey', null);
    
    return <div>
      {eventForm && <Helmet><script src={`https://maps.googleapis.com/maps/api/js?key=${mapsAPIKey}&libraries=places`}/></Helmet>}
      <Components.PostsEditForm documentId={postId} eventForm={eventForm}/>
    </div>
  }
}

registerComponent('PostsEditPage', PostsEditPage, withLocation);

import { Components, registerComponent, withCurrentUser, getFragment} from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { LocalGroups } from '../../lib/index.js';
import { Link } from 'react-router';

const localGroupColumns = [
  'name',
  'location'
]

class CommunityHome extends Component {
  constructor(props, context) {
    super(props);
    this.state = {}
  }

  componentDidMount() {
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && navigator) {
      console.log("Requesting geolocation access");
      navigator.geolocation.getCurrentPosition((position) => {
        this.setState({
          currentUserLocation: {lat: position.coords.latitude, lng: position.coords.longitude}
        })
      });
    }
  }

  render() {
    const props = this.props;
    return (
      <div className="community-home">
        <Components.CommunityMap
          terms={{view: "all"}}
          loadingElement= {<div style={{ height: `100%` }} />}
          containerElement= {<div style={{height: "500px"}} className="community-map"/>}
          mapElement= {<div style={{ height: `100%` }} />}
          googleMapURL="https://maps.googleapis.com/maps/api/js?v=3.exp&libraries=geometry,drawing,places"
        />
        <Components.Section title="All Groups">
          <Components.SmartForm
            collection={LocalGroups}
            mutationFragment={getFragment('localGroupsHomeFragment')}
            prefilledProps={{organizerIds: [props.currentUser._id]}}
          />
          {/* <Components.Datatable
            collection={LocalGroups}
            columns={localGroupColumns}
            options={{
              fragmentName: 'localGroupsHomeFragment',
              terms: {view: 'all'},
            }}
            showEdit={true}
          /> */}
          {this.state.currentUserLocation &&
            <Components.Datatable
              collection={LocalGroups}
              columns={localGroupColumns}
              options={{
                fragmentName: 'localGroupsHomeFragment',
                terms: {view: 'nearby', lat: this.state.currentUserLocation.lat, lng: this.state.currentUserLocation.lng},
              }}
              showEdit={true}
            />}
        </Components.Section>
      </div>
    )
  }
}

registerComponent('CommunityHome', CommunityHome, withCurrentUser);

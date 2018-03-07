import React, { Component } from 'react';
import Helmet from 'react-helmet';
import PropTypes from 'prop-types';
import { registerComponent, Components, withCurrentUser, getSetting } from 'meteor/vulcan:core';
import Geosuggest from 'react-geosuggest';

class LocationFormComponent extends Component {
  handleSuggestSelect = (suggestion) => {
    if (suggestion && suggestion.gmaps) {
      this.context.addToAutofilledValues({
        location: suggestion.label,
        googleLocation: suggestion.gmaps,
        mongoLocation: {
          type: "Point",
          coordinates: [suggestion.gmaps.geometry.location.lng(), suggestion.gmaps.geometry.location.lat()]
        }
      })
    }
  }

  render() {
    console.log("LocationFormComponent", this.props);
    const mapsAPIKey = getSetting('googleMaps.apiKey', null);
    if (!mapsAPIKey) {throw Error("Please provide Google Maps API key. Add googleMaps.apiKey to settings.json")}
    return <div className="location-suggest">
      <Helmet>
        <script src={`https://maps.googleapis.com/maps/api/js?key=${mapsAPIKey}&libraries=places`}></script>
      </Helmet>
      <Geosuggest
        placeholder="Location"
        onSuggestSelect={this.handleSuggestSelect}
      />
    </div>
  }
}

LocationFormComponent.contextTypes = {
  addToAutofilledValues: PropTypes.func,
  addToSuccessForm: PropTypes.func,
};

registerComponent("LocationFormComponent", LocationFormComponent, withCurrentUser);

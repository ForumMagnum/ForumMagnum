import React, { Component } from 'react';
import Helmet from 'react-helmet';
import PropTypes from 'prop-types';
import { registerComponent, Components, withCurrentUser, getSetting } from 'meteor/vulcan:core';
import Geosuggest from 'react-geosuggest';

class LocationFormComponent extends Component {
  // constructor(props, context) {
  //   super(props, context);
  //   const fieldName = props.name;
  //   let postIds = [];
  //   if (props.document[fieldName]) {
  //     postIds = JSON.parse(JSON.stringify(props.document[fieldName]));
  //   }
  //   this.state = {
  //     postIds: postIds,
  //   }
  //   const addValues = this.context.addToAutofilledValues;
  //   addValues({[fieldName]: postIds});
  //
  //   const addToSuccessForm = this.context.addToSuccessForm;
  //   addToSuccessForm((results) => this.resetPostIds(results));
  // }

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
    const mapsAPIKey = getSetting('googleMaps.apiKey', null);
    if (!mapsAPIKey) {throw Error("Please provide Google Maps API key. Add googleMaps.apiKey to settings.json")}
    return <div className="posts-list-editor">
      <Helmet>
        <script src={`https://maps.googleapis.com/maps/api/js?key=${mapsAPIKey}&libraries=places`}></script>
      </Helmet>
      <Geosuggest onSuggestSelect={this.handleSuggestSelect} />
    </div>
  }
}

LocationFormComponent.contextTypes = {
  addToAutofilledValues: PropTypes.func,
  addToSuccessForm: PropTypes.func,
};

registerComponent("LocationFormComponent", LocationFormComponent, withCurrentUser);

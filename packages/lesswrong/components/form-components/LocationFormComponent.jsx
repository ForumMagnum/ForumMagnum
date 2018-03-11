import React, { Component } from 'react';
import Helmet from 'react-helmet';
import PropTypes from 'prop-types';
import { registerComponent, Components, withCurrentUser, getSetting } from 'meteor/vulcan:core';
import Geosuggest from 'react-geosuggest';

class LocationFormComponent extends Component {
  constructor(props, context) {
    super(props,context);
    this.state = {
      location: props.document && props.document.location || ""
    }
  }

  componentDidMount() {
    const { document } = this.props;
    this.context.addToAutofilledValues({
      location: document && document.location || "",
      googleLocation: document && document.googleLocation,
      mongoLocation: document && document.mongoLocation
    })
  }

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
    if (this.props.document) {
      return <div className="location-suggest">
        <Geosuggest
          placeholder="Location"
          onSuggestSelect={this.handleSuggestSelect}
          initialValue={this.state.location}
        />
      </div>
    } else {
      return null
    }

  }
}

LocationFormComponent.contextTypes = {
  addToAutofilledValues: PropTypes.func,
  addToSuccessForm: PropTypes.func,
};

registerComponent("LocationFormComponent", LocationFormComponent, withCurrentUser);

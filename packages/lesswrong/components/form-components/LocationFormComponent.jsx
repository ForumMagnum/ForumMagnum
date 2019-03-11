import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { registerComponent } from 'meteor/vulcan:core';
import Geosuggest from 'react-geosuggest';
import withUser from '../common/withUser';

class LocationFormComponent extends Component {
  constructor(props, context) {
    super(props,context);
    this.state = {
      location: (props.document && props.document.location) || ""
    }
  }

  componentDidMount() {
    const { document } = this.props;
    this.context.updateCurrentValues({
      location: (document && document.location) || "",
      googleLocation: document && document.googleLocation,
      mongoLocation: document && document.mongoLocation
    })
  }

  handleSuggestSelect = (suggestion) => {
    if (suggestion && suggestion.gmaps) {
      this.context.updateCurrentValues({
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
  updateCurrentValues: PropTypes.func,
  addToSuccessForm: PropTypes.func,
};

// TODO: This is not using the field name provided by the form. It definitely
// doesn't work in nested contexts, and might be making a lie out of our schema.
registerComponent("LocationFormComponent", LocationFormComponent, withUser);

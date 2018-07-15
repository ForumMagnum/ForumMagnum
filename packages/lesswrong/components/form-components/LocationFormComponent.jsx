import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { registerComponent, Components, withCurrentUser } from 'meteor/vulcan:core';
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
    this.context.updateCurrentValues({
      location: document && document.location || "",
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
    // Class names used here correspond to Bootstrap classes; this element
    // needs to match the elements emitted by vulcan-forms, which emits the
    // same classes (.form-group, .row, .control-label, .col-sm-3, .col-sm-9,
    // .form-control).
    if (this.props.document) {
      return <div className="form-group row location-suggest">
        <label className="control-label col-sm-3">Location</label>
        <div class="col-sm-9">
          <Geosuggest
            placeholder=""
            onSuggestSelect={this.handleSuggestSelect}
            inputClassName="form-control"
            initialValue={this.state.location}
          />
        </div>
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

registerComponent("LocationFormComponent", LocationFormComponent, withCurrentUser);

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { registerComponent } from 'meteor/vulcan:core';
import Geosuggest from 'react-geosuggest';
import withUser from '../common/withUser';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  root: {
    // Recommended styling for React-geosuggest: https://github.com/ubilabs/react-geosuggest/blob/master/src/geosuggest.css
    
    "& .geosuggest": {
      fontSize: "1rem",
      position: "relative",
      paddingRight: 3,
      width: "100%",
      textAlign: "left",
    },
    
    "& .geosuggest__input": {
      border: "2px solid transparent",
      borderBottom: "1px solid rgba(0,0,0,.87)",
      padding: ".5em 1em 0.5em 0em !important",
      width: 350,
      fontSize: 13,
      [theme.breakpoints.down('sm')]: {
        width: "100%"
      },
    },
    "& .geosuggest__input:focus": {
      outline: "none",
      borderBottom: "2px solid rgba(0,0,0,.87)",
      borderBottomColor: "#267dc0",
      boxShadow: "0 0 0 transparent",
    },
    
    "& .geosuggest__suggests": {
      position: "absolute",
      top: "100%",
      left: 0,
      right: 0,
      maxHeight: "25em",
      padding: 0,
      marginTop: -1,
      background: "#fff",
      borderTopWidth: 0,
      overflowX: "hidden",
      overflowY: "auto",
      listStyle: "none",
      zIndex: 5,
      transition: "max-height 0.2s, border 0.2s",
    },
    "& .geosuggest__suggests--hidden": {
      maxHeight: 0,
      overflow: "hidden",
      borderWidth: 0,
    },
    
    "& .geosuggest__item": {
      fontSize: "1rem",
      padding: ".5em .65em",
      cursor: "pointer",
    },
    "& .geosuggest__item:hover, & .geosuggest__item:focus": {
      background: "#f5f5f5",
    },
    "& .geosuggest__item--active": {
      background: "#267dc0",
      color: "#fff",
    },
    "& .geosuggest__item--active:hover, & .geosuggest__item--active:focus": {
      background: "#ccc",
    },
    "& .geosuggest__item__matched-text": {
      fontWeight: "bold",
    }
  }
});

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
    const { document, classes } = this.props;
    if (document) {
      return <div className={classes.root}>
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
registerComponent("LocationFormComponent", LocationFormComponent,
  withUser, withStyles(styles, {name: "LocationFormComponent"}));

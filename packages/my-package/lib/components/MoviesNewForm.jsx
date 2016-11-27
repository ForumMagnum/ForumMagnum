import Telescope from 'meteor/nova:lib';
import React, { PropTypes, Component } from 'react';
import NovaForm from "meteor/nova:forms";
import Movies from '../collection.js';

const MoviesNewForm = (props, context) => {
  return (
    <NovaForm 
      collection={Movies}
    />
  )
}

export default MoviesNewForm;
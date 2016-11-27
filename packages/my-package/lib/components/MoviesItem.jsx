import Telescope from 'meteor/nova:lib';
import React, { PropTypes, Component } from 'react';
import gql from 'graphql-tag';

class MoviesItem extends Component {
  render() {
    const movie = this.props;
    return (
      <div>
        <h2>{movie.name} ({movie.year})</h2>
      </div>
    )
  }
};

MoviesItem.fragmentName = 'moviesItemFragment';
MoviesItem.fragment = gql`
  fragment moviesItemFragment on Movie {
    _id
    name
    year
  }
`;

export default MoviesItem;
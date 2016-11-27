import Telescope from 'meteor/nova:lib';
import React, { PropTypes, Component } from 'react';
import Movies from '../collection.js';
import MoviesItem from './MoviesItem.jsx';
import { withCurrentUser, withList } from 'meteor/nova:core';
import MoviesNewForm from './MoviesNewForm.jsx';
import { compose } from 'react-apollo';

const LoadMore = props => <a href="#" className="load-more button button--primary" onClick={props.loadMore}>Load More ({props.count}/{props.totalCount})</a>

class MoviesList extends Component {

  render() {

    const canCreateNewMovie = Movies.options.mutations.new.check(this.props.currentUser);

    if (this.props.loading) {
      return <Telescope.components.Loading />
    } else {
      const hasMore = this.props.totalCount > this.props.results.length;
      return (
        <div className="movies">
          {canCreateNewMovie ? <MoviesNewForm /> : null}
          {this.props.results.map(movie => <MoviesItem key={movie._id} {...movie} />)}
          {hasMore ? <LoadMore {...this.props}/> : <p>No more movies</p>}
        </div>
      )
    }
  }

};

const listOptions = {
  collection: Movies,
  queryName: 'moviesListQuery',
  fragmentName: MoviesItem.fragmentName,
  fragment: MoviesItem.fragment,
};

export default compose(
  withList(listOptions), 
  withCurrentUser
)(MoviesList);

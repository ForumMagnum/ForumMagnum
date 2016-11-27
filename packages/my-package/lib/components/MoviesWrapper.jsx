import React, { PropTypes, Component } from 'react';
import MoviesList from './MoviesList.jsx';
import Accounts from './Accounts.jsx';

class MoviesWrapper extends Component {
  render() {
    return (
      <div className="wrapper">

        <div className="header">
          <Accounts/>
        </div>        
        
        <div className="main">
          <MoviesList/>
        </div>

      </div>
    )
  }
}

export default MoviesWrapper;
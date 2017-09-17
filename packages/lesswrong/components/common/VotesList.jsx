import React, { Component, PropTypes } from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import { Link, withRouter } from 'react-router'

/**
 * Dialog with action buttons. The actions are passed in as an array of React objects,
 * in this example [FlatButtons](/#/components/flat-button).
 *
 * You can also close this dialog by clicking outside the dialog, or with the 'Esc' key.
 */

class VotesList extends Component {

  render() {
    return (
      <div className="votes-list">
        <strong>Upvoters</strong>
        <ul className="stats-upvoters">
          { this.props.document.upvoters.map(
            voter => <li><Link to={{pathname:'/users/' + voter.slug}}>{voter.username}</Link></li>) }
        </ul>
        <strong>Downvoters</strong>
        <ul className="stats-downvoters">
          { this.props.document.downvoters.map(
            voter => <li><Link to={{pathname:'/users/' + voter.slug}}>{voter.username}</Link></li>) }
        </ul>
      </div>
    );
  }
}

VotesList.propTypes = {
    document: PropTypes.object.isRequired,
}

registerComponent('VotesList', VotesList);
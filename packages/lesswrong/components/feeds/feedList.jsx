import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { ListGroup, ListGroupItem } from 'react-bootstrap';
import { Components, registerComponent, withList, withCurrentUser } from 'meteor/vulcan:core';
import RSSFeeds from '../../lib/collections/rssfeeds/collection.js';

class FeedList extends Component {

  render() {

    const results = this.props.results;
    const currentUser = this.props.currentUser;
    const refetch = this.props.refetch;
    const loading = this.props.loading;
    const loadMore = this.props.loadMore;
    const totalCount = this.props.totalCount;

    if (results && results.length) {
      return (
        <ListGroup>
          {results.map(feed => {
            return <Components.FeedItem key={feed._id} feed={feed} />
          })}
          {(results.length < totalCount) ? <ListGroupItem  onClick={() => loadMore()}> Load More </ListGroupItem> : <ListGroupItem>All Feeds loaded</ListGroupItem>}
        </ListGroup>
      )
    } else {
      return <div> This user has no feeds associated with them</div>
    }
  }
}

const options = {
  collection: RSSFeeds,
  queryName: 'userRSSListQuery',
  fragmentName: 'RSSFeedMinimumInfo',
  limit: 10,
  totalResolver: false,
};

registerComponent('FeedList', FeedList, [withList, options], withCurrentUser);

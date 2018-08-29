import React, { PureComponent } from 'react';
import { Components, registerComponent} from 'meteor/vulcan:core';
import { Posts } from 'meteor/example-forum';
import moment from 'moment';
import { Link, withRouter } from 'react-router';
import { Highlight, Snippet} from 'react-instantsearch/dom';

const isLeftClick = (event) => {
  return event.button === 0 && !event.ctrlKey && !event.metaKey;
}

const PostsSearchHit = ({hit, clickAction, router}) => {
  // If clickAction is provided, disable link and replace with Click of the action
  return <div className="search-results-posts-item">
    <div className="posts-item">
      <div className="posts-item-content">
        <Link
          onClick={(event) => isLeftClick(event) && clickAction()}
          to={Posts.getPageUrl(hit)}
          target={Posts.getLinkTarget(hit)}
          className="posts-item-title-link"
        >
          <div>
            <h3 className="posts-item-title">
              <Highlight attributeName="title" hit={hit} tagName="mark" />
            </h3>
            <div className="posts-item-meta">
              {hit.postedAt ? <div className="posts-item-date"> {moment(new Date(hit.postedAt)).fromNow()} </div> : null}
              <div className="posts-item-score">{hit.baseScore} points</div>
              {hit.authorDisplayName ? <div className="posts-item-user">{hit.authorDisplayName}</div> : null}
            </div>
            <div className="posts-item-summary">
              <Snippet attributeName="body" hit={hit} tagName="mark" />
            </div>
          </div>
        </Link>
      </div>
    </div>
  </div>
}


registerComponent("PostsSearchHit", PostsSearchHit, withRouter);

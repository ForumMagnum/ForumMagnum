import React, { PureComponent } from 'react';
import { Components, registerComponent} from 'meteor/vulcan:core';
import { Posts } from 'meteor/example-forum';
import moment from 'moment';
import { Link, withRouter } from 'react-router';
import { Highlight } from 'react-instantsearch/dom';

const isLeftClick = (event) => {
  return event.button === 0 && !event.ctrlKey && !event.metaKey;
}

const PostsListEditorSearchHit = ({hit, clickAction, router}) => {
  // If clickAction is provided, disable link and replace with TouchTap of the action
  return (
    <div
      className="search-results-posts-item posts-item"
    >
      <h3 className="posts-item-title">
        <Highlight attributeName="title" hit={hit} tagName="mark" />
      </h3>
      <object>
        <div className="posts-item-meta">
          {hit.postedAt ? <div className="posts-item-date"> {moment(new Date(hit.postedAt)).fromNow()} </div> : null}
          <div className="posts-item-score">{hit.baseScore} points</div>
          {hit.authorDisplayName ? <div className="posts-item-user">{hit.authorDisplayName}</div> : null}
          <div>{hit.commentCount || 0 } Comments</div>
          <Link
            to={Posts.getLink(hit)}
            target={Posts.getLinkTarget(hit)}
            className="posts-list-editor-item-title-link"
          >
            (Link)
          </Link>
        </div>
      </object>
    </div>
  )
}


registerComponent("PostsListEditorSearchHit", PostsListEditorSearchHit, withRouter);

import React, { PureComponent } from 'react';
import { Components, registerComponent} from 'meteor/vulcan:core';
import { Posts } from 'meteor/example-forum';
import moment from 'moment';
import { Link, withRouter } from 'react-router';
import { Highlight, Snippet} from 'react-instantsearch/dom';
import CommentIcon from 'material-ui/svg-icons/editor/mode-comment';
import IconButton from 'material-ui/IconButton';
import Badge from 'material-ui/Badge';

const commentCountBadgeStyle = {
  top: '13px',
  right: '9px',
  backgroundColor: 'transparent',
  color: 'rgba(0,0,0,0.6)',
}

const commentCountIconStyle = {
  width: '30px',
  height: '30px',
  color: 'rgba(0,0,0,0.1)',
}

const isLeftClick = (event) => {
  return event.button === 0 && !event.ctrlKey && !event.metaKey;
}

const PostsSearchHit = ({hit, clickAction, router}) => {
  // If clickAction is provided, disable link and replace with TouchTap of the action
  return <div className="search-results-posts-item">
    <div className="posts-item">
      <Link
        onClick={(event) => isLeftClick(event) && clickAction()}
        to={Posts.getLink(hit)}
        target={Posts.getLinkTarget(hit)}
        className="posts-item-title-link"
      >
        <div className="posts-item-content">
          <div>
            <h3 className="posts-item-title">
              <Highlight attributeName="title" hit={hit} tagName="mark" />

            </h3>

            <object><div className="posts-item-meta">
              {hit.postedAt ? <div className="posts-item-date"> {moment(new Date(hit.postedAt)).fromNow()} </div> : null}
              <div className="posts-item-score">{hit.baseScore} points</div>
              {hit.authorDisplayName ? <div className="posts-item-user">{hit.authorDisplayName}</div> : null}
            </div></object>
            <div className="posts-item-summary">
              <Snippet attributeName="body" hit={hit} tagName="mark" />
            </div>
          </div>
          <div className="posts-item-comments">
            <Badge
              className="posts-item-comment-count"
              badgeContent={hit.commentCount || 0}
              secondary={true}
              badgeStyle={commentCountBadgeStyle}
            >
              <IconButton
                iconStyle={commentCountIconStyle}
                tooltip={"Comments"}
                containerElement={<object><Link to={Posts.getPageUrl(hit) + "#comments"} /></object>}
              >
                <CommentIcon />
              </IconButton>
            </Badge>
          </div>
        </div>
      </Link>
    </div>
  </div>
}


registerComponent("PostsSearchHit", PostsSearchHit, withRouter);

import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import classnames from 'classnames';
import { Link } from 'react-router';
import { Posts } from "meteor/example-forum";

const RecommendedReadingItem = ({direction, post}) => {
  const commentCount = post.commentCount || "No"

  return (
    <div className={classnames("sequences-recommend-reading-item", direction)}>
      <Link to={Posts.getPageUrl(post)}>
        <div className="sequences-recommended-reading-direction">{direction}:</div>
        <h3>{post.title}</h3>
        <div className="sequences-recommend-reading-item-meta">
          <span>{commentCount} comments</span>
          <span>{post.baseScore} points</span>
        </div>
      </Link>
    </div>
  )
};


registerComponent('RecommendedReadingItem', RecommendedReadingItem);

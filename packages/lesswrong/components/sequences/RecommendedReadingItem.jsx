import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import classnames from 'classnames';
import { Link } from 'react-router';

const RecommendedReadingItem = ({direction, post, sequence}) => {
  const commentCount = post.commentCount || "No"

  return (
    <div className={classnames("sequences-recommend-reading-item", direction)}>
      <Link to={`/s/${sequence._id}/p/${post._id}`}>
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

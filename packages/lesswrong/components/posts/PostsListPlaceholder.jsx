import React from 'react';
import { registerComponent, Components } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
import { styles } from './PostsItem2.jsx';

const PostsListPlaceholder = ({count, classes}) => {
  let placeholders = [];
  for(let i=0; i<count; i++) {
    placeholders.push(
      <div key={i} className={classNames(
        classes.root,
        classes.background,
        classes.bottomBorder,
      )}>
        <div className={classes.postsItem}>
          <span className={classes.title}>
            <span className={classes.titlePlaceholder}>{" "}</span>
          </span>
        </div>
      </div>
    )
  }
  return <React.Fragment>{placeholders}</React.Fragment>;
}

registerComponent("PostsListPlaceholder", PostsListPlaceholder,
  withStyles(styles, {name:"PostsListPlaceholder"}))

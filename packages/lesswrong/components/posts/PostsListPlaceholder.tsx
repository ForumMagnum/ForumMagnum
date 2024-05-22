import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import classNames from 'classnames';
import { classes } from './LWPostsItem';

const PostsListPlaceholder = ({count}: {
  count: number,
}) => {
  let placeholders: Array<JSX.Element> = [];
  for(let i=0; i<count; i++) {
    placeholders.push(
      <div key={i} className={classNames(
        classes.root,
        classes.background
      )}>
        <div className={classes.postsItem}>
          <span className={classes.title}>{" "}</span>
        </div>
      </div>
    )
  }
  return <React.Fragment>{placeholders}</React.Fragment>;
}

const PostsListPlaceholderComponent = registerComponent("PostsListPlaceholder", PostsListPlaceholder);

declare global {
  interface ComponentTypes {
    PostsListPlaceholder: typeof PostsListPlaceholderComponent
  }
}

import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import classNames from 'classnames';
import { styles } from './LWPostsItem';

const PostsListPlaceholder = ({count, classes}: {
  count: number,
  classes: ClassesType<typeof styles>
}) => {
  let placeholders: Array<React.JSX.Element> = [];
  for(let i=0; i<count; i++) {
    placeholders.push(
      <div key={i} className={classNames(
        classes.root,
        classes.background
      )}>
        <div className={classes.postsItem}>
          <span className={classes.title}>
            <span>{" "}</span>
          </span>
        </div>
      </div>
    )
  }
  return <React.Fragment>{placeholders}</React.Fragment>;
}

export default registerComponent("PostsListPlaceholder", PostsListPlaceholder, {styles});



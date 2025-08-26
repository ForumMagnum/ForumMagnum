import React from 'react';
import classNames from 'classnames';
import { styles } from './LWPostsItem';
import { useStyles } from '../hooks/useStyles';

const PostsListPlaceholder = ({count}: {
  count: number,
}) => {
  const classes = useStyles(styles);
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

export default PostsListPlaceholder;



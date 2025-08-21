import classNames from 'classnames';
import React from 'react';
import { useStyles } from '../hooks/useStyles';
import { styles } from './LWPostsItem';

const LWPlaceholderPostsItem = ({showBottomBorder}: {
  showBottomBorder?: boolean,
}) => {
  const classes = useStyles(styles);
  return <div className={classes.row}>
    <div className={classNames(
      classes.root,
      classes.background,
      { [classes.bottomBorder]: showBottomBorder }
    )}>
      <div className={classes.postsItem}>
        <span className={classes.title}/>
        <div className={classes.mobileSecondRowSpacer}/>
      </div>
    </div>
  </div>
}

export default LWPlaceholderPostsItem;



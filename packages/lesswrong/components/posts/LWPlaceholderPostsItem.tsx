import classNames from 'classnames';
import React from 'react';
import { registerComponent } from "../../lib/vulcan-lib";
import { classes } from './LWPostsItem';

const LWPlaceholderPostsItem = ({showBottomBorder}: {
  showBottomBorder?: boolean,
}) => {
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

const LWPlaceholderPostsItemComponent = registerComponent('LWPlaceholderPostsItem', LWPlaceholderPostsItem);

declare global {
  interface ComponentTypes {
    LWPlaceholderPostsItem: typeof LWPlaceholderPostsItemComponent
  }
}

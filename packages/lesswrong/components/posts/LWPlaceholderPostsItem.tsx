import classNames from 'classnames';
import React from 'react';
import { registerComponent } from "../../lib/vulcan-lib/components";
import { styles } from './LWPostsItem';

const LWPlaceholderPostsItemInner = ({showBottomBorder, classes}: {
  showBottomBorder?: boolean,
  classes: ClassesType<typeof styles>,
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

export const LWPlaceholderPostsItem = registerComponent('LWPlaceholderPostsItem', LWPlaceholderPostsItemInner, {styles});

declare global {
  interface ComponentTypes {
    LWPlaceholderPostsItem: typeof LWPlaceholderPostsItem
  }
}

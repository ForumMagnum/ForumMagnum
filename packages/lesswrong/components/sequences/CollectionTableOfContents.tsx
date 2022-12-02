import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
  root: {

  }
});

export const CollectionTableOfContents = ({classes, collection}: {
  classes: ClassesType,
  collection: CollectionsPageFragment
}) => {
  return <div className={classes.root}>
    
  </div>;
}

const CollectionTableOfContentsComponent = registerComponent('CollectionTableOfContents', CollectionTableOfContents, {styles});

declare global {
  interface ComponentTypes {
    CollectionTableOfContents: typeof CollectionTableOfContentsComponent
  }
}


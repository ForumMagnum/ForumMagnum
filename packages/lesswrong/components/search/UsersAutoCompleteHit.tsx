import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    cursor: "pointer"
  }
});

const UsersAutoCompleteHit = ({document, classes}: {
  document: AlgoliaUser
  classes: ClassesType
}) => {
  if (document) {
    return <div className={classes.root}>
      <Components.MetaInfo>
        {document.displayName}
      </Components.MetaInfo>
      <Components.MetaInfo>
        {document.karma} karma
      </Components.MetaInfo>
      <Components.MetaInfo>
        <Components.FormatDate date={document.createdAt}/>
      </Components.MetaInfo>
    </div>
  } else {
    return <Components.Loading />
  }
};

const UsersAutoCompleteHitComponent = registerComponent('UsersAutoCompleteHit', UsersAutoCompleteHit, {styles});

declare global {
  interface ComponentTypes {
    UsersAutoCompleteHit: typeof UsersAutoCompleteHitComponent
  }
}


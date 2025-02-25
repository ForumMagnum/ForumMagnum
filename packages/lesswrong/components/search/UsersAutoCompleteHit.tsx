import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';

const styles = (theme: ThemeType) => ({
  root: {
    cursor: "pointer"
  }
});

const UsersAutoCompleteHit = ({document, classes}: {
  document: SearchUser
  classes: ClassesType<typeof styles>
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


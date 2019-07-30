import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  root: {
    cursor: "pointer"
  }
});

const UsersAutoCompleteHit = ({document, removeItem, classes}) => {
  if (document) {
    return <div className={classes.root}>
      <Components.MetaInfo>
        {document.displayName}
      </Components.MetaInfo>
      <Components.MetaInfo>
        {document.karma} points
      </Components.MetaInfo>
      <Components.MetaInfo>
        <Components.FormatDate date={document.createdAt}/>
      </Components.MetaInfo>
    </div>
  } else {
    return <Components.Loading />
  }
};
registerComponent('UsersAutoCompleteHit', UsersAutoCompleteHit, withStyles(styles, { name: "UsersAutoCompleteHit"}));

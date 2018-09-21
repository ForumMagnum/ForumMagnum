import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import moment from 'moment';
import defineComponent from '../../lib/defineComponent';

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
        {moment(new Date(document.createdAt)).fromNow()}
      </Components.MetaInfo>
    </div>
  } else {
    return <Components.Loading />
  }
};

export default defineComponent({
  name: 'UsersAutoCompleteHit',
  component: UsersAutoCompleteHit,
  styles: styles,
});

import { Components, registerComponent, withDocument} from 'meteor/vulcan:core';
import Users from 'meteor/vulcan:users';
import React from 'react';
import defineComponent from '../../lib/defineComponent';

const UsersNameWrapper = (props) => {
  if (props.document) {
    return <Components.UsersName user={props.document} />
  } else {
    return <div>{props.documentId}</div>
  }
};

const options = {
  collection: Users,
  queryName: 'UsersNameWrapperQuery',
  fragmentName: 'UsersList',
  limit: 1,
  totalResolver: false,
};

export default defineComponent({
  name: 'UsersNameWrapper',
  component: UsersNameWrapper,
  hocs: [ [withDocument, options] ]
});

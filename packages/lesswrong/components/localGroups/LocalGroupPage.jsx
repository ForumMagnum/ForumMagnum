import { Components, registerComponent, withCurrentUser, getFragment, withMessages, withDocument, getSetting} from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { LocalGroups } from '../../lib/index.js';
import { Posts } from 'meteor/example-forum';
import { withRouter } from 'react-router';

const localGroupColumns = [
  'name',
  'location'
]

class LocalGroupPage extends Component {
  render() {
    const { groupId } = this.props.params;
    if (this.props.document) {
      const { googleLocation: { geometry: { location } } } = this.props.document;
      console.log(location)
      return (
        <div className="local-group-page">
          <Components.CommunityMapWrapper
            terms={{view: "all", groupId: groupId}}
            groupQueryTerms={{view: "single", groupId: groupId}}
            mapOptions={{zoom:11, center: location, initialOpenWindows:[groupId]}}
          />
          <Components.Section title="Description" titleComponent={<Components.NewEventFormLink groupId={groupId}/>}>
            {this.props.document && this.props.document.description && <Components.DraftJSRenderer content={this.props.document.description}/>}
            <Components.Datatable
              collection={Posts}
              columns={localGroupColumns}
              options={{
                fragmentName: 'LWPostsList',
                terms: {view: 'all', groupId: groupId},
              }}
              showEdit={true}
            />
          </Components.Section>
        </div>
      )
    } else {
      return <Components.Loading />
    }

  }
}

const options = {
  collection: LocalGroups,
  queryName: 'LocalGroupPageQuery',
  fragmentName: 'localGroupsHomeFragment',
};

registerComponent('LocalGroupPage', LocalGroupPage, withCurrentUser, withMessages, withRouter, [withDocument, options]);

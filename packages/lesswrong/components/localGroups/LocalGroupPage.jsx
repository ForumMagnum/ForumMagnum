import { Components, registerComponent, withCurrentUser, getFragment, withMessages, withDocument, getSetting} from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { Localgroups } from '../../lib/index.js';
import { withRouter, Link } from 'react-router';
import { Posts } from 'meteor/example-forum';

class LocalGroupPage extends Component {
  renderTitleComponent = () => {
    const { groupId } = this.props.params;
    const group = this.props.document;
    return (
      <div>
        <div className="local-group-location">{group.location }</div>
        {this.props.currentUser && <div><Components.SubscribeTo document={group} /></div>}
        {Posts.options.mutations.new.check(this.props.currentUser)
          && <div><Link to={{pathname:"/newPost", query: {eventForm: true, groupId}}}> Create new event </Link></div>}
        {Posts.options.mutations.new.check(this.props.currentUser)
          && <div><Link to={{pathname:"/newPost", query: {groupId}}}> Create new group post </Link></div>}
        {Localgroups.options.mutations.edit.check(this.props.currentUser, group)
          && <div><Components.GroupFormLink documentId={groupId} label="Edit group" /></div>}
      </div>
    )
  }
  render() {
    const { groupId } = this.props.params;
    if (this.props.document) {
      const { googleLocation: { geometry: { location } } } = this.props.document;
      return (
        <div className="local-group-page">
          <Components.CommunityMapWrapper
            terms={{view: "events", groupId: groupId}}
            groupQueryTerms={{view: "single", groupId: groupId}}
            mapOptions={{zoom:11, center: location, initialOpenWindows:[groupId]}}
          />
          <Components.Section title={this.props.document.name} titleComponent={this.renderTitleComponent()}>
            {this.props.document && this.props.document.description && <div className="local-groups-description content-body">
              <Components.DraftJSRenderer content={this.props.document.description}/>
            </div>}
            <Components.PostsList terms={{view: 'groupPosts', groupId: groupId}} showHeader={false} />
          </Components.Section>
        </div>
      )
    } else {
      return <Components.Loading />
    }

  }
}

const options = {
  collection: Localgroups,
  queryName: 'LocalGroupPageQuery',
  fragmentName: 'localGroupsHomeFragment',
};

registerComponent('LocalGroupPage', LocalGroupPage, withCurrentUser, withMessages, withRouter, [withDocument, options]);

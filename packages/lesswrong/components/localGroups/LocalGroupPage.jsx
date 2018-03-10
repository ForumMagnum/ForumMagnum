import { Components, registerComponent, withCurrentUser, getFragment, withMessages, withDocument, getSetting} from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { LocalGroups } from '../../lib/index.js';
import { withRouter, Link } from 'react-router';

class LocalGroupPage extends Component {
  renderTitleComponent = () => {
    const { groupId } = this.props.params;
    return (
      <div>
        <div className="local-group-location">{this.props.document.location }</div>
        <div><Link to={{pathname:"/newPost", query: {eventForm: true, groupId}}}> Create new event </Link></div>
        <div><Link to={{pathname:"/newPost", query: {groupId}}}> Create new group post </Link></div>
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
  collection: LocalGroups,
  queryName: 'LocalGroupPageQuery',
  fragmentName: 'localGroupsHomeFragment',
};

registerComponent('LocalGroupPage', LocalGroupPage, withCurrentUser, withMessages, withRouter, [withDocument, options]);

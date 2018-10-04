import { Components, registerComponent, withMessages, withDocument } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { Localgroups } from '../../lib/index.js';
import { withRouter, Link } from 'react-router';
import { Posts } from 'meteor/example-forum';
import withUser from '../common/withUser';
import { withStyles } from '@material-ui/core/styles';
import { postBodyStyles } from '../../themes/stylePiping'

const styles = theme => ({
  groupName: {
    ...theme.typography.headerStyle,
    
    marginTop: "0px",
    marginBottom: "0.5rem"
  },
  groupSubtitle: {
  },
  groupLocation: {
    ...theme.typography.body2,
    
    display: "inline-block",
    color: "rgba(0,0,0,0.7)",
  },
  groupLinks: {
    display: "inline-block",
    marginTop: "-7px",
    marginLeft: "10px",
    marginBottom: "20px",
  },
  groupDescription: {
    ...postBodyStyles(theme),
    
    marginLeft: "24px",
    
    [theme.breakpoints.down('xs')]: {
      marginLeft: 0
    }
  },
});

class LocalGroupPage extends Component {
  renderTitleComponent = () => {
    const { groupId } = this.props.params;
    const group = this.props.document;
    return (
      <div>
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
    const { classes } = this.props;
    const { groupId } = this.props.params;
    const group = this.props.document;
    if (this.props.document) {
      const { googleLocation: { geometry: { location } }} = group;
      return (
        <div className="local-group-page">
          <Components.CommunityMapWrapper
            terms={{view: "events", groupId: groupId}}
            groupQueryTerms={{view: "single", groupId: groupId}}
            mapOptions={{zoom:11, center: location, initialOpenWindows:[groupId]}}
          />
          <Components.Section titleComponent={this.renderTitleComponent()}>
            {this.props.document && this.props.document.description && <div className={classes.groupDescription}>
              <h2 className={classes.groupName}>{group.name}</h2>
              <div className={classes.groupSubtitle}>
                <div className={classes.groupLocation}>{group.location}</div>
                <div className={classes.groupLinks}><Components.GroupLinks document={group} /></div>
              </div>
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

registerComponent('LocalGroupPage', LocalGroupPage,
  withUser, withMessages, withRouter,
  withStyles(styles, { name: "LocalGroupPage" }),
  [withDocument, options]);

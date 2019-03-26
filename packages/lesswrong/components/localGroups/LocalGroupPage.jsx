import { Components, registerComponent, withMessages, withDocument } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { Localgroups } from '../../lib/index.js';
import { withRouter, Link } from 'react-router';
import { Posts } from '../../lib/collections/posts';
import withUser from '../common/withUser';
import { withStyles } from '@material-ui/core/styles';
import { postBodyStyles } from '../../themes/stylePiping'
import Typography from '@material-ui/core/Typography';

const styles = theme => ({
  root: {
    marginTop: 500,
  },
  groupSidebar: {
    // HACK/TODO: Move the group page action links down past the title and
    // metadata lines so they line up with the description.
    marginTop: "93px",
  },

  groupName: {
    ...theme.typography.headerStyle,
    fontSize: "30px",

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
    marginLeft: "24px",
    marginBottom: "30px",

    [theme.breakpoints.down('xs')]: {
      marginLeft: 0
    }
  },

  groupDescriptionBody: {
    ...postBodyStyles(theme),
  }
});

class LocalGroupPage extends Component {
  renderTitleComponent = () => {
    const { classes } = this.props;
    const { groupId } = this.props.params;
    const group = this.props.document;
    return (
      <div className={classes.groupSidebar}>
        {this.props.currentUser
          && <Components.SectionSubtitle>
            <Components.SubscribeTo document={group} />
          </Components.SectionSubtitle>}
        {Posts.options.mutations.new.check(this.props.currentUser)
          && <Components.SectionSubtitle>
            <Link to={{pathname:"/newPost", query: {eventForm: true, groupId}}}>
              Create new event
            </Link>
          </Components.SectionSubtitle>}
        {Posts.options.mutations.new.check(this.props.currentUser)
          && <Components.SectionSubtitle>
            <Link to={{pathname:"/newPost", query: {groupId}}}>
              Create new group post
            </Link>
          </Components.SectionSubtitle>}
        {Localgroups.options.mutations.edit.check(this.props.currentUser, group)
          && <Components.GroupFormLink documentId={groupId} label="Edit group" />}
      </div>
    )
  }
  render() {
    const { classes } = this.props;
    const { groupId } = this.props.params;
    const group = this.props.document;
    const { html = ""} = (group && group.contents) || {}
    const htmlBody = {__html: html}
    if (this.props.document) {
      const { googleLocation: { geometry: { location } }} = group;
      return (
        <div className={classes.root}>
          <Components.CommunityMapWrapper
            terms={{view: "events", groupId: groupId}}
            groupQueryTerms={{view: "single", groupId: groupId}}
            mapOptions={{zoom:11, center: location, initialOpenWindows:[groupId]}}
          />
          <Components.Section titleComponent={this.renderTitleComponent()}>
            {group && <div className={classes.groupDescription}>
              <Typography variant="display2" className={classes.groupName}>{group.name}</Typography>
              <div className={classes.groupSubtitle}>
                <div className={classes.groupLocation}>{group.location}</div>
                <div className={classes.groupLinks}><Components.GroupLinks document={group} /></div>
              </div>
              <div dangerouslySetInnerHTML={htmlBody} className={classes.groupDescriptionBody}/>
            </div>}
            <Components.PostsList terms={{view: 'groupPosts', groupId: groupId}} />
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

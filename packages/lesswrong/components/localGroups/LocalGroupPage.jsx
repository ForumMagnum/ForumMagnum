import { Components, registerComponent, withMessages, withDocument } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { Localgroups } from '../../lib/index.js';
import { Link } from '../../lib/reactRouterWrapper.js';
import { withLocation } from '../../lib/routeUtil';
import { Posts } from '../../lib/collections/posts';
import withUser from '../common/withUser';
import { withStyles } from '@material-ui/core/styles';
import { postBodyStyles } from '../../themes/stylePiping'
import { sectionFooterLeftStyles } from '../users/UsersProfile'
import qs from 'qs'

const styles = theme => ({
  root: {
    marginTop: 500,
  },
  groupInfo: {
    ...sectionFooterLeftStyles
  },
  groupName: {
    ...theme.typography.headerStyle,
    fontSize: "30px",
    marginTop: "0px",
    marginBottom: "0.5rem"
  },
  groupSubtitle: {
    marginBottom: theme.spacing.unit * 2
  },
  leftAction: {
    [theme.breakpoints.down('xs')]: {
      textAlign: 'left'
    }
  },
  groupLocation: {
    ...theme.typography.body1,
    display: "inline-block",
    color: "rgba(0,0,0,0.7)",
    maxWidth: 260
  },
  groupLinks: {
    display: "inline-block",
  },
  groupDescription: {
    marginBottom: "30px",
    [theme.breakpoints.down('xs')]: {
      marginLeft: 0
    }
  },
  groupDescriptionBody: {
    ...postBodyStyles(theme),
    padding: theme.spacing.unit,
  }
});

class LocalGroupPage extends Component {
  render() {
    const { classes, document:group, currentUser } = this.props;
    const { params } = this.props.location;
    const { groupId } = params;
    const { CommunityMapWrapper, SingleColumnSection, SectionTitle, GroupLinks, PostsList2, Loading,
      SectionButton, SubscribeTo, SectionFooter, GroupFormLink, ContentItemBody } = Components
    if (!group) return <Loading />
    const { html = ""} = group.contents || {}
    const htmlBody = {__html: html}

    const { googleLocation: { geometry: { location } }} = group;
    return (
      <div className={classes.root}>
        <CommunityMapWrapper
          terms={{view: "events", groupId: groupId}}
          groupQueryTerms={{view: "single", groupId: groupId}}
          mapOptions={{zoom:11, center: location, initialOpenWindows:[groupId]}}
        />
        <SingleColumnSection>
          <SectionTitle title={group.name}>
            {currentUser && <SectionButton>
              <SubscribeTo document={group} />
            </SectionButton>}
          </SectionTitle>
          <div className={classes.groupDescription}>
            <div className={classes.groupSubtitle}>
              <SectionFooter>
                <span className={classes.groupInfo}>
                  <div className={classes.groupLocation}>{group.location}</div>
                  <div className={classes.groupLinks}><GroupLinks document={group} /></div>
                </span>
                {Posts.options.mutations.new.check(currentUser) &&
                  <SectionButton>
                    <Link to={{pathname:"/newPost", search: `?${qs.stringify({eventForm: true, groupId})}`}} className={classes.leftAction}>
                      Create new event
                    </Link>
                  </SectionButton>}
                {Posts.options.mutations.new.check(this.props.currentUser) &&
                  <SectionButton>
                    <Link to={{pathname:"/newPost", search: `?${qs.stringify({groupId})}`}} className={classes.leftAction}>
                      Create new group post
                    </Link>
                  </SectionButton>}
                {Localgroups.options.mutations.edit.check(this.props.currentUser, group)
                && <span className={classes.leftAction}><GroupFormLink documentId={groupId} label="Edit group" /></span>}
              </SectionFooter>
            </div>
            <ContentItemBody dangerouslySetInnerHTML={htmlBody} className={classes.groupDescriptionBody}/>
          </div>
          <PostsList2 terms={{view: 'groupPosts', groupId: groupId}} />
        </SingleColumnSection>
      </div>
    )
  }
}

const options = {
  collection: Localgroups,
  queryName: 'LocalGroupPageQuery',
  fragmentName: 'localGroupsHomeFragment',
};

registerComponent('LocalGroupPage', LocalGroupPage,
  withUser, withMessages, withLocation,
  withStyles(styles, { name: "LocalGroupPage" }),
  [withDocument, options]);

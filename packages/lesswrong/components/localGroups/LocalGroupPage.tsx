import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useSingle } from '../../lib/crud/withSingle';
import React from 'react';
import { Localgroups } from '../../lib/collections/localgroups/collection';
import { Link } from '../../lib/reactRouterWrapper';
import { Posts } from '../../lib/collections/posts';
import { useCurrentUser } from '../common/withUser';
import { createStyles } from '@material-ui/core/styles';
import { postBodyStyles } from '../../themes/stylePiping'
import { sectionFooterLeftStyles } from '../users/UsersProfile'
import qs from 'qs'
import { userIsAdmin } from '../../lib/vulcan-users';
import { forumTypeSetting } from '../../lib/instanceSettings';

const styles = createStyles((theme: ThemeType): JssStyles => ({
  root: {},
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
    ...theme.typography.body2,
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
}));

const LocalGroupPage = ({ classes, documentId: groupId }: {
  classes: ClassesType,
  documentId: string,
  groupId?: string,
}) => {
  const currentUser = useCurrentUser();
  const { CommunityMapWrapper, SingleColumnSection, SectionTitle, GroupLinks, PostsList2, Loading,
    SectionButton, SubscribeTo, SectionFooter, GroupFormLink, ContentItemBody, Error404 } = Components

  const { document: group, loading } = useSingle({
    collectionName: "Localgroups",
    fragmentName: 'localGroupsHomeFragment',
    documentId: groupId
  })

  if (loading) return <Loading />
  if (!group) return <Error404 />

  const { html = ""} = group.contents || {}
  const htmlBody = {__html: html}
  const isAdmin = userIsAdmin(currentUser);
  const isEAForum = forumTypeSetting.get() === 'EAForum';

  const { googleLocation: { geometry: { location } }} = group;
  return (
    <div className={classes.root}>
      <CommunityMapWrapper
        terms={{view: "events", groupId: groupId}}
        groupQueryTerms={{view: "single", groupId: groupId}}
        mapOptions={{zoom:11, center: location, initialOpenWindows:[groupId]}}
      />
      <SingleColumnSection>
        <SectionTitle title={`${group.inactive ? "[Inactive] " : " "}${group.name}`}>
          {currentUser && <SectionButton>
            <SubscribeTo
              showIcon
              document={group}
              subscribeMessage="Subscribe to group"
              unsubscribeMessage="Unsubscribe from group"
            />
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
                <React.Fragment>
                  {(!isEAForum || isAdmin) && <SectionButton>
                    <Link to={{pathname:"/newPost", search: `?${qs.stringify({eventForm: true, groupId})}`}} className={classes.leftAction}>
                      New event
                    </Link>
                  </SectionButton>}
                  <SectionButton>
                    <Link to={{pathname:"/newPost", search: `?${qs.stringify({groupId})}`}} className={classes.leftAction}>
                      New group post
                    </Link>
                  </SectionButton>
                </React.Fragment>}
              {Localgroups.options.mutations.edit.check(currentUser, group) && 
                <span className={classes.leftAction}><GroupFormLink documentId={groupId} /></span>
              }
            </SectionFooter>
          </div>
          <ContentItemBody
            dangerouslySetInnerHTML={htmlBody}
            className={classes.groupDescriptionBody}
            description={`group ${groupId}`}
          />
        </div>
        <PostsList2 terms={{view: 'groupPosts', groupId: groupId}} />
      </SingleColumnSection>
    </div>
  )
}

const LocalGroupPageComponent = registerComponent('LocalGroupPage', LocalGroupPage, {styles});

declare global {
  interface ComponentTypes {
    LocalGroupPage: typeof LocalGroupPageComponent
  }
}


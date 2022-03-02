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
import { useMulti } from '../../lib/crud/withMulti';
import classNames from 'classnames';

const styles = createStyles((theme: ThemeType): JssStyles => ({
  root: {},
  topSection: {
    [theme.breakpoints.up('md')]: {
      marginTop: -50,
    }
  },
  imageContainer: {
    height: 200,
    [theme.breakpoints.up('md')]: {
      marginTop: -50,
    },
    [theme.breakpoints.down('sm')]: {
      marginLeft: -4,
      marginRight: -4,
    }
  },
  groupInfo: {
    ...sectionFooterLeftStyles,
    alignItems: 'baseline'
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
    alignSelf: "center",
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
    marginBottom: 20,
    [theme.breakpoints.down('xs')]: {
      marginLeft: 0
    }
  },
  groupDescriptionBody: {
    ...postBodyStyles(theme),
    padding: theme.spacing.unit,
  },
  eventsHeadline: {
    marginTop: 40,
    marginBottom: 16,
  },
  eventCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 373px)',
    gridGap: '20px',
    '@media (max-width: 812px)': {
      gridTemplateColumns: 'auto',
    }
  },
  noUpcomingEvents: {
    color: theme.palette.grey[500],
  },
  notifyMeButton: {
    display: 'inline !important',
    color: theme.palette.primary.main,
  },
  pastEventCard: {
    height: 350,
    filter: 'saturate(0.3) opacity(0.8)',
    '& .EventCards-addToCal': {
      display: 'none'
    }
  },
  mapContainer: {
    height: 200,
    marginTop: 50,
    marginLeft: 'auto',
    marginRight: 'auto'
  },
}));

const LocalGroupPage = ({ classes, documentId: groupId }: {
  classes: ClassesType,
  documentId: string,
  groupId?: string,
}) => {
  const currentUser = useCurrentUser();
  const {
    HeadTags, CommunityMapWrapper, SingleColumnSection, SectionTitle, GroupLinks, PostsList2,
    Loading, SectionButton, NotifyMeButton, SectionFooter, GroupFormLink, ContentItemBody,
    Error404, CloudinaryImage, EventCards, LoadMore
  } = Components

  const { document: group, loading: groupLoading } = useSingle({
    collectionName: "Localgroups",
    fragmentName: 'localGroupsHomeFragment',
    documentId: groupId
  })
  
  const {
    results: upcomingEvents,
    loading: upcomingEventsLoading,
    loadMoreProps: upcomingEventsLoadMoreProps
  } = useMulti({
    terms: {view: 'upcomingEvents', groupId: groupId},
    collectionName: "Posts",
    fragmentName: 'PostsList',
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: "cache-first",
    limit: 2,
    itemsPerPage: 6,
    enableTotal: true,
  });
  const {
    results: tbdEvents,
    loading: tbdEventsLoading,
    loadMoreProps: tbdEventsLoadMoreProps
  } = useMulti({
    terms: {view: 'tbdEvents', groupId: groupId},
    collectionName: "Posts",
    fragmentName: 'PostsList',
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: "cache-first",
    limit: 2,
    itemsPerPage: 6,
    enableTotal: true,
  });
  const {
    results: pastEvents,
    loading: pastEventsLoading,
    loadMoreProps: pastEventsLoadMoreProps
  } = useMulti({
    terms: {view: 'pastEvents', groupId: groupId},
    collectionName: "Posts",
    fragmentName: 'PostsList',
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: "cache-first",
    limit: 2,
    itemsPerPage: 6,
    enableTotal: true,
  });

  if (groupLoading) return <Loading />
  if (!group) return <Error404 />

  const { html = ""} = group.contents || {}
  const htmlBody = {__html: html}
  const isAdmin = userIsAdmin(currentUser);
  const isGroupAdmin = currentUser && group.organizerIds.includes(currentUser._id);
  const isEAForum = forumTypeSetting.get() === 'EAForum';
  
  // by default, we try to show the map at the top if the group has a location
  let topSection = group.googleLocation ? <CommunityMapWrapper
    className={classes.imageContainer}
    terms={{view: "events", groupId: groupId}}
    groupQueryTerms={{view: "single", groupId: groupId}}
    hideLegend={true}
    mapOptions={{zoom:11, center: group.googleLocation.geometry.location, initialOpenWindows:[groupId]}}
  /> : <div className={classes.topSection}></div>;
  let bottomSection;
  // if the group has a banner image, show that at the top instead, and move the map to the bottom
  if (group.bannerImageId) {
    topSection = <div className={classes.imageContainer}>
      <CloudinaryImage
        publicId={group.bannerImageId}
        width="auto"
        height={200}
      />
    </div>
    bottomSection = group.googleLocation && <CommunityMapWrapper
      className={classes.mapContainer}
      terms={{view: "events", groupId: groupId}}
      groupQueryTerms={{view: "single", groupId: groupId}}
      hideLegend={true}
      mapOptions={{zoom:11, center: group.googleLocation.geometry.location, initialOpenWindows:[groupId]}}
    />
  }

  return (
    <div className={classes.root}>
      <HeadTags
        title={group.name}
        description={group.contents?.plaintextDescription}
        image={group.bannerImageId && `https://res.cloudinary.com/cea/image/upload/q_auto,f_auto/${group.bannerImageId}.jpg`}
      />
      {topSection}
      <SingleColumnSection>
        <SectionTitle title={`${group.inactive ? "[Inactive] " : " "}${group.name}`}>
          {currentUser && <SectionButton>
            <NotifyMeButton
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
                <div className={classes.groupLocation}>{group.isOnline ? 'Online Group' : group.location}</div>
                <div className={classes.groupLinks}><GroupLinks document={group} /></div>
              </span>
              {Posts.options.mutations.new.check(currentUser) &&
                (!isEAForum || isAdmin || isGroupAdmin) && <SectionButton>
                  <Link to={{pathname:"/newPost", search: `?${qs.stringify({eventForm: true, groupId})}`}} className={classes.leftAction}>
                    New event
                  </Link>
                </SectionButton>}
              {Localgroups.options.mutations.edit.check(currentUser, group) &&
               (!isEAForum || isAdmin || isGroupAdmin ) && 
                <span className={classes.leftAction}><GroupFormLink documentId={groupId} /></span>
              }
            </SectionFooter>
          </div>
          {group.contents && <ContentItemBody
            dangerouslySetInnerHTML={htmlBody}
            className={classes.groupDescriptionBody}
            description={`group ${groupId}`}
          />}
        </div>

        <PostsList2 terms={{view: 'nonEventGroupPosts', groupId: groupId}} showNoResults={false} />

        <Components.Typography variant="headline" className={classes.eventsHeadline}>
          Upcoming Events
        </Components.Typography>
        {!!upcomingEvents?.length ? (
          <div className={classes.eventCards}>
            <EventCards
              events={upcomingEvents}
              loading={upcomingEventsLoading}
              numDefaultCards={2}
              hideSpecialCards
              hideGroupNames
            />
            <LoadMore {...upcomingEventsLoadMoreProps}  />
          </div>
        ) : <Components.Typography variant="body2" className={classes.noUpcomingEvents}>No upcoming events.{' '}
            <NotifyMeButton
              showIcon={false}
              document={group}
              subscribeMessage="Subscribe to be notified when an event is added."
              componentIfSubscribed={<span>We'll notify you when an event is added.</span>}
              className={classes.notifyMeButton}
            />
          </Components.Typography>}

        {!!tbdEvents?.length && <>
          <Components.Typography variant="headline" className={classes.eventsHeadline}>
            Events Yet To Be Scheduled
          </Components.Typography>
          <div className={classes.eventCards}>
            <EventCards
              events={tbdEvents}
              loading={tbdEventsLoading}
              hideSpecialCards
              hideGroupNames
            />
            <LoadMore {...tbdEventsLoadMoreProps}  />
          </div>
        </>}

        {!!pastEvents?.length && <>
          <Components.Typography variant="headline" className={classes.eventsHeadline}>
            Past Events
          </Components.Typography>
          <div className={classes.eventCards}>
            <EventCards
              events={pastEvents}
              loading={pastEventsLoading}
              hideSpecialCards
              hideGroupNames
              cardClassName={classes.pastEventCard}
            />
            <LoadMore {...pastEventsLoadMoreProps}  />
          </div>
        </>}

        {bottomSection}
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

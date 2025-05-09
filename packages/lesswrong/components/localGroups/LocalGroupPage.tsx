import { registerComponent } from '../../lib/vulcan-lib/components';
import { useSingle } from '../../lib/crud/withSingle';
import React from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import { userCanPost } from '@/lib/collections/users/helpers';
import { useCurrentUser } from '../common/withUser';
import qs from 'qs'
import { userCanDo, userIsAdmin } from '../../lib/vulcan-users/permissions';
import { isEAForum, isLWorAF } from '../../lib/instanceSettings';
import { useMulti } from '../../lib/crud/withMulti';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import { FacebookIcon, MeetupIcon, RoundFacebookIcon, SlackIcon } from './GroupLinks';
import EmailIcon from '@/lib/vendor/@material-ui/icons/src/Email';
import LocationIcon from '@/lib/vendor/@material-ui/icons/src/LocationOn';
import { GROUP_CATEGORIES } from "@/lib/collections/localgroups/groupTypes";
import { preferredHeadingCase } from '../../themes/forumTheme';
import Person from '@/lib/vendor/@material-ui/icons/src/Person';
import { ForumIcon } from "../common/ForumIcon";
import { HeadTags } from "../common/HeadTags";
import { CommunityMapWrapper } from "./CommunityMapWrapper";
import { SingleColumnSection } from "../common/SingleColumnSection";
import { SectionTitle } from "../common/SectionTitle";
import { PostsList2 } from "../posts/PostsList2";
import { Loading } from "../vulcan-core/Loading";
import { SectionButton } from "../common/SectionButton";
import { NotifyMeButton } from "../notifications/NotifyMeButton";
import { SectionFooter } from "../common/SectionFooter";
import { GroupFormLink } from "./GroupFormLink";
import { ContentItemBody } from "../common/ContentItemBody";
import { Error404 } from "../common/Error404";
import { CloudinaryImage2 } from "../common/CloudinaryImage2";
import { EventCards } from "../events/modules/EventCards";
import { LoadMore } from "../common/LoadMore";
import { ContentStyles } from "../common/ContentStyles";
import { Typography } from "../common/Typography";
import { HoverOver } from "../common/HoverOver";
import { LocalGroupSubscribers } from "./LocalGroupSubscribers";
import { UsersNameDisplay } from "../users/UsersNameDisplay";

const styles = (theme: ThemeType) => ({
  root: {},
  topSection: {
    [theme.breakpoints.up('md')]: {
      marginTop: -theme.spacing.mainLayoutPaddingTop,
    }
  },
  topSectionMap: {
    height: 250,
    [theme.breakpoints.up('md')]: {
      marginTop: -theme.spacing.mainLayoutPaddingTop,
    },
    [theme.breakpoints.down('sm')]: {
      marginLeft: -8,
      marginRight: -8,
    },
  },
  imageContainer: {
    [theme.breakpoints.up('md')]: {
      marginTop: -theme.spacing.mainLayoutPaddingTop,
    },
    [theme.breakpoints.down('sm')]: {
      marginLeft: -8,
      marginRight: -8,
    },
  },
  bannerImg: {
    display: 'block',
    maxWidth: '100%',
    objectFit: 'cover',
    margin: '0 auto',
  },
  titleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    columnGap: 20,
    marginTop: 24,
    [theme.breakpoints.down('xs')]: {
      display: 'block',
    },
  },
  inactiveGroupTag: {
    color: theme.palette.grey[500],
    marginRight: 10
  },
  notifyMe: {
    justifyContent: 'flex-end',
    margin: '8px 4px 20px',
    [theme.breakpoints.down('xs')]: {
      justifyContent: 'flex-start',
      marginTop: 30
    }
  },
  organizerActions: {
    [theme.breakpoints.down('xs')]: {
      justifyContent: 'flex-start !important'
    }
  },
  groupName: {
    ...theme.typography.headerStyle,
    fontSize: "30px",
    marginTop: "0px",
    marginBottom: "0.5rem"
  },
  groupOrganizers: {
    display: "flex",
    alignItems: 'center',
    ...theme.typography.body2,
    color: theme.palette.text.slightlyDim2,
    marginBottom: 5,
  },
  organizedBy: {
    marginLeft: 5,
  },
  groupLocation: {
    ...theme.typography.body2,
    display: "flex",
    columnGap: 5,
    alignItems: 'center',
    color: theme.palette.text.slightlyDim2,
  },
  groupLocationIcon: {
    fontSize: 20
  },
  organizersIcon: {
    fontSize: 20
  },
  groupCategories: {
    display: 'flex',
    columnGap: 10,
    marginTop: theme.spacing.unit * 2
  },
  groupCategory: {
    backgroundColor: theme.palette.panelBackground.default,
    fontFamily: theme.typography.fontFamily,
    fontSize: 12,
    color: theme.palette.grey[600],
    padding: '6px 12px',
    border: `1px solid ${theme.palette.grey[0]}`,
    borderColor: theme.palette.grey[300],
    borderRadius: 4
  },
  groupDescription: {
    marginTop: theme.spacing.unit * 3,
    marginBottom: 20,
    [theme.breakpoints.down('xs')]: {
      marginLeft: 0
    }
  },
  groupDescriptionBody: {
    padding: theme.spacing.unit,
  },
  contactUsSection: {
    display: 'flex',
    justifyContent: 'space-between',
    columnGap: '40px',
    marginTop: 40,
    [theme.breakpoints.down('xs')]: {
      display: 'block'
    },
  },
  externalLinkBtns: {
    flex: 'none',
  },
  externalLinkBtnRow: {
    marginBottom: 16
  },
  externalLinkBtn: {
    textTransform: 'none',
    fontSize: 13,
    paddingLeft: 14,
    boxShadow: 'none',
    '& svg': {
      width: 17,
      marginRight: 10
    }
  },
  facebookGroupIcon: {
    fontSize: 13,
  },
  facebookPageIcon: {
    fontSize: 14,
  },
  meetupIcon: {
    fontSize: 15,
  },
  slackIcon: {
    fontSize: 14,
  },
  linkIcon: {
    fontSize: 17,
  },
  emailIcon: {
    fontSize: 17,
  },
  contactUsHeadline: {
    marginBottom: 16,
    ...(isEAForum && {
      fontFamily: theme.palette.fonts.sansSerifStack,
      fontWeight: 500,
    }),
  },
  eventsHeadline: {
    marginTop: 40,
    marginBottom: 16,
    ...(isEAForum && {
      fontFamily: theme.palette.fonts.sansSerifStack,
      fontWeight: 500,
    }),
  },
  eventCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 373px)',
    gridGap: '20px',
    '@media (max-width: 812px)': {
      gridTemplateColumns: 'auto',
    }
  },
  loading: {
    marginLeft: 0
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
    height: 260,
    maxWidth: 450,
    marginTop: 0,
    marginLeft: 0,
    marginRight: 0,
    [theme.breakpoints.down('xs')]: {
      height: 200,
      maxWidth: 'none'
    },
  }
});

const LocalGroupPageInner = ({ classes, documentId: groupId }: {
  classes: ClassesType<typeof styles>,
  documentId: string,
  groupId?: string,
}) => {
  const currentUser = useCurrentUser();
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
  if (!group || group.deleted) return <Error404 />

  const { html = ""} = group.contents || {}
  const htmlBody = {__html: html ?? ""}
  const isAdmin = userIsAdmin(currentUser);
  const isGroupAdmin = currentUser && group.organizerIds.includes(currentUser._id);

  const groupNameHeading = <span>
    {group.inactive ? <span className={classes.inactiveGroupTag}>[Inactive]</span> : null}{group.name}
  </span>

  // by default, we try to show the map at the top if the group has a location
  let topSection = (group.googleLocation && !group.isOnline) ? <CommunityMapWrapper
    className={classes.topSectionMap}
    terms={{view: "events", groupId: groupId}}
    groupQueryTerms={{view: "single", groupId: groupId}}
    hideLegend={true}
    mapOptions={{zoom: 11, center: group.googleLocation.geometry.location, initialOpenWindows:[groupId]}}
  /> : <div className={classes.topSection}></div>;
  let smallMap: React.ReactNode;
  // if the group has a banner image, show that at the top instead, and move the map down
  if (group.bannerImageId) {
    topSection = <div className={classes.imageContainer}>
      <CloudinaryImage2 imgProps={{ar: '191:100', w: '765'}} publicId={group.bannerImageId} className={classes.bannerImg} />
    </div>
    smallMap = (group.googleLocation && !group.isOnline) && <CommunityMapWrapper
      className={classes.mapContainer}
      terms={{view: "events", groupId: groupId}}
      groupQueryTerms={{view: "single", groupId: groupId}}
      hideLegend={true}
      mapOptions={{zoom: 5, center: group.googleLocation.geometry.location}}
    />
  }
  
  const groupHasContactInfo = group.facebookLink || group.facebookPageLink || group.meetupLink || group.slackLink || group.website || group.contactInfo
  
  // the EA Forum shows the group's events as event cards instead of post list items
  let upcomingEventsList = <PostsList2 terms={{view: 'upcomingEvents', groupId: groupId}} />
  if (isEAForum) {
    upcomingEventsList = !!upcomingEvents?.length ? (
      <div className={classes.eventCards}>
        <EventCards
          events={upcomingEvents}
          loading={upcomingEventsLoading}
          numDefaultCards={2}
          hideSpecialCards
          hideGroupNames
        />
        <LoadMore {...upcomingEventsLoadMoreProps} loadingClassName={classes.loading} />
      </div>
    ) : <Typography variant="body2" className={classes.noUpcomingEvents}>No upcoming events.{' '}
        <NotifyMeButton
          showIcon={false}
          document={group}
          subscribeMessage="Subscribe to be notified when an event is added."
          componentIfSubscribed={<span>We'll notify you when an event is added.</span>}
          className={classes.notifyMeButton}
        />
      </Typography>
  }
  
  let tbdEventsList: React.JSX.Element|null = <PostsList2 terms={{view: 'tbdEvents', groupId: groupId}} showNoResults={false} />
  if (isEAForum) {
    tbdEventsList = tbdEvents?.length ? <>
      <Typography variant="headline" className={classes.eventsHeadline}>
        Events yet to be scheduled
      </Typography>
      <div className={classes.eventCards}>
        <EventCards
          events={tbdEvents}
          loading={tbdEventsLoading}
          hideSpecialCards
          hideGroupNames
        />
        <LoadMore {...tbdEventsLoadMoreProps}  />
      </div>
    </> : null
  }
  
  let pastEventsList: React.JSX.Element|null = <>
    <Typography variant="headline" className={classes.eventsHeadline}>
      Past Events
    </Typography>
    <PostsList2 terms={{view: 'pastEvents', groupId: groupId}} />
  </>
  if (isEAForum) {
    pastEventsList = pastEvents?.length ? <>
      <Typography variant="headline" className={classes.eventsHeadline}>
        Past events
      </Typography>
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
    </> : null
  }
  
  const canCreateEvent = currentUser && userCanPost(currentUser);
  const canEditGroup = (currentUser && group)
    && group.organizerIds.includes(currentUser._id)
      ? userCanDo(currentUser, 'localgroups.edit.own')
      : userCanDo(currentUser, `localgroups.edit.all`)

  return (
    <div className={classes.root}>
      <HeadTags
        title={group.name}
        description={group.contents?.plaintextDescription}
        image={group.bannerImageId && `https://res.cloudinary.com/cea/image/upload/q_auto,f_auto/${group.bannerImageId}.jpg`}
      />
      {topSection}
      <SingleColumnSection>
        <div className={classes.titleRow}>
          <div>
            {isEAForum ? <Typography variant="display1" className={classes.groupName}>
              {groupNameHeading}
            </Typography> : <SectionTitle title={groupNameHeading} noTopMargin />}

            {!isEAForum && <div className={classes.groupOrganizers}>
              <Person className={classes.organizersIcon}/>
              <div className={classes.organizedBy}>
                Organized by: {group.organizers.map((user, i) => <>
                  {(i>0) && <>,&nbsp;</>}
                  <UsersNameDisplay user={user} tooltipPlacement="bottom-start"/>
                </>)}
              </div>
            </div>}

            <div className={classes.groupLocation}>
              <LocationIcon className={classes.groupLocationIcon} />
              {group.isOnline ? 'Online Group' : group.location}
            </div>
            {group.categories?.length > 0 && <div className={classes.groupCategories}>
              {group.categories.map(category => {
                return <div key={category} className={classes.groupCategory}>{GROUP_CATEGORIES.find(option => option.value === category)?.label}</div>
              })}
            </div>}
          </div>
          <div>
            {currentUser && <SectionButton className={classes.notifyMe}>
              <NotifyMeButton
                showIcon
                document={group}
                subscribeMessage="Subscribe to group"
                unsubscribeMessage="Unsubscribe from group"
              />
            </SectionButton>}
            <SectionFooter className={classes.organizerActions}>
              {canCreateEvent &&
                (!isEAForum || isAdmin || isGroupAdmin) && <SectionButton>
                  <HoverOver
                    disabled={!isLWorAF}
                    title={<div>
                      Note: If this is a recurring event, you might want to open the menu on a previous event and choose Duplicate Event.
                    </div>}
                  >
                    <Link to={`/newPost?${qs.stringify({eventForm: true, groupId})}`}>
                      New event
                    </Link>
                  </HoverOver>
                </SectionButton>}
              {canEditGroup &&
                (!isEAForum || isAdmin || isGroupAdmin) &&
                  <GroupFormLink documentId={groupId} />
              }
            </SectionFooter>
          </div>
        </div>
        
        <ContentStyles contentType="post" className={classes.groupDescription}>
          {group.contents && <ContentItemBody
            dangerouslySetInnerHTML={htmlBody}
            className={classes.groupDescriptionBody}
            description={`group ${groupId}`}
          />}
        </ContentStyles>

        <PostsList2 terms={{view: 'nonEventGroupPosts', groupId: groupId}} showNoResults={false} />
        
        {(groupHasContactInfo || smallMap) && <div className={classes.contactUsSection}>
          {groupHasContactInfo && <div className={classes.externalLinkBtns}>
            <Typography variant="headline" className={classes.contactUsHeadline}>
              {preferredHeadingCase("Contact Us")}
            </Typography>
            <div>
              {group.facebookLink && <div className={classes.externalLinkBtnRow}>
                <Button
                  variant="contained" color="primary"
                  href={group.facebookLink}
                  target="_blank" rel="noopener noreferrer"
                  className={classes.externalLinkBtn}
                >
                  <FacebookIcon className={classes.facebookGroupIcon} />
                  See our Facebook group
                </Button>
              </div>}
              {group.facebookPageLink && <div className={classes.externalLinkBtnRow}>
                <Button
                  variant="contained" color="primary"
                  href={group.facebookPageLink}
                  target="_blank" rel="noopener noreferrer"
                  className={classes.externalLinkBtn}
                >
                  <RoundFacebookIcon className={classes.facebookPageIcon} />
                  Learn more on our Facebook page
                </Button>
              </div>}
              {group.meetupLink && <div className={classes.externalLinkBtnRow}>
                <Button
                  variant="contained" color="primary"
                  href={group.meetupLink}
                  target="_blank" rel="noopener noreferrer"
                  className={classes.externalLinkBtn}
                >
                  <MeetupIcon className={classes.meetupIcon} />
                  Find us on Meetup
                </Button>
              </div>}
              {group.slackLink && <div className={classes.externalLinkBtnRow}>
                <Button
                  variant="contained" color="primary"
                  href={group.slackLink}
                  target="_blank" rel="noopener noreferrer"
                  className={classes.externalLinkBtn}
                >
                  <SlackIcon className={classes.slackIcon} />
                  Join us on Slack
                </Button>
              </div>}
              {group.website && <div className={classes.externalLinkBtnRow}>
                <Button
                  variant="outlined" color="primary"
                  href={group.website}
                  target="_blank" rel="noopener noreferrer"
                  className={classes.externalLinkBtn}
                >
                  <ForumIcon icon="Link" className={classes.linkIcon} />
                  Explore our website
                </Button>
              </div>}
              {group.contactInfo && <div className={classes.externalLinkBtnRow}>
                <Button variant="outlined" color="primary" href={`mailto:${group.contactInfo}`} className={classes.externalLinkBtn}>
                  <EmailIcon className={classes.emailIcon} />
                  Email the organizers
                </Button>
              </div>}
            </div>
          </div>}
          {smallMap}
        </div>}

        <Typography variant="headline" className={classes.eventsHeadline}>
          {preferredHeadingCase("Upcoming Events")}
        </Typography>
        {upcomingEventsList}

        {tbdEventsList}

        {pastEventsList}
        
        {((isAdmin || isGroupAdmin)) && <LocalGroupSubscribers groupId={groupId}/>}
      </SingleColumnSection>
    </div>
  )
}

export const LocalGroupPage = registerComponent('LocalGroupPage', LocalGroupPageInner, {styles});



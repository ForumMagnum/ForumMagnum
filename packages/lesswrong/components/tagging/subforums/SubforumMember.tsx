import React, { useRef, useState } from 'react';
import classNames from 'classnames';
import LocationIcon from '@/lib/vendor/@material-ui/icons/src/LocationOn'
import { registerComponent } from '../../../lib/vulcan-lib/components';
import { Link } from '../../../lib/reactRouterWrapper';
import {
  SocialMediaProfileField,
  SOCIAL_MEDIA_PROFILE_FIELDS,
} from '../../../lib/collections/users/helpers';
import { useCheckMeritsCollapse } from '../../common/useCheckMeritsCollapse';
import { nofollowKarmaThreshold } from '../../../lib/publicSettings';
import ProfilePhoto from "../../messaging/ProfilePhoto";
import ContentStyles from "../../common/ContentStyles";
import ContentItemBody from "../../common/ContentItemBody";
import { Typography } from "../../common/Typography";
import SocialMediaLink from "../../users/SocialMediaLink";

const COLLAPSED_SECTION_HEIGHT = 70

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    columnGap: 14,
  },
  photoLink: {
    '&:hover': {
      opacity: 0.8
    }
  },
  profileImage: {
    width: 50,
    height: 50,
    background: theme.palette.grey[100],
    'box-shadow': '3px 3px 1px ' + theme.palette.boxShadowColor(.25),
    '-webkit-box-shadow': '0px 0px 2px 0px ' + theme.palette.boxShadowColor(.25),
    '-moz-box-shadow': '3px 3px 1px ' + theme.palette.boxShadowColor(.25),
    borderRadius: '50%',
  },
  name: {
    marginBottom: 4
  },
  displayName: {
    fontSize: 16,
    lineHeight: '22px',
    fontWeight: 700,
    display: '-webkit-box',
    "-webkit-line-clamp": 2,
    "-webkit-box-orient": 'vertical',
    overflow: 'hidden',
  },
  userTags: {
    display: 'flex',
    marginBottom: 8
  },
  userTag: {
    backgroundColor: theme.palette.background.primaryDim,
    color: theme.palette.text.primaryDarkOnDim,
    fontFamily: theme.typography.fontFamily,
    fontSize: 11,
    padding: '5px 11px',
    borderRadius: 14
  },
  role: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 12,
    lineHeight: '18px',
    marginBottom: 4
  },
  locationRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    columnGap: 20,
    rowGap: '9px',
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.grey[700],
    fontSize: 12,
    marginBottom: 6
  },
  location: {
    display: 'flex',
    alignItems: 'center',
    columnGap: 3,
  },
  locationIcon: {
    fontSize: 14,
  },
  socialMediaIcons: {
    display: 'flex',
    columnGap: 6,
  },
  socialMediaIcon: {
    flex: 'none',
    height: 16,
    fill: theme.palette.grey[600],
  },
  bio: {
  },
  bioContentStyles: {
    fontSize: '1rem',
  },
  collapsedBio: {
    position: 'relative',
    height: COLLAPSED_SECTION_HEIGHT,
    cursor: "pointer",
    overflow: 'hidden',
    '&::after': {
      position: 'absolute',
      bottom: 0,
      width: '100%',
      height: 40,
      content: "''",
      background: `linear-gradient(to top, ${theme.palette.grey[0]}, transparent)`,
    }
  },
  sectionSubHeading: {
    fontFamily: theme.typography.postStyle.fontFamily,
    fontSize: 13,
    fontWeight: 600,
    marginTop: 20,
    marginBottom: 6
  },
  showMoreButton: {
    fontFamily: theme.typography.fontFamily,
    background: 'none',
    color: theme.palette.primary.main,
    fontSize: 10,
    letterSpacing: 0.2,
    padding: 0,
    marginTop: 6,
    '&:hover': {
      opacity: 0.5
    },
  },
  showLess: {
    marginTop: 10
  },
})


const SubforumMember = ({user, isOrganizer, classes}: {
  user: UsersProfile,
  isOrganizer?: boolean,
  classes: ClassesType<typeof styles>,
}) => {
  const bioRef = useRef<HTMLDivElement>(null)
  
  const meritsCollapse = useCheckMeritsCollapse({
    ref: bioRef,
    height: COLLAPSED_SECTION_HEIGHT
  })
  // this tracks whether the bio section is collapsed or expanded
  const [collapsed, setCollapsed] = useState(true)
  const userHasSocialMedia = Object.keys(SOCIAL_MEDIA_PROFILE_FIELDS).some((field: keyof typeof SOCIAL_MEDIA_PROFILE_FIELDS) => user[field])
  
  const userKarma = user.karma || 0
  const bioNode = (
    user.htmlBio ||
    user.howICanHelpOthers?.html
  ) && <>
    <div
      className={classNames(classes.bio, {[classes.collapsedBio]: collapsed && meritsCollapse})}
      ref={bioRef}
      onClick={() => setCollapsed(false)}
    >
      {user.htmlBio && <ContentStyles contentType="post" className={classes.bioContentStyles}>
        <ContentItemBody
          dangerouslySetInnerHTML={{__html: user.htmlBio }}
          description={`user ${user._id} bio`}
          nofollow={userKarma < nofollowKarmaThreshold.get()}
        />
      </ContentStyles>}
      {user.howICanHelpOthers?.html && <>
        <div className={classes.sectionSubHeading}>How I can help others</div>
        <ContentStyles contentType="post" className={classes.bioContentStyles}>
          <ContentItemBody dangerouslySetInnerHTML={{__html: user.howICanHelpOthers.html }} nofollow={userKarma < nofollowKarmaThreshold.get()}/>
        </ContentStyles>
      </>}
    </div>
    {meritsCollapse && <button className={classNames(classes.showMoreButton, {[classes.showLess]: !collapsed})} onClick={() => setCollapsed(!collapsed)}>
      {collapsed ? "SHOW MORE" : "SHOW LESS"}
    </button>}
  </>
  
  return <div className={classes.root}>
    <div>
      <ProfilePhoto user={user} from="subforum_members" />
    </div>
    <div>
      <Typography variant="headline" className={classes.name} component="div">
        <Link to={`/users/${user.slug}?from=subforum_members`} className={classes.displayName}>
          {user.displayName}
        </Link>
      </Typography>
      {isOrganizer && <div className={classes.userTags}>
        <div className={classes.userTag}>
          Organizer
        </div>
      </div>}
      {(user.jobTitle || user.organization) && <div className={classes.role}>
        {user.jobTitle} {user.organization ? `@ ${user.organization}` : ''}
      </div>}
      {(user.mapLocation || userHasSocialMedia) && <div className={classes.locationRow}>
        {user.mapLocation && <div className={classes.location}>
          <LocationIcon className={classes.locationIcon} />
          {user.mapLocation.formatted_address}
        </div>}
        {userHasSocialMedia && <div className={classes.socialMediaIcons}>
          {Object
            .keys(SOCIAL_MEDIA_PROFILE_FIELDS)
            .map((field: SocialMediaProfileField) =>
              <SocialMediaLink
                key={field}
                user={user}
                field={field}
                className={classes.socialMediaIcon}
              />
            )
          }
        </div>}
      </div>}
      {bioNode}
    </div>
  </div>
}

export default registerComponent(
  'SubforumMember', SubforumMember, {styles}
);



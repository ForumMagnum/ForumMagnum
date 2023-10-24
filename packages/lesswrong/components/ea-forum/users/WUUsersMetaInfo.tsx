import React from 'react'
import {Components, registerComponent} from '../../../lib/vulcan-lib'

const styles = (theme: ThemeType): JssStyles => ({
  iconsRow: {
    display: 'flex',
    flexDirection: 'column',
    fontSize: 14,
    marginTop: '1em',
  },
  userMetaInfo: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '1em',
  },
  userMetaInfoIcon: {
    fontSize: 18,
    marginRight: '0.5em',
  },
  dateGap: {
    marginRight: '0.5em',
    marginLeft: '0.5em',
  },
})

const WUUsersMetaInfo = ({user, classes}: {
  user: UsersProfile,
  classes: ClassesType,
}) => {
  const {ContentStyles, ForumIcon, FormatDate, SocialMediaLink, LWTooltip, SocialMediaIcon} = Components

  return (
    <ContentStyles contentType="comment" className={classes.iconsRow}>
      <div className={classes.userMetaInfo}>
        {user.first_name} {user.last_name}
      </div>
      {user.mapLocation && <div className={classes.userMetaInfo}>
        <ForumIcon icon="MapPin" className={classes.userMetaInfoIcon}/>
        {user.mapLocation.formatted_address}
      </div>}
      <div className={classes.userMetaInfo}>
        <ForumIcon icon="CalendarDays" className={classes.userMetaInfoIcon}/>
        <span>Joined Community <FormatDate date={user.createdAt} format={'MM/YYYY'}/></span>
        <span className={classes.dateGap}>•</span>
        <span>Waking Up Member Since <FormatDate date={user.wu_created_at!} format={'MM/YYYY'}/></span>
      </div>
    </ContentStyles>
  )
}

const WUUsersMetaInfoComponent = registerComponent(
  'WUUsersMetaInfo',
  WUUsersMetaInfo,
  {styles},
)

declare global {
  interface ComponentTypes {
    WUUsersMetaInfo: typeof WUUsersMetaInfoComponent
  }
}

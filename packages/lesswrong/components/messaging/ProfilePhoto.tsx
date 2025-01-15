import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import AccountCircleIcon from '@material-ui/icons/AccountCircle';
import classNames from 'classnames';
import { Link } from '../../lib/reactRouterWrapper';

export const PROFILE_IMG_DIAMETER = 36
export const PROFILE_IMG_DIAMETER_MOBILE = 26

const styles = (theme: ThemeType) => ({
  img: {
    height: PROFILE_IMG_DIAMETER,
    width: PROFILE_IMG_DIAMETER,
    borderRadius: '50%',
    [theme.breakpoints.down('xs')]: {
      height: PROFILE_IMG_DIAMETER_MOBILE,
      width: PROFILE_IMG_DIAMETER_MOBILE
    }
  },
  emptyProfileImg: {
    color: theme.palette.grey[400],
    fontSize: PROFILE_IMG_DIAMETER,
    [theme.breakpoints.down('xs')]: {
      fontSize: PROFILE_IMG_DIAMETER_MOBILE,
    }
  },
  defaultProfileImg: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: theme.palette.grey[400],
    color: theme.palette.grey[0],
    fontFamily: theme.typography.fontFamily,
    fontSize: PROFILE_IMG_DIAMETER/2,
    textTransform: 'uppercase',
    overflow: 'hidden',
    [theme.breakpoints.down('xs')]: {
      fontSize: PROFILE_IMG_DIAMETER_MOBILE/2,
    }
  },
  profileImg: {
    'box-shadow': `3px 3px 1px ${theme.palette.boxShadowColor(.25)}`,
    '-webkit-box-shadow': `0px 0px 2px 0px ${theme.palette.boxShadowColor(.25)}`,
    '-moz-box-shadow': `3px 3px 1px ${theme.palette.boxShadowColor(.25)}`,
  },
})

const getUserInitials = (displayName: string) => {
  // TODO: include uppercase char that comes after lowercase char
  return displayName.split(/[\s_\-.]/).reduce((prev, next) => {
    if (!next.length || prev.length > 1) {
      return prev
    }
    return `${prev}${next[0]}`
  }, '')
}

/**
 * In most places where we use profile photos, if we don't have one to show, we can just show nothing.
 * So far the only exceptions are in private messaging, search results, and subforums,
 * where we didn't like how the layout looked with that empty space.
 * So this component includes a couple fallbacks in case the user has no photo.
 */
const ProfilePhoto = ({user, noLink=false, from, className, classes}: {
  user: {
    slug: string,
    profileImageId?: string,
    displayName?: string
  }|null,
  noLink?: boolean,
  from?: string,
  className?: string,
  classes: ClassesType<typeof styles>,
}) => {
  // placeholder icon, in case nothing else is available
  let imgNode = <AccountCircleIcon
    viewBox="3 3 18 18"
    className={classNames(classes.img, classes.emptyProfileImg)}
  />
  
  // if for some reason we have no user, just show the placeholder icon
  if (!user) {
    return <div className={className}>
      {imgNode}
    </div>
  }
  
  if (user.profileImageId) {
    // use the profile photo if possible
    imgNode = <Components.CloudinaryImage2
      imgProps={{q: '100', h: `${PROFILE_IMG_DIAMETER*2}`, w: `${PROFILE_IMG_DIAMETER*2}`}}
      publicId={user.profileImageId}
      className={classNames(classes.img, classes.profileImg)}
    />
  } else if (user.displayName) {
    // if the user has no profile photo, default to using their initials
    // TODO: instead of a single grey background, randomly assign a color
    imgNode = <div className={classNames(classes.img, classes.defaultProfileImg)}>
      {getUserInitials(user.displayName)}
    </div>
  }
  
  return noLink ? <div className={className}>
    {imgNode}
  </div> : <Link to={`/users/${user.slug}${from ? `?from=${from}` : ''}`} className={className}>
    {imgNode}
  </Link>
}


const ProfilePhotoComponent = registerComponent('ProfilePhoto', ProfilePhoto, {styles});

declare global {
  interface ComponentTypes {
    ProfilePhoto: typeof ProfilePhotoComponent
  }
}


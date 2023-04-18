import { Components, getFragment, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import { useCurrentUser } from '../common/withUser';
import Users from '../../lib/vulcan-users';
import { userCanEditUser, userGetProfileUrl } from '../../lib/collections/users/helpers';
import { useLocation, useNavigation } from '../../lib/routeUtil';
import { Link } from '../../lib/reactRouterWrapper';
import { forumTypeSetting } from '../../lib/instanceSettings';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    maxWidth: 800,
    margin: '0 auto'
  },
  heading: {
    marginTop: 0,
    [theme.breakpoints.down('sm')]: {
      paddingTop: 30
    }
  },
  subheading: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 13,
    lineHeight: '20px',
    color: theme.palette.grey[700],
    marginBottom: 40
  },
  importTextDesktop: {
    marginLeft: 6,
    [theme.breakpoints.down('sm')]: {
      display: 'none'
    }
  },
  importTextMobile: {
    display: 'none',
    [theme.breakpoints.down('sm')]: {
      display: 'inline',
      marginLeft: 6,
    }
  },
  importLink: {
    color: theme.palette.primary.main
  }
})

const EditProfileForm = ({classes}: {
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser()
  const { history } = useNavigation()
  const { params } = useLocation()
  
  const { Typography, WrappedSmartForm } = Components
  
  let terms: {slug?: string, documentId?: string} = {}
  if (params.slug) {
    terms.slug = params.slug
  } else if (currentUser) {
    terms.documentId = currentUser._id
  }

  // no matching user
  if ((!terms.slug && !terms.documentId) || !currentUser) {
    return (
      <div className={classes.root}>
        Log in to edit your profile
      </div>
    );
  }
  // current user doesn't have edit permission
  if (!userCanEditUser(currentUser,
    terms.documentId ?
      {_id: terms.documentId} :
      // HasSlugType wants a bunch of fields we don't have (schemaVersion, _id),
      // but userCanEdit won't use them
      {slug: terms.slug, __collectionName: 'Users'} as HasSlugType
  )) {
    return <div className={classes.root}>
      Sorry, you do not have permission to do this at this time.
    </div>
  }
  
  return (
    <div className={classes.root}>
      <Typography variant="display3" className={classes.heading} gutterBottom>
        Edit Public Profile
      </Typography>
      <div className={classes.subheading}>
        All fields are optional.
        {forumTypeSetting.get() === 'EAForum' && (terms.slug === currentUser.slug || terms.documentId === currentUser._id) && <>
          <span className={classes.importTextDesktop}>
            You may also <Link to="/profile/import" className={classes.importLink}>import profile data from your latest EA Global application</Link>.
          </span>
          <span className={classes.importTextMobile}>To import EA Global data, please view this page on desktop.</span>
        </>}
      </div>
      
      <WrappedSmartForm
        collectionName="Users"
        {...terms}
        fields={[
          'profileImageId',
          'jobTitle',
          'organization',
          'careerStage',
          'mapLocation',
          'website',
          'biography',
          'howOthersCanHelpMe',
          'howICanHelpOthers',
          'linkedinProfileURL',
          'facebookProfileURL',
          'twitterProfileURL',
          'githubProfileURL',
          'profileTagIds',
          'organizerOfGroupIds',
          'programParticipation',
        ]}
        excludeHiddenFields={false}
        queryFragment={getFragment('UsersProfileEdit')}
        mutationFragment={getFragment('UsersProfileEdit')}
        successCallback={async (user: AnyBecauseTodo) => {
          history.push(userGetProfileUrl(user))
        }}
      />
    </div>
  )
}


const EditProfileFormComponent = registerComponent('EditProfileForm', EditProfileForm, {styles});

declare global {
  interface ComponentTypes {
    EditProfileForm: typeof EditProfileFormComponent
  }
}

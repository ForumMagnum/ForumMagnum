import { Components, getFragment, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import { useCurrentUser } from '../common/withUser';
import { userCanEditUser, userGetProfileUrl } from '../../lib/collections/users/helpers';
import { useLocation, useNavigation } from '../../lib/routeUtil';
import { Link } from '../../lib/reactRouterWrapper';
import { isEAForum } from '../../lib/instanceSettings';
import { useCookiesWithConsent } from '../hooks/useCookiesWithConsent';
import { HIDE_IMPORT_EAG_PROFILE } from '../../lib/cookies/cookies';
import { userHasEagProfileImport } from '../../lib/betas';
import moment from 'moment';

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
  eagImport: {
    display: "flex",
    alignItems: "center",
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 14,
    fontWeight: 500,
    color: theme.palette.primary.main,
    background: theme.palette.primaryAlpha(0.05),
    padding: 16,
    margin: "16px 0",
    borderRadius: theme.borderRadius.default,
  },
  importTextDesktop: {
    flexGrow: 1,
    marginLeft: 6,
    [theme.breakpoints.down('sm')]: {
      display: 'none'
    },
  },
  importTextMobile: {
    flexGrow: 1,
    display: 'none',
    [theme.breakpoints.down('sm')]: {
      display: 'inline',
      marginLeft: 6,
    },
  },
  importLink: {
    textDecoration: "underline",
  },
  dismissImport: {
    height: 16,
    cursor: "pointer",
  },
})

const EditProfileForm = ({classes}: {
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser()
  const { history } = useNavigation()
  const { params } = useLocation()
  const [cookies, setCookie] = useCookiesWithConsent([
    HIDE_IMPORT_EAG_PROFILE,
  ]);

  const {Typography, ForumIcon, WrappedSmartForm} = Components

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

  const showEAGImport = userHasEagProfileImport(currentUser) &&
    cookies[HIDE_IMPORT_EAG_PROFILE] !== "true" &&
    (terms.slug === currentUser.slug || terms.documentId === currentUser._id);

  const dismissEAGImport = () => {
    setCookie(HIDE_IMPORT_EAG_PROFILE, "true", {
      expires: moment().add(30, 'days').toDate(),
      path: "/",
    });
  }

  return (
    <div className={classes.root}>
      <Typography variant="display3" className={classes.heading} gutterBottom>
        {isEAForum ? "Edit profile" : "Edit Public Profile"}
      </Typography>

      {!isEAForum &&
        <div className={classes.subheading}>
          All fields are optional.
        </div>
      }

      {showEAGImport &&
        <div className={classes.eagImport}>
          <span className={classes.importTextDesktop}>
            You can <Link to="/profile/import" className={classes.importLink}>import profile data</Link>
            {" "}from your latest EA Global application.
          </span>
          <span className={classes.importTextMobile}>
            To import EA Global data, please view this page on desktop.
          </span>
          <ForumIcon
            icon="Close"
            onClick={dismissEAGImport}
            className={classes.dismissImport}
          />
        </div>
      }

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

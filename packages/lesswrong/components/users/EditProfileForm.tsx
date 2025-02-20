import { Components, getFragment, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import { useCurrentUser } from '../common/withUser';
import { userCanEditUser, userGetProfileUrl } from '../../lib/collections/users/helpers';
import { useLocation } from '../../lib/routeUtil';
import { Link, useNavigate } from '../../lib/reactRouterWrapper';
import { isEAForum } from '../../lib/instanceSettings';
import { useCookiesWithConsent } from '../hooks/useCookiesWithConsent';
import { HIDE_IMPORT_EAG_PROFILE } from '../../lib/cookies/cookies';
import { userHasEagProfileImport } from '../../lib/betas';
import moment from 'moment';
import { isFriendlyUI, preferredHeadingCase } from '@/themes/forumTheme';

const styles = (theme: ThemeType) => ({
  root: isFriendlyUI
    ? {
      margin: "0 auto",
      maxWidth: 700,
      marginTop: 32,
      fontFamily: theme.palette.fonts.sansSerifStack,
    }
    : {
      margin: "0 auto",
      maxWidth: 800,
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
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser()
  const navigate = useNavigate();
  const { params } = useLocation()
  const [cookies, setCookie] = useCookiesWithConsent([
    HIDE_IMPORT_EAG_PROFILE,
  ]);

  const {
    Typography, ForumIcon, WrappedSmartForm, FormGroupFriendlyUserProfile,
  } = Components;

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
  const userInfo = terms.documentId ? {_id: terms.documentId} : terms.slug ? {slug: terms.slug} : null;
  if (!userInfo || !userCanEditUser(currentUser, userInfo)) {
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
      <Typography
        variant="display3"
        gutterBottom={!isFriendlyUI}
        className={classes.heading}
      >
        {preferredHeadingCase(isFriendlyUI ? "Edit Profile" : "Edit Public Profile")}
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
          ...(isFriendlyUI ? ['displayName'] : []), // In UsersEditForm ("Account settings") in book UI
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
          'blueskyProfileURL',
          'twitterProfileURL',
          'githubProfileURL',
          'profileTagIds',
          'organizerOfGroupIds',
          'programParticipation',
        ]}
        formComponents={{
          FormGroupLayout: isFriendlyUI ? FormGroupFriendlyUserProfile : undefined,
        }}
        excludeHiddenFields={false}
        queryFragment={getFragment('UsersProfileEdit')}
        mutationFragment={getFragment('UsersProfileEdit')}
        successCallback={async (user: AnyBecauseTodo) => {
          navigate(userGetProfileUrl(user))
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

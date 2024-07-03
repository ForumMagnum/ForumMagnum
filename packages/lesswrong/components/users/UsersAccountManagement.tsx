import { Components, registerComponent, getFragment } from '../../lib/vulcan-lib';
import { useMessages } from '../common/withMessages';
import React from 'react';
import { getUserEmail, userCanEditUser, userGetDisplayName, userGetProfileUrl} from '../../lib/collections/users/helpers';
import Button, { ButtonProps } from '@material-ui/core/Button';
import { useCurrentUser } from '../common/withUser';
import { gql, useMutation, useApolloClient } from '@apollo/client';
import { useThemeOptions, useSetTheme } from '../themes/useTheme';
import { captureEvent } from '../../lib/analyticsEvents';
import { configureDatadogRum } from '../../client/datadogRum';
import { preferredHeadingCase } from '../../themes/forumTheme';
import { useNavigate } from '../../lib/reactRouterWrapper';

// const styles = (theme: ThemeType) => ({
//   root: {
//     marginRight:theme.spacing.unit*3,
//     marginTop: 5,
//     display: "flex",
//     alignItems: "center"
//   },
//   size: {
//     width:36,
//     height:0
//   },
//   inline: {
//     display: "inline",
//     cursor: "pointer",
//   },
//   blurb: {
//     fontSize: 14,
//     lineHeight: '20px',
//     fontWeight: 500,
//     color: theme.palette.grey[800]
//   },
//   warningButton: {
//     border: `1px solid ${theme.palette.error.main} !important`,
//     color: theme.palette.error.main
//   }
// })

// // TODO rename
// const FormComponentNowCheckbox = (
//   { classes, value, updateCurrentValues, ...otherProps }: FormComponentProps<boolean> & {
//     classes: ClassesType<typeof styles>
//   }
// ) => {
//   const { FormComponentCheckbox, EAButton } = Components;

//   return (
//     <>
//       <div>
//         <p className={classes.blurb}>
//           Deactivating your account means your posts and comments will be listed as '[Anonymous]', and your user profile
//           won't accessible. This can be reversed at any time.
//         </p>
//         <EAButton variant="contained">Deactivate account</EAButton>
//         <p className={classes.blurb}>
//           Permanently delete your data from the Forum and associated services, in compliance with GDPR. You will be asked
//           for confirmation before continuing.
//         </p>
//         <EAButton className={classes.warningButton} variant="outlined">
//           Request permanent account deletion
//         </EAButton>
//       </div>
//     </>
//   );
// };

// const FormComponentNowCheckboxComponent = registerComponent("FormComponentNowCheckbox", FormComponentNowCheckbox, { styles });

// declare global {
//   interface ComponentTypes {
//     FormComponentNowCheckbox: typeof FormComponentNowCheckboxComponent
//   }
// }



const styles = (theme: ThemeType): JssStyles => ({
  // TODO share these styles with UsersEditForm
  root: {
    width: "60%",
    maxWidth: 600,
    margin: "auto",
    marginBottom: 100,
    [theme.breakpoints.down('xs')]: {
      width: "100%",
    }
  },
  header: {
    margin: theme.spacing.unit * 2,
    marginBottom: theme.spacing.unit * 4,
    [theme.breakpoints.down('md')]: {
      marginLeft: theme.spacing.unit/2,
    },
  },
  resetButton: {
    marginBottom:theme.spacing.unit * 4
  },

  // Styles for ActionButtonSection:
  actionSectionRoot: {},
  size: {
    width:36,
    height:0
  },
  inline: {
    display: "inline",
    cursor: "pointer",
  },
  blurb: {
    fontSize: 14,
    lineHeight: '20px',
    fontWeight: 500,
    color: theme.palette.grey[800]
  },
  warningButton: {
    border: `1px solid ${theme.palette.error.main} !important`,
    color: theme.palette.error.main
  }
})

const ActionButtonSection = ({
  classes,
  buttonText,
  buttonProps,
  description,
  onClick,
}: {
  classes: ClassesType;
  buttonText: string;
  buttonProps: Partial<ComponentProps<typeof Components.EAButton>>;
  description: string;
  onClick: () => void;
}) => {
  const { EAButton } = Components;

  return (
    <div>
      <p className={classes.blurb}>{description}</p>
      <EAButton {...buttonProps} onClick={onClick}>
        {buttonText}
      </EAButton>
    </div>
  );
};

const UsersAccountManagement = ({terms, classes}: {
  terms: {slug: string},
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();
  const { flash } = useMessages();
  const { Typography, ErrorAccessDenied, DummyFormGroup } = Components;

  if(!userCanEditUser(currentUser, terms)) {
    return <ErrorAccessDenied />;
  }
  const isCurrentUser = (terms.slug === currentUser?.slug)

  return (
    <div className={classes.root}>
      <Typography variant="display2" className={classes.header}>
        {preferredHeadingCase("Manage Account")}
      </Typography>
      <DummyFormGroup
        label={"Deactivate account"}
        startCollapsed={true}
      >
        <ActionButtonSection
          // TODO copy
          description="Deactivating your account means your posts and comments will be listed as '[Anonymous]', and your user profile won't accessible. This can be reversed at any time."
          buttonText={"Deactivate account"}
          buttonProps={{variant: "contained"}}
          classes={classes}
          onClick={() => {}}
        />
        <ActionButtonSection
          // TODO copy
          description="Deleting your account will permanently remove your data from the Forum and associated services. You will be asked for confirmation before continuing."
          buttonText={"Deactivate account"}
          buttonProps={{variant: "outlined", className: classes.warningButton}}
          classes={classes}
          onClick={() => {}}
        />
      </DummyFormGroup>
    </div>
  );
};


const UsersAccountManagementComponent = registerComponent('UsersAccountManagement', UsersAccountManagement, {styles});

declare global {
  interface ComponentTypes {
    UsersAccountManagement: typeof UsersAccountManagementComponent
  }
}

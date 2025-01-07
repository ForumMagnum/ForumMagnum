import { Components, registerComponent, getFragment } from '../../lib/vulcan-lib';
import { useMessages } from '../common/withMessages';
import React from 'react';
import { useCurrentUser } from '../common/withUser';
import { legacyBreakpoints } from '../../lib/utils/theme';
import { isFriendlyUI } from '../../themes/forumTheme';
import { useNavigate } from '../../lib/reactRouterWrapper';

// Also used by SequencesEditForm
export const styles = (theme: ThemeType) => ({
  sequencesForm: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
  
    "& .input-title .form-input-errors": {
      backgroundColor: theme.palette.panelBackground.formErrors,
      width: "100%",
      textAlign: "center",
      margin: "0 !important",
  
      "& li": {
        position: "relative",
        left: -230,
        top: 3,
        zIndex: 3,
        [theme.breakpoints.down('sm')]: {
          left: 0,
        }
      }
    },
    
    "& .input-contents": {
      marginTop: 20,
    },
  
    "& .editor-form-component": {
      maxWidth: 650,
      margin: "auto",
      position: "relative",
      padding: 10,
    },
  
    "& .form-input-errors": {
      fontSize: "1em",
      zIndex: 2,
      textAlign: "left",
    },

    '& .form-component-EditorFormComponent': {
      marginTop: 30
    },
  
    "& .vulcan-form": {
      position: "absolute",
      width: "100%",
      paddingBottom: 50,
      overflow: "hidden",
  
      "& .form-input, & .FormGroupLayout-formSection": {
        maxWidth: 640,
        position: "relative !important",
        left: 45,
        marginLeft: "auto",
        marginRight: "auto",
        [theme.breakpoints.down('sm')]: {
          left: 0,
          padding: "0 10px",
        },
        "& .form-input": {
          left: 0
        }
      },
      "& .form-input.input-title, &.input-bannerImageId": {
        maxWidth: "100%",
        width: "100%",
        margin: 0,
        left: 0,
        padding: 0,
      },
      "& > form > .form-errors": {
        display: "none",
      },
      "& .form-input.form-component-checkbox > .form-group > label": {
        display: "none",
      },
      "& .form-input.input-bannerImageId": {
        marginTop: 65,
        position: "absolute !important",
        left: 0,
        maxWidth: "100%",
        '& img': {
          width: "100% !important",
          height: "380px !important",
        },
        '& .ImageUpload-root': {
          marginLeft: '0 !important',
          paddingTop: '0 !important'
        },
  
        [theme.breakpoints.down('sm')]: {
          marginTop: 40,
          padding: 0,
        },
        "& .form-input-errors": {
          position: "absolute",
          top: isFriendlyUI ? 84 : 45,
          left: 7,
          textAlign: "left",
        }
      }
    },
  
    "& .form-submit": {
      width: 200,
      margin: "0 auto",
    },
    
    
    "& .input-bannerImageId": {
      "& .image-upload-button": {
        position: "absolute !important",
        left: 15,
        top: 15,
        [theme.breakpoints.down('sm')]: {
          left: 15,
          top: 50,
        },
      },
      "& .image-remove-button": {
        [theme.breakpoints.down('sm')]: {
          position: "absolute !important",
          left: 6,
          top: 102,
          background: theme.palette.buttons.imageUpload.background,
          "&:hover": {
            background: theme.palette.buttons.imageUpload.hoverBackground,
          },
          color: theme.palette.text.invertedBackgroundText,
        },
      },
    
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
    }
  },
});

const SequencesNewForm = ({ redirect, cancelCallback, removeSuccessCallback, classes }: {
  redirect: any,
  cancelCallback: any,
  removeSuccessCallback: any,
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();
  const { flash } = useMessages();
  const navigate = useNavigate();

  if (currentUser) {
    return (
      <div className={classes.sequencesForm}>
        <Components.WrappedSmartForm
          collectionName="Sequences"
          successCallback={(sequence: any) => {
            navigate({pathname: redirect || '/s/' + sequence._id });
            flash({messageString: "Successfully created Sequence", type: "success"});
          }}
          cancelCallback={cancelCallback}
          removeSuccessCallback={removeSuccessCallback}
          prefilledProps={{userId: currentUser._id}}
          queryFragment={getFragment('SequencesEdit')}
          mutationFragment={getFragment('SequencesPageFragment')}
        />
      </div>
    )
  } else {
    return <h3>You must be logged in to create a new sequence.</h3>
  }
}

const SequencesNewFormComponent = registerComponent('SequencesNewForm', SequencesNewForm, {styles});

declare global {
  interface ComponentTypes {
    SequencesNewForm: typeof SequencesNewFormComponent
  }
}

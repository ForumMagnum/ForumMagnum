import { isLW } from '@/lib/instanceSettings';

// Also used by PostsEditForm

export const styles = (theme: ThemeType) => ({
  postForm: {
    maxWidth: 715,
    margin: "0 auto",

    [theme.breakpoints.down('xs')]: {
      width: "100%",
    },

    "& .vulcan-form .input-draft, & .vulcan-form .input-frontpage": {
      margin: 0,
      [theme.breakpoints.down('xs')]: {
        width: 125,
      },

      "& .form-group.row": {
        marginBottom: 0,
      },

      "& .checkbox": {
        width: 150,
        margin: "0 0 6px 0",
        [theme.breakpoints.down('xs')]: {
          width: 150,
        }
      }
    },
    "& .document-new .input-frontpage .checkbox": {
      marginBottom: 12,
    },
    "& .document-new .input-draft .checkbox": {
      marginBottom: 12,
    },

    "& .vulcan-form .input-draft": {
      right: 115,
      width: 125,
      [theme.breakpoints.down('xs')]: {
        bottom: 50,
        right: 0,
        width: 100,

        "& .checkbox": {
          width: 100,
        }
      }
    },

    "& .vulcan-form .input-frontpage": {
      right: 255,
      width: 150,
      [theme.breakpoints.down('xs')]: {
        bottom: 50,
        right: 150,
        width: 100,
      }
    },

    "& .document-edit > div > hr": {
      // Ray Sept 2017:
      // This hack is necessary because SmartForm automatically includes an <hr/> tag in the "delete" menu:
      // path: /packages/vulcan-forms/lib/Form.jsx
      display: "none",
    },

    "& .form-submit": {
      textAlign: "right",
    },

    "& .form-input.input-url": {
      margin: 0,
      width: "100%"
    },
    "& .form-input.input-contents": {
      marginTop: 0,
    },
  },
  formSubmit: {
    display: "flex",
    flexWrap: "wrap",
    marginTop: 20
  },
  collaborativeRedirectLink: {
    color: theme.palette.secondary.main
  },
  modNote: {
    [theme.breakpoints.down('xs')]: {
      paddingTop: 20,
    },
    paddingLeft: 20,
    paddingRight: 20,
    paddingBottom: 20
  },
  editorGuideOffset: {
    paddingTop: isLW ? 80 : 100,
  },
  editorGuide: {
    display: 'flex',
    alignItems: 'center',
    fontFamily: theme.palette.fonts.sansSerifStack,
    padding: 10,
    borderRadius: theme.borderRadius.default,
    color: theme.palette.primary.main,
    [theme.breakpoints.up('lg')]: {
      width: 'max-content',
      paddingLeft: 20,
      paddingRight: 20
    },
  },
  editorGuideIcon: {
    height: 40,
    width: 40,
    fill: theme.palette.primary.main,
    marginRight: -4
  },
  editorGuideLink: {}
});

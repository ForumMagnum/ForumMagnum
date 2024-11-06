// TODO: Import component in components.ts
import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import { commentBodyStyles } from '@/themes/stylePiping';


export const postFormSectionStyles = (theme: ThemeType) => ({
  '& .FormGroupHeader-formSectionHeading': {
    padding: '4px 8px',
    opacity: .4,
    fontSize: '1.1rem',
    display: 'none',
    '&:hover': {
      opacity: 1,
    },
  },
  '& .FormGroupHeader-formSectionHeading.is-active': {
    display: 'block'
  },
  '& .form-section-heading-toggle': {
    display: 'none',
  },
  '& .FormGroupLayout-formSection': {
    border: 'none',
    backgroundColor: 'transparent', 
    marginBottom: 0,
  },
  '& .form-section-coauthors': {
    display: 'none',
  },
  '& .document-new': {
    display: 'flex',
    flexWrap: 'wrap',
  },
  '& .FormGroupPostTopBar-root': {
    width: '100%',
    opacity: .4,
    '&:hover': {
      opacity: 1,
    },
  },
  '& .FormGroupLayout-formSectionHeader': {
    '&:hover': {
      backgroundColor: theme.palette.grey[100],
    },
  },
  '& .form-component-EditorFormComponent': {
    width: 715,
    ...commentBodyStyles(theme),
    '& p, & li, & td, & th, & blockquote, & pre': {
      fontSize: "1.2rem",
      lineHeight: "1.6",
      ...commentBodyStyles(theme),
      color: theme.palette.grey[800],
    },
    '& b, & strong': {
      color: theme.palette.text.maxIntensity,
    },
    '& h1': {
      fontSize: "2.4rem",
      ...theme.typography.headerStyle
    },
    '& h2': {
      fontSize: "2rem",
      ...theme.typography.headerStyle
    },
    '& h3': {
      fontSize: "1.65rem",
      ...theme.typography.headerStyle
    },
    '& li': {
      fontSize: "1.2rem"
    }
  },
  '& .FormGroupLayout-formSectionBody': {
    width: 715,
    border: `1px solid ${theme.palette.grey[200]}`,
  },
  '& .FormGroupLayout-formSectionCollapsed': {
    width: 'unset !important',
  },
  '& .PostSubmit-feedback': {
    display: 'none',
  },
  '& .EditorFormComponent-postEditorHeight': {
    height: 350
  },
  '& .EditorTypeSelect-select': {
    display: 'none',
  },
  '& .SubmitToFrontpageCheckbox-submitToFrontpageWrapper': {
    display: 'none',
  },
  '& .PostsNewForm-formSubmit, & .PostsEditForm-formSubmit': {
    display: 'none',
  },

  '& .FormGroupPostTopBar-tabs': {
    display: 'none',
  },
  '& .form-section-glossary': {
    display: 'none',
  },
  '& .EditorFormComponent-select': {
    display: 'none',
  },
  '& .PostVersionHistoryButton-versionHistoryButton': {
    display: 'none',
  },
})


const styles = (theme: ThemeType) => ({
  root: {
  },
  formContainer: {
    maxWidth: 715,
    width: '100%',
    ...postFormSectionStyles(theme),
    marginLeft: "auto",
    marginRight: "auto",
  }
});

export const ThinkWrapper = ({classes, children, document}: {
  classes: ClassesType<typeof styles>,
  children: React.ReactNode,
  document?: SequencesPageWithChaptersFragment | PostsPage
}) => {
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components

  const { ThinkSideColumn } = Components;
  return <div className={classes.root}>
    <ThinkSideColumn document={document} />
    <div className={classes.formContainer}>
      {children}
    </div>
  </div>;
}

const ThinkWrapperComponent = registerComponent('ThinkWrapper', ThinkWrapper, {styles});

declare global {
  interface ComponentTypes {
    ThinkWrapper: typeof ThinkWrapperComponent
  }
}

// TODO: Import component in components.ts
import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";


const postFormSectionStyles = (theme: ThemeType) => ({
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
  '& .PostsNewForm-formSubmit': {
    display: 'none',
  },
  '& .FormGroupPostTopBar-tabs': {
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

export const ThinkWrapper = ({classes, children}: {
  classes: ClassesType<typeof styles>,
  children: React.ReactNode,
}) => {
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components

  const { ThinkSideColumn } = Components;
  return <div className={classes.root}>
    <ThinkSideColumn />
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

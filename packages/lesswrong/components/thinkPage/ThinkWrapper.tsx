// TODO: Import component in components.ts
import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import { commentBodyStyles } from '@/themes/stylePiping';
import { ToCData } from '@/lib/tableOfContents';

export const THINK_FORM_WIDTH = 640;

export const thinkTypography = (theme: ThemeType) => ({
  '& p, & li, & td, & th, & blockquote, & pre': {
    ...commentBodyStyles(theme),
    fontSize: "1.2rem",
    lineHeight: "1.6",
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
})

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
    width: THINK_FORM_WIDTH,
    ...commentBodyStyles(theme),
    ...thinkTypography(theme),
    '& p': {
      lineHeight: '1.4',
    },
    '& ul > li': {
      lineHeight: '1.4',
    },
    '& li li': {
      marginTop: '0 !important',
      marginBottom: '0 !important',
    },
    '& li li:last-child': {
      marginBottom: '1rem !important',
    },
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
  '& .EditorFormComponent-root': {
    marginTop: -8
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
  '& .PostsNewForm-formSubmit .PostSubmit-submitButtons': {
    justifyContent: 'flex-end',
    '& button:last-child': {
      display: 'none',
    },
  },
  '& .PostsEditForm-formSubmit': {
    display: "none"
  },
  '& .FormGroupPostTopBar-tabs': {
    display: 'none',
  },
  '& .form-section-tags': {
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
  '& .FormGroupLayout-formSectionPadding': {
    padding: '0 !important'
  }
})


const styles = (theme: ThemeType) => ({
  root: {
  },
  formContainer: {
    maxWidth: THINK_FORM_WIDTH,
    width: '100%',
    ...postFormSectionStyles(theme),
    marginLeft: "auto",
    marginRight: "auto",
  },
  centralColumn: {
    maxWidth: THINK_FORM_WIDTH
  }
});

export const ThinkWrapper = ({classes, children, document, sectionData, rightColumn}: {
  classes: ClassesType<typeof styles>,
  children: React.ReactNode,
  document?: SequencesPageWithChaptersFragment | PostsPage,
  sectionData?: ToCData | null,
  rightColumn?: React.ReactNode
}) => {
  const { ThinkSideColumn, MultiToCLayout } = Components;
  return <div className={classes.root}>
    <MultiToCLayout
        segments={[
          {
            toc: <ThinkSideColumn document={document} sectionData={sectionData} />,
            centralColumn: <div className={classes.centralColumn}>{children}</div>,
            rightColumn: rightColumn
          }
        ]}
        tocRowMap={[0, 0, 2]}
      />
  </div>;
}

const ThinkWrapperComponent = registerComponent('ThinkWrapper', ThinkWrapper, {styles});

declare global {
  interface ComponentTypes {
    ThinkWrapper: typeof ThinkWrapperComponent
  }
}

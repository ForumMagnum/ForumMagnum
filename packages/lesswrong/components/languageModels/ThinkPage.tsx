// TODO: Import component in components.ts
import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import { useCurrentUser } from '../common/withUser';
import { useLocation } from '@/lib/routeUtil';
import { useMulti } from '@/lib/crud/withMulti';

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
})

const styles = (theme: ThemeType) => ({
  root: {
    display: 'flex',
    gap: theme.spacing.unit * 4,
    padding: theme.spacing.unit * 2,
    justifyContent: 'space-between',
    ...theme.typography.commentStyle,
  },
  sidebarContainer: {
    width: 200,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.unit,
    ...theme.typography.body2,
  },
  formContainer: {
    maxWidth: 715,
    width: '100%',
    ...postFormSectionStyles(theme),
  },
  chatContainer: {
    position: 'sticky',
    top: 0,
    width: '100%',
    maxWidth: 300,
  }
});

export const ThinkPage = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components

  const { PostsNewForm, LanguageModelChat } = Components;
  const currentUser = useCurrentUser();
  const { query } = useLocation();

  const currentSorting = query.sortDraftsBy ?? query.view ?? currentUser?.draftsListSorting ?? "lastModified";


  const terms: PostsViewTerms = {
    view: "drafts",
    userId: currentUser?._id,
    sortDraftsBy: currentSorting,
    // includeArchived: !!query.includeArchived ? (query.includeArchived === 'true') : currentUser?.draftsListShowArchived,
    // includeShared: !!query.includeShared ? (query.includeShared === 'true') : (currentUser?.draftsListShowShared !== false),
  }
  
  const { results, loading, loadMoreProps } = useMulti({
    terms,
    collectionName: "Posts",
    fragmentName: 'PostsListWithVotes',
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: "cache-first",
  });

  return <div className={classes.root}>
    <div className={classes.sidebarContainer}>
      {results?.map((post) => <div key={post._id}>{post.title}</div>)}
    </div>
    <div className={classes.formContainer}>
      <PostsNewForm showTableOfContents={false} />
    </div>
    <div className={classes.chatContainer}>
      <LanguageModelChat hideHeader={true} />
    </div>
  </div>;
}

const ThinkPageComponent = registerComponent('ThinkPage', ThinkPage, {styles});

declare global {
  interface ComponentTypes {
    ThinkPage: typeof ThinkPageComponent
  }
}

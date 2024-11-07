// TODO: Import component in components.ts
import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import { Link } from '@/lib/reactRouterWrapper';

const styles = (theme: ThemeType) => ({
  root: {
    ...theme.typography.body2,
    color: theme.palette.grey[600]
  }
});

export const getThinkPostBaseUrl = (document: PostsListWithVotes) => {
  return `/think/posts/${document._id}/${document.slug}`
}

export const getThinkPostUrl = (document: PostsListWithVotes, forceEdit?: boolean) => {
  const edit = (document.draft || forceEdit) ? `?edit=true&key=${document.linkSharingKey}` : ''
  return `${getThinkPostBaseUrl(document)}${edit}`
}

export const getThinkSequenceUrl = (document: SequencesPageTitleFragment, forceEdit?: boolean) => {
  const edit = (document.draft || forceEdit) ? '?edit=true' : ''
  return `/think/sequences/${document._id}${edit}`
}

export const getThinkUrl = (document: PostsListWithVotes | SequencesPageTitleFragment, forceEdit?: boolean) => {
  if ('commentCount' in document) {
    return getThinkPostUrl(document as PostsListWithVotes, forceEdit)
  } else {
    return getThinkSequenceUrl(document as SequencesPageTitleFragment, forceEdit)
  }
}

export const ThinkLink = ({classes, document, title, forceEdit}: {
  classes: ClassesType<typeof styles>,
  document: PostsListWithVotes,
  title?: string,
  forceEdit?: boolean,
}) => {
  return <Link className={classes.root} to={getThinkUrl(document, forceEdit)}>
    {title ?? document.title}
  </Link>;
}

const ThinkLinkComponent = registerComponent('ThinkLink', ThinkLink, {styles});

declare global {
  interface ComponentTypes {
    ThinkLink: typeof ThinkLinkComponent
  }
}

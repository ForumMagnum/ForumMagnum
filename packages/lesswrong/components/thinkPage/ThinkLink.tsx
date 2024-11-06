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

export const getThinkUrl = (document: PostsListWithVotes) => {
  return document.draft ? `${getThinkPostBaseUrl(document)}?edit=true&key=${document.linkSharingKey}` : getThinkPostBaseUrl(document)
}


export const ThinkLink = ({classes, document, title}: {
  classes: ClassesType<typeof styles>,
  document: PostsListWithVotes,
  title?: string,
}) => {
  return <Link className={classes.root} to={getThinkUrl(document)}>
    {title ?? document.title}
  </Link>;
}

const ThinkLinkComponent = registerComponent('ThinkLink', ThinkLink, {styles});

declare global {
  interface ComponentTypes {
    ThinkLink: typeof ThinkLinkComponent
  }
}
